import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../Api";
import toast from "react-hot-toast";

const InterviewContext = createContext(null);

export const STANDARD_ROLES = [
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist / AI Engineer",
  "DevOps / Cloud Engineer",
];

export function InterviewProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("Candidate");
  const [currentRole, setCurrentRole] = useState("Software Development Engineer (SDE)");
  const [confirmedSkills, setConfirmedSkills] = useState([]);
  const [allResumes, setAllResumes] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [learningPlan, setLearningPlan] = useState(null);
  const [weaknesses, setWeaknesses] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Fetch full user data & profile
  const fetchUserData = useCallback(async () => {
    try {
      const userRes = await API.get("/auth/me");
      if (userRes.data?.user) {
        setUser(userRes.data.user);
        setUserName(userRes.data.user.name || "Candidate");
      }
    } catch (err) {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          setUser(parsed);
          setUserName(parsed.name || "Candidate");
        } catch (e) {}
      }
    }
  }, []);

  // Fetch Dashboard & Role specific data
  const loadDashboardData = useCallback(
    async (selectedRole) => {
      const roleToLoad = selectedRole || currentRole;
      setIsLoading(true);

      try {
        await fetchUserData();

        // 1. Get Resumes for this role
        try {
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

        // 2. Get active/latest interview session for this role
        try {
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

        // 3. Get all past interviews
        try {
          const historyRes = await API.get("/interview/history");
          if (historyRes.data?.interviews && Array.isArray(historyRes.data.interviews)) {
            setAllInterviews(historyRes.data.interviews);
          }
        } catch (err) {
          setAllInterviews([]);
        }

        // 4. Stats
        try {
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

        // 5. Structured Candidate Profile & Weaknesses
        try {
          const profileRes = await API.get("/resume/profile");
          if (profileRes.data?.candidateProfile) {
            setCandidateProfile(profileRes.data.candidateProfile);
          }
        } catch (e) {}

        try {
          const weakRes = await API.get("/learning/weaknesses");
          if (weakRes.data?.weaknesses) {
            setWeaknesses(weakRes.data.weaknesses);
          }
          if (weakRes.data?.strengths) {
            setStrengths(weakRes.data.strengths);
          }
        } catch (e) {}

        try {
          const learningRes = await API.get("/learning");
          if (learningRes.data?.learningPlan) {
            setLearningPlan(learningRes.data.learningPlan);
          }
        } catch (e) {}
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentRole, fetchUserData]
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

      toast(`Target role set to "${roleName}" 💼`, { icon: "🎯" });
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

  const handleSelectPastInterview = (interviewItem) => {
    setSession(interviewItem);
    if (interviewItem.targetRole) {
      setCurrentRole(interviewItem.targetRole);
      API.get(`/resume/current?role=${encodeURIComponent(interviewItem.targetRole)}`)
        .then((res) => {
          if (res.data?.skills) setConfirmedSkills(res.data.skills);
        })
        .catch(() => {});
    }
  };

  const handleStartNewRole = () => {
    setSession(null);
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview record?")) return;
    try {
      await API.delete(`/interview/${id}`);
      toast.success("Interview session deleted 🗑️");
      setAllInterviews((prev) => prev.filter((i) => (i._id || i.interviewId) !== id));
      if (session?._id === id || session?.interviewId === id) {
        setSession(null);
      }
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete interview");
    }
  };

  const handleDeleteResume = async (resumeId, roleName) => {
    const confirmed = window.confirm(`Are you sure you want to delete the resume for "${roleName || currentRole}"?`);
    if (!confirmed) return;
    try {
      const idToDelete = resumeId || roleName || currentRole;
      await API.delete(`/resume/${idToDelete}`);
      setConfirmedSkills([]);
      toast.success(`Resume deleted 🗑️`);
      loadDashboardData(roleName || currentRole);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete resume");
    }
  };

  const value = {
    user,
    userName,
    setUserName,
    currentRole,
    setCurrentRole,
    confirmedSkills,
    setConfirmedSkills,
    allResumes,
    setAllResumes,
    allInterviews,
    setAllInterviews,
    session,
    setSession,
    stats,
    setStats,
    candidateProfile,
    setCandidateProfile,
    learningPlan,
    setLearningPlan,
    weaknesses,
    setWeaknesses,
    strengths,
    setStrengths,
    isLoading,
    isLoadingRole,
    isMuted,
    setIsMuted,
    loadDashboardData,
    handleRoleSelect,
    handleSessionUpdate,
    handleSkillsConfirmed,
    handleSelectPastInterview,
    handleStartNewRole,
    handleDeleteInterview,
    handleDeleteResume,
  };

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
}
