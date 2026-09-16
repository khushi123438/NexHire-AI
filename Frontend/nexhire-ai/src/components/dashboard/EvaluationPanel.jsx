import { Brain, CheckCircle2, TrendingUp, AlertCircle, Sparkles, BarChart2, Tag, ShieldCheck } from "lucide-react";

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
                <h2 className="text-xl font-bold text-white">
                  Performance Evaluation
                </h2>
                <p className="text-sm text-gray-400">
                  Step 3: Reviewing your interview performance
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-black text-gray-500 font-mono">--/10</p>
              <p className="text-xs text-gray-500 font-semibold">Awaiting Answer</p>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-[#0A0A0A] rounded-2xl p-8 border border-yellow-500/10 text-center flex flex-col items-center justify-center min-h-[280px]">
            <div className="h-14 w-14 rounded-full bg-white/[0.03] border border-yellow-500/10 flex items-center justify-center mb-3">
              <BarChart2 className="text-yellow-400/40" size={24} />
            </div>

            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              When you submit your answer, the Evaluation Agent scores Correctness (30%), Technical Depth (25%), Relevance (20%), Clarity (15%), and Completeness (10%) with concept omission detection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 5-Factor Rubric metrics
  const correctness = evalData.correctness ?? evalData.technicalAccuracy ?? 8.0;
  const technicalDepth = evalData.technicalDepth ?? evalData.examplesUsed ?? 7.5;
  const relevance = evalData.relevance ?? evalData.confidence ?? 8.0;
  const clarity = evalData.clarity ?? evalData.communication ?? 8.0;
  const completeness = evalData.completeness ?? 7.5;
  const overall = evalData.overall ?? Number(((correctness + technicalDepth + relevance + clarity + completeness) / 5).toFixed(1));

  const rubricMetrics = [
    { label: "Correctness (30%)", score: correctness, weight: "30%" },
    { label: "Technical Depth (25%)", score: technicalDepth, weight: "25%" },
    { label: "Relevance (20%)", score: relevance, weight: "20%" },
    { label: "Clarity & Structure (15%)", score: clarity, weight: "15%" },
    { label: "Completeness (10%)", score: completeness, weight: "10%" },
  ];

  const missingConcepts = Array.isArray(evalData.missingConcepts) ? evalData.missingConcepts : [];

  return (
    <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Brain className="text-yellow-400" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Evaluation</h2>


              </div>
              <p className="text-sm text-gray-400">Structured evaluation & concept analysis</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-black text-yellow-400 font-mono">{overall}/10</p>
            <p className="text-xs text-green-400 font-semibold flex items-center gap-1 justify-end">
              <Sparkles size={12} />
              {overall >= 8.0 ? "Strong Response" : overall >= 6.5 ? "Good Foundation" : "Needs Polish"}
            </p>
          </div>
        </div>

        {/* 5-Factor Rubric Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {rubricMetrics.map((item, index) => {
            const percent = Math.min(100, Math.round((item.score / 10) * 100));
            return (
              <div
                key={index}
                className="bg-[#0A0A0A] p-2.5 rounded-xl border border-yellow-500/10 hover:border-yellow-500/30 transition"
              >
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-gray-300 font-medium">{item.label}</span>
                  <span className="text-yellow-400 font-mono font-bold">{item.score}/10</span>
                </div>
                <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Missing Concepts Omission Warning */}
        {missingConcepts.length > 0 && (
          <div className="mb-3 p-3 rounded-2xl bg-red-950/20 border border-red-500/30">
            <div className="flex items-center gap-1.5 mb-1.5 text-red-400 font-bold text-xs">
              <AlertCircle size={14} />
              <span>Omitted / Missing Concepts Detected</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] font-mono flex items-center gap-1"
                >
                  <Tag size={10} />
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Improvement Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-green-500/20">
            <div className="flex items-center gap-1.5 mb-1 text-green-400 font-bold text-xs">
              <TrendingUp size={14} />
              <span>Strengths</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              {evalData.strengths || "Clear understanding of fundamental principles."}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-orange-500/20">
            <div className="flex items-center gap-1.5 mb-1 text-orange-400 font-bold text-xs">
              <AlertCircle size={14} />
              <span>Areas to Polish</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              {evalData.areasToImprove || "Elaborate with concrete architectural examples."}
            </p>
          </div>
        </div>

        {/* Recruiter Summary Feedback */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-yellow-500/10">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-xs text-yellow-400">Recruiter Feedback</h3>
            {evalData.difficultyAdjusted && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10 font-mono">
                {evalData.difficultyAdjusted === "increase"
                  ? "📈 Difficulty Scaled Up"
                  : evalData.difficultyAdjusted === "remediate"
                    ? "🔄 Reassessing Concept"
                    : "⚖️ Difficulty Maintained"}
              </span>
            )}
          </div>
          <p className="text-gray-300 text-xs leading-relaxed font-sans">
            {evalData.feedback || "Solid foundation demonstrated with articulate communication."}
          </p>
        </div>
      </div>
    </div>
  );
}