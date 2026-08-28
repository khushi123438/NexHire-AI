import { Brain, CheckCircle2, TrendingUp, AlertCircle, Sparkles, BarChart2 } from "lucide-react";

export default function EvaluationPanel({ latestEvaluation = null, evaluations = [] }) {
  const evalData =
    latestEvaluation ||
    (Array.isArray(evaluations) && evaluations.length > 0
      ? evaluations[evaluations.length - 1]
      : null);

  if (!evalData) {
    return (
      <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Brain className="text-yellow-400" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Answer Evaluation</h2>
                <p className="text-sm text-gray-400">Step 3: Real-time candidate scoring</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-black text-gray-500 font-mono">--/10</p>
              <p className="text-xs text-gray-500 font-semibold">Awaiting Answer</p>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-[#0A0A0A] rounded-2xl p-8 border border-yellow-500/10 text-center flex flex-col items-center justify-center min-h-[260px]">
            <div className="h-14 w-14 rounded-full bg-white/[0.03] border border-yellow-500/10 flex items-center justify-center mb-3">
              <BarChart2 className="text-yellow-400/40" size={24} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No Evaluation Generated Yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              As you speak and submit answers during the voice interview, AI will analyze your Technical Accuracy, Communication, Confidence, and Examples in real time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: "Technical accuracy",
      score: evalData.technicalAccuracy ?? 8.0,
      max: 10,
      percent: Math.min(100, Math.round(((evalData.technicalAccuracy ?? 8.0) / 10) * 100)),
    },
    {
      label: "Communication",
      score: evalData.communication ?? 8.0,
      max: 10,
      percent: Math.min(100, Math.round(((evalData.communication ?? 8.0) / 10) * 100)),
    },
    {
      label: "Confidence",
      score: evalData.confidence ?? 8.0,
      max: 10,
      percent: Math.min(100, Math.round(((evalData.confidence ?? 8.0) / 10) * 100)),
    },
    {
      label: "Examples used",
      score: evalData.examplesUsed ?? 7.0,
      max: 10,
      percent: Math.min(100, Math.round(((evalData.examplesUsed ?? 7.0) / 10) * 100)),
    },
  ];

  const overallAvg = (
    metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length
  ).toFixed(1);

  return (
    <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Brain className="text-yellow-400" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Answer Evaluation</h2>
              <p className="text-sm text-gray-400">Real-time candidate scoring</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-black text-yellow-400 font-mono">{overallAvg}/10</p>
            <p className="text-xs text-green-400 font-semibold flex items-center gap-1 justify-end">
              <Sparkles size={12} />
              {overallAvg >= 8.0 ? "Excellent" : "Good Performance"}
            </p>
          </div>
        </div>

        {/* Metrics Rows */}
        <div className="space-y-3.5 mb-5">
          {metrics.map((item, index) => (
            <div
              key={index}
              className="bg-[#0A0A0A] p-3 rounded-2xl border border-yellow-500/10 hover:border-yellow-500/30 transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-400" size={16} />
                  <span className="text-white text-xs font-semibold">{item.label}</span>
                </div>
                <span className="text-yellow-300 font-bold font-mono text-xs">
                  {item.score}/10
                </span>
              </div>

              <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths Box */}
        <div className="mb-3 p-3.5 rounded-2xl bg-[#0A0A0A] border border-green-500/20">
          <div className="flex items-center gap-1.5 mb-1 text-green-400 font-bold text-xs">
            <TrendingUp size={14} />
            <span>Strengths</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            {evalData.strengths || "Clear explanation of core concept"}
          </p>
        </div>

        {/* Areas to Improve Box */}
        <div className="mb-3 p-3.5 rounded-2xl bg-[#0A0A0A] border border-orange-500/20">
          <div className="flex items-center gap-1.5 mb-1 text-orange-400 font-bold text-xs">
            <AlertCircle size={14} />
            <span>Areas to improve</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            {evalData.areasToImprove || "Add practical examples and mention time complexity"}
          </p>
        </div>

        {/* AI Feedback Box */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-yellow-500/10">
          <h3 className="font-bold text-white text-xs mb-1 text-yellow-400">
            Recruiter Summary Feedback
          </h3>
          <p className="text-gray-300 text-xs leading-relaxed font-sans">
            {evalData.feedback ||
              "Strong communication and confidence. Maintain this clarity while expanding on technical architecture."}
          </p>
        </div>
      </div>
    </div>
  );
}