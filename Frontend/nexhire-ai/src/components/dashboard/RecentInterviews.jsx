import { useNavigate } from "react-router-dom";
import { History, ArrowRight, ArrowUpRight, Award, CheckCircle2, Clock } from "lucide-react";
import { useInterview } from "../../context/InterviewContext";

export default function RecentInterviews() {
  const navigate = useNavigate();
  const { allInterviews, handleSelectPastInterview } = useInterview();

  const recentList = (allInterviews || []).slice(0, 4);

  const handleViewReport = (interview) => {
    handleSelectPastInterview(interview);
    navigate("/interview/report");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-yellow-500/40 transition-all duration-300">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-400">
              <History size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-wider text-yellow-400 uppercase">
                Activity Log
              </p>
              <h2 className="text-sm md:text-base font-bold text-white">RECENT INTERVIEWS</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/interview/history")}
            className="text-[11px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-semibold transition"
          >
            <span>View All</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* List / Table */}
        {recentList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400 my-2">
            <p>No interview sessions logged yet.</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Start your first session to build persistent memory & hiring reports.
            </p>
            <button
              onClick={() => navigate("/interview")}
              className="mt-3 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-xs hover:bg-yellow-500/20 transition"
            >
              Start First Interview →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentList.map((item) => {
              const score = item.decision?.overallScore
                ? Math.round(item.decision.overallScore * 10)
                : item.decision?.technicalFit || "--";
              const isCompleted = item.status === "COMPLETED";

              return (
                <div
                  key={item._id || item.interviewId}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {item.targetRole || "Software Engineer"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {item.interviewId} • {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-yellow-400">
                      {score !== "--" ? `${score}/100` : "In Progress"}
                    </span>
                    <button
                      onClick={() => handleViewReport(item)}
                      className="text-[11px] text-gray-400 hover:text-yellow-400 font-medium flex items-center gap-1 transition"
                    >
                      <span>Report</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
        <span>Total Sessions: <strong className="text-gray-300 font-mono">{allInterviews.length}</strong></span>
        <span className="text-green-400 font-mono">Real-time Telemetry</span>
      </div>
    </div>
  );
}
