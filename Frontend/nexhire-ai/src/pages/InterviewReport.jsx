import { useNavigate } from "react-router-dom";
import {
  Award,
  Download,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Code,
  Users,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useInterview } from "../context/InterviewContext";

export default function InterviewReport() {
  const navigate = useNavigate();
  const { session, currentRole, userName } = useInterview();

  const decision = session?.decision;
  const roundRecommendations = session?.roundRecommendations || [];
  const latestEval =
    session?.evaluations?.length > 0
      ? session.evaluations[session.evaluations.length - 1]
      : null;

  const handleDownloadPDF = () => {
    toast.loading("Preparing printable interview report...", { duration: 1500 });
    setTimeout(() => {
      window.print();
    }, 800);
  };

  if (!session) {
    return (
      <div className="space-y-6 pb-16">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            <Award size={30} />
          </div>
          <h2 className="text-xl font-bold text-white">No Interview Report Selected</h2>
          <p className="text-xs text-gray-400 max-w-md">
            Complete an interview round or select a completed session from your interview history to inspect the 5-factor competency rubric and executive decision.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate("/interview")}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold text-xs"
            >
              Start New Interview
            </button>
            <button
              onClick={() => navigate("/interview/history")}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold"
            >
              View Interview History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallScore = decision?.overallScore
    ? Math.round(decision.overallScore * 10)
    : (typeof decision?.overallHiringConfidence === "number"
        ? decision.overallHiringConfidence
        : (latestEval?.overall ? Math.round(latestEval.overall * 10) : null));

  const technical = typeof decision?.technicalFit === "number" ? decision.technicalFit : (latestEval?.correctness ? Math.round(latestEval.correctness * 10) : null);
  const problemSolving = typeof decision?.overallScore === "number" ? Math.round(decision.overallScore * 10) : (latestEval?.technicalDepth ? Math.round(latestEval.technicalDepth * 10) : null);
  const communication = typeof decision?.communicationFit === "number" ? decision.communicationFit : (latestEval?.clarity ? Math.round(latestEval.clarity * 10) : null);
  const depth = latestEval?.completeness ? Math.round(latestEval.completeness * 10) : null;
  const behavioral = typeof decision?.culturalFit === "number" ? decision.culturalFit : (latestEval?.relevance ? Math.round(latestEval.relevance * 10) : null);

  const rubricFactors = [
    { label: "Technical Reasoning", score: technical, weight: "30%" },
    { label: "Problem Solving", score: problemSolving, weight: "25%" },
    { label: "Communication", score: communication, weight: "20%" },
    { label: "Depth & Completeness", score: depth, weight: "15%" },
    { label: "Behavioral & Culture Fit", score: behavioral, weight: "10%" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,215,0,0.25)] hover:scale-[1.02] transition"
          >
            <Download size={14} />
            <span>Download Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Report Header Card */}
      <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-start md:items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black shadow-[0_0_25px_rgba(255,215,0,0.3)] flex-shrink-0">
              <Award size={30} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">INTERVIEW REPORT</h1>
                {decision?.fitBadge && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold border border-green-500/30">
                    {decision.fitBadge}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 flex flex-wrap items-center gap-2 mt-1">
                <span>Role: <strong className="text-white">{session?.targetRole || currentRole}</strong></span>
                <span>•</span>
                <span>Candidate: <strong className="text-white">{userName}</strong></span>
                <span>•</span>
                <span className="font-mono text-gray-500">{session?.interviewId}</span>
              </p>
            </div>
          </div>

          <div className="text-left md:text-right flex-shrink-0 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <p className="text-3xl sm:text-4xl font-black text-yellow-400 font-mono leading-none">
              {overallScore !== null ? `${overallScore}` : "--"} <span className="text-sm font-normal text-gray-400">/ 100</span>
            </p>
            {overallScore !== null && (
              <p className="text-xs text-green-400 font-semibold mt-1 flex items-center gap-1 md:justify-end">
                <CheckCircle2 size={13} />
                <span>
                  {overallScore >= 80 ? "Offer Ready" : overallScore >= 65 ? "Solid Foundation" : "Needs Polish"}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* 5-Factor Evaluation Rubric Breakdown */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
            <Sparkles size={14} />
            <span>5-Factor Competency Rubric</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {rubricFactors.map((factor) => {
              const hasFactorScore = factor.score !== null && factor.score !== undefined;
              return (
                <div
                  key={factor.label}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-yellow-500/30 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium text-[11px] truncate">{factor.label}</span>
                    <span className="font-mono font-bold text-yellow-400">
                      {hasFactorScore ? `${factor.score}%` : "--"}
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-1.5 rounded-full"
                      style={{ width: `${hasFactorScore ? Math.min(100, factor.score) : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono text-right">{factor.weight} weight</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Improvement Areas */}
        {(decision?.remarks || latestEval?.strengths || latestEval?.areasToImprove) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(decision?.remarks || latestEval?.strengths) && (
              <div className="p-4 rounded-2xl bg-[#050505] border border-green-500/20 space-y-2">
                <div className="flex items-center gap-2 text-green-400 font-bold text-xs">
                  <TrendingUp size={16} />
                  <span>Demonstrated Strengths</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {latestEval?.strengths || decision?.remarks}
                </p>
              </div>
            )}

            {latestEval?.areasToImprove && (
              <div className="p-4 rounded-2xl bg-[#050505] border border-orange-500/20 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
                  <AlertCircle size={16} />
                  <span>Targeted Improvement Areas</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {latestEval.areasToImprove}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3-Round Breakdown */}
        {roundRecommendations.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
              Round-by-Round Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {roundRecommendations.map((r) => {
                const isTech = r.round === "ROUND_1_TECHNICAL";
                const isManagerial = r.round === "ROUND_2_MANAGERIAL";
                const Icon = isTech ? Code : isManagerial ? Users : MessageSquare;

                return (
                  <div
                    key={r.round}
                    className="p-4 rounded-2xl bg-[#050505] border border-yellow-500/10 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                          <Icon size={14} className="text-yellow-400" />
                          <span>{r.title || r.round}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                          {r.score}/10
                        </span>
                      </div>
                      {r.keyFeedback && (
                        <p className="text-[11px] text-gray-300 leading-relaxed italic">
                          "{r.keyFeedback}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-green-400 font-semibold">
                      <span>{r.passed ? "Passed ✓" : "Completed"}</span>
                      <span className="text-gray-500 font-mono">Agent Evaluated</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Executive Remarks */}
        {decision?.remarks && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/20 space-y-2">
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs">
              <ShieldCheck size={18} />
              <span>AI Executive Hiring Panel Remarks</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
              "{decision.remarks}"
            </p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigate("/career")}
            className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold text-xs sm:text-sm hover:scale-[1.01] transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.25)]"
          >
            <Sparkles size={16} />
            <span>View AI Study Plan & Career Roadmap</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/interview")}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#141414] border border-white/10 text-gray-200 hover:text-white hover:border-yellow-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <RefreshCw size={14} />
            <span>Retake Another Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
