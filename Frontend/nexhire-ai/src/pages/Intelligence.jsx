import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Brain, Layers, Activity } from "lucide-react";
import { useInterview } from "../context/InterviewContext";
import AIInsights from "../components/intelligence/AIInsights";
import SkillBars from "../components/intelligence/SkillBars";
import WeaknessTimeline from "../components/intelligence/WeaknessTimeline";

export default function Intelligence() {
  const location = useLocation();
  const navigate = useNavigate();
  const { candidateProfile, learningPlan, weaknesses, strengths, confirmedSkills } = useInterview();

  // Determine active tab from URL path
  const [activeTab, setActiveTab] = useState("insights");

  useEffect(() => {
    if (location.pathname.includes("/skills")) {
      setActiveTab("skills");
    } else if (location.pathname.includes("/memory")) {
      setActiveTab("memory");
    } else {
      setActiveTab("insights");
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "skills") navigate("/intelligence/skills");
    else if (tab === "memory") navigate("/intelligence/memory");
    else navigate("/intelligence");
  };

  const skillsToDisplay =
    candidateProfile?.skills?.length > 0
      ? candidateProfile.skills
      : confirmedSkills.map((name) => ({ name, confidence: null, level: "Verified" }));

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <span>AI Intelligence Hub</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-mono border border-yellow-500/20">
            Agent Telemetry
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Deep telemetry on your parsed skill proficiencies, persistent memory gaps, and adaptive interview calibration.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#0A0A0A] border border-yellow-500/15 rounded-2xl p-2 backdrop-blur-xl flex items-center gap-2 max-w-md">
        <button
          type="button"
          onClick={() => handleTabChange("insights")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "insights"
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Brain size={14} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("skills")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "skills"
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Layers size={14} />
          <span>Skills ({skillsToDisplay.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("memory")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "memory"
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Activity size={14} />
          <span>Weakness Memory ({weaknesses.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "insights" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <AIInsights
              candidateProfile={candidateProfile}
              learningPlan={learningPlan}
              weaknesses={weaknesses}
              strengths={strengths}
            />

            <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-yellow-400" />
                  <h3 className="text-sm font-bold text-white">Top Verified Skills</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("skills")}
                  className="text-xs text-yellow-400 hover:underline font-semibold"
                >
                  View All →
                </button>
              </div>
              <SkillBars skills={skillsToDisplay.slice(0, 6)} />
            </div>

            <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-red-400" />
                  <h3 className="text-sm font-bold text-white">Persistent Weakness Telemetry</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("memory")}
                  className="text-xs text-yellow-400 hover:underline font-semibold"
                >
                  View All →
                </button>
              </div>
              <WeaknessTimeline weaknesses={weaknesses.slice(0, 3)} />
            </div>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Skill Intelligence & Confidence Ratings</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Technical competencies extracted from your uploaded resume and confirmed via interview turns.
              </p>
            </div>
            <SkillBars skills={skillsToDisplay} />
          </div>
        )}

        {activeTab === "memory" && (
          <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Candidate Weakness Memory</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Historical concept omissions and gaps logged to personalize future question generation.
              </p>
            </div>
            <WeaknessTimeline weaknesses={weaknesses} />
          </div>
        )}
      </div>
    </div>
  );
}
