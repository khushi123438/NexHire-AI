import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../Api";

import AuroraBackground from "../components/background/AuroraBackground";
import AnimatedGrid from "../components/background/GridBackground";
import FloatingParticles from "../components/background/Floating";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatsCards from "../components/dashboard/StatsCards";
import ResumeUpload from "../components/dashboard/ResumeUpload";
import VoiceInterview from "../components/dashboard/VoiceInterview";
import ConversationHistory from "../components/dashboard/ConversationHistory";
import EvaluationPanel from "../components/dashboard/EvaluationPanel";
import RecruiterDecision from "../components/dashboard/RecruiterDecision";
import RoleInterviewSwitcher from "../components/dashboard/RoleInterviewSwitcher";
import { Briefcase, FileText, MessageSquare, Plus } from "lucide-react";

const STANDARD_ROLES = [
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist / AI Engineer",
  "DevOps / Cloud Engineer",
];

export default function Dashboard() {
  const [userName, setUserName] = useState("Candidate");
  const [currentRole, setCurrentRole] = useState("Software Development Engineer (SDE)");
  const [confirmedSkills, setConfirmedSkills] = useState([]);
  const [allResumes, setAllResumes] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Fetch User Data & Initial State
  const loadDashboardData = useCallback(async (selectedRole) => {
    const roleToLoad = selectedRole || currentRole;

    try {
      const userRes = await API.get("/auth/me");
      if (userRes.data?.user) {
        setUserName(userRes.data.user.name || "Candidate");
      }
    } catch (err) {
      console.log("Auth fetch fallback:", err.message);
      const localUser = localStorage.getItem("user");
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          setUserName(parsed.name || "Candidate");
        } catch (e) {}
      }
    }

    try {
      // Get all role resumes for this user and filter for active role
      const resumeRes = await API.get(`/resume/current?role=${encodeURIComponent(roleToLoad)}`);
      if (resumeRes.data?.resumes && Array.isArray(resumeRes.data.resumes)) {
        setAllResumes(resumeRes.data.resumes);
      }

      if (resumeRes.data?.hasResume && Array.isArray(resumeRes.data?.skills)) {
        setConfirmedSkills(resumeRes.data.skills);
      } else {
        setConfirmedSkills([]);
      }
    } catch (err) {
      setConfirmedSkills([]);
      setAllResumes([]);
    }

    try {
      // Get current active or latest interview session for this role
      const interviewRes = await API.get(`/interview/current?role=${encodeURIComponent(roleToLoad)}`);
      if (interviewRes.data?.interview) {
        setSession(interviewRes.data.interview);
        if (interviewRes.data.interview.skills?.length > 0) {
          setConfirmedSkills(interviewRes.data.interview.skills);
        }
      } else {
        setSession(null);
      }
    } catch (err) {
      setSession(null);
    }

    try {
      // Get all past role interviews
      const historyRes = await API.get("/interview/history");
      if (historyRes.data?.interviews && Array.isArray(historyRes.data.interviews)) {
        setAllInterviews(historyRes.data.interviews);
      }
    } catch (err) {
      setAllInterviews([]);
    }

    try {
      // Stats for this user
      const statsRes = await API.get("/interview/stats");
      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      setStats({
        resumes: 0,
        interviews: 0,
        aiScore: "--",
        hiring: "Not Started",
      });
    }
  }, [currentRole]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Google OAuth Redirects cleanly
  useEffect(() => {
    const loginStatus = searchParams.get("login");
    const signupStatus = searchParams.get("signup");

    if (loginStatus === "success") {
      toast.success("Welcome back to NexHire AI 👋", { id: "auth-toast" });
      navigate("/dashboard", { replace: true });
    } else if (signupStatus === "success") {
      toast.success("Account created successfully 🎉", { id: "auth-toast" });
      navigate("/dashboard", { replace: true });
    }
  }, [searchParams, navigate]);

  // Handle switching to a specific role
  const handleRoleSelect = async (roleName) => {
    if (!roleName) return;
    setIsLoadingRole(true);
    setCurrentRole(roleName);

    try {
      // 1. Fetch resume for this role
      const resumeRes = await API.get(`/resume/current?role=${encodeURIComponent(roleName)}`);
      if (resumeRes.data?.resumes) {
        setAllResumes(resumeRes.data.resumes);
      }
      if (resumeRes.data?.hasResume && Array.isArray(resumeRes.data?.skills)) {
        setConfirmedSkills(resumeRes.data.skills);
      } else {
        setConfirmedSkills([]);
      }

      // 2. Fetch session and conversation history for this role
      const interviewRes = await API.get(`/interview/current?role=${encodeURIComponent(roleName)}`);
      if (interviewRes.data?.interview) {
        setSession(interviewRes.data.interview);
        if (interviewRes.data.interview.skills?.length > 0) {
          setConfirmedSkills(interviewRes.data.interview.skills);
        }
      } else {
        setSession(null);
      }

      // 3. Refresh history
      const historyRes = await API.get("/interview/history");
      if (historyRes.data?.interviews) {
        setAllInterviews(historyRes.data.interviews);
      }

      toast(`Loaded dashboard for "${roleName}" 💼`, { icon: "🎯" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRole(false);
    }
  };

  const handleSessionUpdate = (updatedInterview) => {
    setSession(updatedInterview);
    if (updatedInterview?.targetRole) {
      setCurrentRole(updatedInterview.targetRole);
    }
    API.get("/interview/stats")
      .then((res) => {
        if (res.data?.stats) setStats(res.data.stats);
      })
      .catch(() => {});
    API.get("/interview/history")
      .then((res) => {
        if (res.data?.interviews) setAllInterviews(res.data.interviews);
      })
      .catch(() => {});
  };

  const handleSkillsConfirmed = (skills, role) => {
    setConfirmedSkills(skills || []);
    if (role && role !== currentRole) {
      handleRoleSelect(role);
    }
  };

  const handleStartNewRole = () => {
    setSession(null);
    const resumeSection = document.getElementById("resume-section");
    if (resumeSection) {
      resumeSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectPastInterview = (interviewItem) => {
    setSession(interviewItem);
    if (interviewItem.targetRole) {
      setCurrentRole(interviewItem.targetRole);
      // Fetch resume for that role too
      API.get(`/resume/current?role=${encodeURIComponent(interviewItem.targetRole)}`)
        .then((res) => {
          if (res.data?.skills) setConfirmedSkills(res.data.skills);
        })
        .catch(() => {});
    }
    toast.success(`Loaded session ${interviewItem.interviewId} (${interviewItem.targetRole})`);
  };

  const handleConversationCleared = (updatedInterview) => {
    if (updatedInterview) {
      setSession(updatedInterview);
    } else {
      setSession((prev) => (prev ? { ...prev, conversationHistory: [], evaluations: [] } : null));
    }
  };

  const handleMessageDeleted = (updatedInterview) => {
    if (updatedInterview) {
      setSession(updatedInterview);
    }
  };

  return (
    <div className="relative bg-[#050505] text-white overflow-hidden min-h-screen">
      <AuroraBackground />
      <AnimatedGrid />
      <FloatingParticles />

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Dashboard Header with User Greeting & Logout */}
          <DashboardHeader userName={userName} />

          {/* Real-time Summary Cards */}
          <StatsCards stats={stats} />

          {/* Role Selection Tabs / Selector Bar */}
          <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Active Role: <span className="text-yellow-400">{currentRole}</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Switch roles to access each role's saved resume and conversation history
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-gray-300 font-semibold flex items-center gap-1.5">
                  <FileText size={12} className="text-yellow-400" />
                  {allResumes.filter((r) => r.targetRole === currentRole).length > 0 ? "Resume Saved" : "No Resume"}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-gray-300 font-semibold flex items-center gap-1.5">
                  <MessageSquare size={12} className="text-green-400" />
                  {session?.conversationHistory?.length || 0} Chats
                </span>
              </div>
            </div>

            {/* Role Quick Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {STANDARD_ROLES.map((role) => {
                const isSelected = currentRole.toLowerCase() === role.toLowerCase();
                const hasResume = allResumes.some((r) => r.targetRole?.toLowerCase() === role.toLowerCase());
                const hasHistory = allInterviews.some((i) => i.targetRole?.toLowerCase() === role.toLowerCase());

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                      isSelected
                        ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                        : "bg-[#0A0A0A] border-yellow-500/10 text-gray-400 hover:border-yellow-400/40 hover:text-white"
                    }`}
                  >
                    <span>{role}</span>
                    <div className="flex items-center gap-1">
                      {hasResume && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-yellow-500/20 text-yellow-400 font-mono" title="Resume uploaded">
                          📄
                        </span>
                      )}
                      {hasHistory && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-green-500/20 text-green-400 font-mono" title="Interview history saved">
                          🎙️
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role-Wise Past Interviews Switcher & Delete Panel */}
          {allInterviews.length > 0 && (
            <RoleInterviewSwitcher
              interviews={allInterviews}
              activeInterviewId={session?.interviewId || session?._id}
              onSelectInterview={handleSelectPastInterview}
              onStartNewRole={handleStartNewRole}
            />
          )}

          {/* Module 1: Resume Upload & Module 2: Voice Interview Engine */}
          <div id="resume-section" className="grid lg:grid-cols-2 gap-6 items-stretch">
            <ResumeUpload
              onSkillsConfirmed={handleSkillsConfirmed}
              onRoleChange={handleRoleSelect}
              currentSkills={confirmedSkills}
              currentRole={currentRole}
              allResumes={allResumes}
              onResumeUpdated={() => loadDashboardData(currentRole)}
            />
            <VoiceInterview
              session={session}
              confirmedSkills={confirmedSkills}
              targetRole={currentRole}
              onSessionUpdate={handleSessionUpdate}
              onStartNewRole={handleStartNewRole}
            />
          </div>

          {/* Module 3: Conversation History & Module 4: Real-time Evaluation */}
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <ConversationHistory
              conversationHistory={session?.conversationHistory || []}
              interviewId={session?.interviewId || "INT12345"}
              targetRole={session?.targetRole || currentRole}
              sessionId={session?._id || session?.interviewId}
              onConversationCleared={handleConversationCleared}
              onMessageDeleted={handleMessageDeleted}
            />
            <EvaluationPanel
              latestEvaluation={
                session?.evaluations?.length > 0
                  ? session.evaluations[session.evaluations.length - 1]
                  : null
              }
              evaluations={session?.evaluations || []}
            />
          </div>

          {/* Module 5: Final Recruiter Decision (AI Generated) */}
          <RecruiterDecision
            decision={session?.decision}
            roundRecommendations={session?.roundRecommendations || []}
            candidateName={userName}
            targetRole={session?.targetRole || currentRole}
            skills={confirmedSkills}
          />
        </div>
      </div>
    </div>
  );
}