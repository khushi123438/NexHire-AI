import { TrendingUp, Flame, CheckCircle2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useInterview } from "../../context/InterviewContext";

export default function ReadinessCard() {
  const { session, candidateProfile, learningPlan, currentRole } = useInterview();

  // Calculate or derive readiness score and sub-scores from actual session/profile data
  const latestEval =
    session?.evaluations?.length > 0
      ? session.evaluations[session.evaluations.length - 1]
      : null;

  const decision = session?.decision;

  const baseReadiness =
    learningPlan?.readinessScore ??
    candidateProfile?.overallReadinessScore ??
    decision?.overallHiringConfidence ??
    (latestEval?.overall ? Math.round(latestEval.overall * 10) : null);

  const hasScore = baseReadiness !== null && baseReadiness !== undefined && typeof baseReadiness === "number";
  const readinessPercent = hasScore ? Math.min(100, Math.max(0, Math.round(baseReadiness))) : 0;

  // Derive 5-factor breakdown strictly from database records
  const technical = decision?.technicalFit ?? (latestEval?.correctness ? Math.round(latestEval.correctness * 10) : null);
  const problemSolving = decision?.overallScore ? Math.round(decision.overallScore * 10) : (latestEval?.technicalDepth ? Math.round(latestEval.technicalDepth * 10) : null);
  const communication = decision?.communicationFit ?? (latestEval?.clarity ? Math.round(latestEval.clarity * 10) : null);
  const behavioral = decision?.culturalFit ?? (latestEval?.relevance ? Math.round(latestEval.relevance * 10) : null);
  const roleFit = decision?.overallHiringConfidence ?? (latestEval?.completeness ? Math.round(latestEval.completeness * 10) : null);

  const subMetrics = [
    { label: "Technical", score: technical, color: "bg-yellow-400" },
    { label: "Problem Solving", score: problemSolving, color: "bg-yellow-500" },
    { label: "Communication", score: communication, color: "bg-green-400" },
    { label: "Behavioral", score: behavioral, color: "bg-cyan-400" },
    { label: "Role Fit", score: roleFit, color: "bg-purple-400" },
  ];

  // SVG circular gauge math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readinessPercent / 100) * circumference;

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-yellow-500/40 transition-all duration-300">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-400">
              <Flame size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-wider text-yellow-400 uppercase">
                Interview Intelligence
              </p>
              <h2 className="text-sm md:text-base font-bold text-white">INTERVIEW READINESS</h2>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-gray-400">
            {hasScore ? "Live Telemetry" : "Awaiting Data"}
          </span>
        </div>

        {/* Circular Radial Gauge + Score Breakdown */}
        <div className="flex flex-col sm:flex-row items-center gap-6 my-3">
          {/* Circular Visualization */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-white/[0.06]"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Progress stroke */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#readiness-gradient)"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="readiness-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FACC15" />
                  <stop offset="100%" stopColor="#CA8A04" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {hasScore ? `${readinessPercent}%` : "--%"}
              </span>
            </div>
          </div>

          {/* Sub-Metrics Horizontal Bars */}
          <div className="flex-1 w-full space-y-2">
            {subMetrics.map((item) => {
              const itemHasScore = item.score !== null && item.score !== undefined;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 text-[11px] font-medium">{item.label}</span>
                    <span className="font-mono text-[11px] font-bold text-gray-200">
                      {itemHasScore ? `${item.score}%` : "--"}
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${item.color} h-1.5 rounded-full transition-all duration-700`}
                      style={{ width: `${itemHasScore ? Math.min(100, item.score) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
        <span>Target: <strong className="text-gray-300 font-semibold">{currentRole}</strong></span>
        <span className="text-yellow-400 font-mono flex items-center gap-1">
          {hasScore && readinessPercent >= 75 ? "Offer Ready 🏆" : hasScore ? "Calibrated 📈" : "Complete round to score"}
        </span>
      </div>
    </div>
  );
}
