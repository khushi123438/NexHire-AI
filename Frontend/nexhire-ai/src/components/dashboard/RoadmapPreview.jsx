import { useNavigate } from "react-router-dom";
import { Compass, CheckCircle2, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { useInterview } from "../../context/InterviewContext";

export default function RoadmapPreview() {
  const navigate = useNavigate();
  const { learningPlan, currentRole, candidateProfile } = useInterview();

  const milestones = Array.isArray(learningPlan?.dailyRoadmap) ? learningPlan.dailyRoadmap : [];
  const readiness = learningPlan?.readinessScore ?? candidateProfile?.overallReadinessScore ?? null;

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-yellow-500/40 transition-all duration-300">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-400">
              <Compass size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-wider text-yellow-400 uppercase">
                AI Career Engine
              </p>
              <h2 className="text-sm md:text-base font-bold text-white">AI CAREER ROADMAP</h2>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
            {readiness !== null ? `${readiness}% Readiness` : "Customized Plan"}
          </span>
        </div>

        {/* Milestone Steps Progression or Empty State */}
        {milestones.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400 my-2 space-y-2">
            <p>No study roadmap generated for {currentRole} yet.</p>
            <p className="text-[11px] text-gray-500">
              Generate a personalized study roadmap grounded in your target role and concept gaps.
            </p>
            <button
              onClick={() => navigate("/career")}
              className="mt-2 px-3 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-bold text-xs hover:bg-yellow-500/25 transition inline-flex items-center gap-1.5"
            >
              <span>Generate AI Study Plan →</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 my-2">
            {milestones.slice(0, 4).map((m, idx) => (
              <div
                key={m.day || idx}
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 bg-yellow-500/10 text-yellow-400">
                    D{m.day || idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{m.focusArea || "Key Concepts"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                  <span className="text-yellow-400/90 font-medium">
                    {m.concepts?.length || 0} Concepts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {milestones.length > 0 ? `${milestones.length}-Day Structured Plan` : "Personalized Progression"}
        </span>
        <button
          onClick={() => navigate("/career")}
          className="px-3.5 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 hover:bg-yellow-500/25 text-yellow-300 font-bold text-xs flex items-center gap-1.5 transition"
        >
          <span>Open Career Coach</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
