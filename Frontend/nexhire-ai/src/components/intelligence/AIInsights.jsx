import { Sparkles, Brain, Target, TrendingUp, ShieldCheck, Flame, Zap } from "lucide-react";

export default function AIInsights({ candidateProfile, learningPlan, weaknesses = [], strengths = [] }) {
  const readiness =
    learningPlan?.readinessScore ?? candidateProfile?.overallReadinessScore ?? null;
  const masteredCount = (strengths && strengths.length) || (candidateProfile?.skills && candidateProfile.skills.length) || 0;

  return (
    <div className="space-y-6">
      {/* Top Insights Hero Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0A0A0A] p-5 rounded-3xl border border-yellow-500/20 space-y-2">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs">
            <Flame size={16} />
            <span>Readiness Benchmark</span>
          </div>
          <p className="text-3xl font-black text-white font-mono">
            {readiness !== null ? `${readiness}%` : "--%"}
          </p>
          <p className="text-xs text-gray-400">
            {readiness !== null && readiness >= 80
              ? "Offer stage readiness benchmark achieved 🏆"
              : readiness !== null
              ? "Calibrated against real interview rubrics."
              : "Complete an interview round to calculate readiness."}
          </p>
        </div>

        <div className="bg-[#0A0A0A] p-5 rounded-3xl border border-yellow-500/20 space-y-2">
          <div className="flex items-center gap-2 text-green-400 font-bold text-xs">
            <TrendingUp size={16} />
            <span>Mastered Concepts</span>
          </div>
          <p className="text-3xl font-black text-white font-mono">
            {masteredCount}
          </p>
          <p className="text-xs text-gray-400">
            Verified across resume extraction & technical turn evaluations.
          </p>
        </div>

        <div className="bg-[#0A0A0A] p-5 rounded-3xl border border-yellow-500/20 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
            <Brain size={16} />
            <span>Memory Telemetry Gaps</span>
          </div>
          <p className="text-3xl font-black text-white font-mono">{weaknesses ? weaknesses.length : 0}</p>
          <p className="text-xs text-gray-400">
            Concept weaknesses tracked to calibrate future question difficulty.
          </p>
        </div>
      </div>

      {/* AI Strategy Overview */}
      {learningPlan?.nextInterviewStrategy && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/25 space-y-2">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs">
            <Target size={16} />
            <span>AI Calibration Strategy</span>
          </div>
          <p className="text-sm font-bold text-white">
            {learningPlan.nextInterviewStrategy}
          </p>
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            The multi-agent orchestration engine will automatically prioritize deeper drills in identified weak spots while maintaining pace across core strengths.
          </p>
        </div>
      )}
    </div>
  );
}
