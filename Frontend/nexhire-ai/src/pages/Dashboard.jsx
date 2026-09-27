import WelcomeHero from "../components/dashboard/WelcomeHero";
import ReadinessCard from "../components/dashboard/ReadinessCard";
import AIRecommendation from "../components/dashboard/AIRecommendation";
import SkillOverview from "../components/dashboard/SkillOverview";
import RecentInterviews from "../components/dashboard/RecentInterviews";
import WeaknessMemoryCard from "../components/dashboard/WeaknessMemoryCard";
import RoadmapPreview from "../components/dashboard/RoadmapPreview";
import { useInterview } from "../context/InterviewContext";
import { Briefcase, FileText, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentRole, allResumes, allInterviews, session, isLoading } = useInterview();

  const currentRoleResume = (allResumes || []).find(
    (r) => r.targetRole?.toLowerCase() === currentRole.toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        {/* Skeleton Welcome Hero */}
        <div className="h-44 rounded-3xl bg-white/[0.03] border border-white/5" />

        {/* Skeleton Quick Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 rounded-2xl bg-white/[0.03] border border-white/5" />
          <div className="h-20 rounded-2xl bg-white/[0.03] border border-white/5" />
          <div className="h-20 rounded-2xl bg-white/[0.03] border border-white/5" />
        </div>

        {/* Skeleton Grid Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-3xl bg-white/[0.03] border border-white/5" />
          <div className="h-64 rounded-3xl bg-white/[0.03] border border-white/5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-3xl bg-white/[0.03] border border-white/5" />
          <div className="h-64 rounded-3xl bg-white/[0.03] border border-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Hero */}
      <WelcomeHero />

      {/* 2. Top Summary Quick Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-yellow-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-mono">Active Target Role</p>
              <p className="text-xs md:text-sm font-bold text-white truncate max-w-[180px]">
                {currentRole}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/resumes")}
            className="text-[11px] text-yellow-400 hover:underline font-semibold"
          >
            Switch
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-yellow-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-mono">Resume Intelligence</p>
              <p className="text-xs md:text-sm font-bold text-white">
                {currentRoleResume ? "Resume Synced ✓" : "Upload Pending"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/resumes")}
            className="text-[11px] text-yellow-400 hover:underline font-semibold"
          >
            Manage
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-yellow-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Brain size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-mono">Adaptive Interview Engine</p>
              <p className="text-xs md:text-sm font-bold text-white">
                {session?.status === "IN_PROGRESS" ? "Live Session" : "3-Round Ready"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/interview")}
            className="text-[11px] text-yellow-400 hover:underline font-semibold"
          >
            Launch
          </button>
        </div>
      </div>

      {/* 3. Row 1: Interview Readiness + AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ReadinessCard />
        <AIRecommendation />
      </div>

      {/* 4. Row 2: Skill Intelligence + Weakness Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <SkillOverview />
        <WeaknessMemoryCard />
      </div>

      {/* 5. Row 3: Recent Interviews + Career Roadmap Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentInterviews />
        <RoadmapPreview />
      </div>
    </div>
  );
}