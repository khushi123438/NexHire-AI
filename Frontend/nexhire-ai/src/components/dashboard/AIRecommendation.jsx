import { useNavigate } from "react-router-dom";
import { Sparkles, Target, ArrowRight, Zap } from "lucide-react";
import { useInterview } from "../../context/InterviewContext";

export default function AIRecommendation() {
  const navigate = useNavigate();
  const { learningPlan, weaknesses, session, currentRole } = useInterview();

  // Derive recommendation content from real backend learningPlan or weakness data
  const hasWeaknesses = weaknesses && weaknesses.length > 0;
  const primaryWeakness = hasWeaknesses ? weaknesses[0] : null;

  const title =
    learningPlan?.nextInterviewStrategy
      ? `Focus Session: ${learningPlan.nextInterviewStrategy}`
      : primaryWeakness
      ? `Targeted Drill: ${primaryWeakness.topic || primaryWeakness.concept || "Core Fundamentals"}`
      : `Complete First Interview Drill for ${currentRole}`;

  const reason =
    primaryWeakness
      ? `Recent interview turns detected repeated concept gaps in ${primaryWeakness.topic} (${primaryWeakness.concept || primaryWeakness.evidence || "depth & clarity"}).`
      : learningPlan?.dailyRoadmap?.[0]?.title
      ? `AI Career Coach recommends practicing Day 1: ${learningPlan.dailyRoadmap[0].title} to fortify key concepts.`
      : `Complete an interview round to enable AI weakness tracking and generate targeted drills tailored to your exact interview responses.`;

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-yellow-500/40 transition-all duration-300 relative overflow-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-400">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-wider text-yellow-400 uppercase">
                ✦ AI RECOMMENDS
              </p>
              <h2 className="text-sm md:text-base font-bold text-white">Next Practice Action</h2>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
            Adaptive Action
          </span>
        </div>

        {/* Focus Topic */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
          <h3 className="text-sm font-bold text-white leading-snug">
            {title}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            <strong className="text-yellow-400/90 font-mono">Reason: </strong>
            {reason}
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 mt-2">
        <button
          type="button"
          onClick={() => navigate("/interview")}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-xs hover:scale-[1.01] transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
        >
          <Zap size={14} />
          <span>Start Targeted Session</span>
        </button>
      </div>
    </div>
  );
}
