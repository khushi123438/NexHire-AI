import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  History,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  Plus,
} from "lucide-react";
import { useInterview, STANDARD_ROLES } from "../context/InterviewContext";

export default function InterviewHistory() {
  const navigate = useNavigate();
  const { allInterviews, handleSelectPastInterview, handleDeleteInterview } = useInterview();
  const [selectedFilterRole, setSelectedFilterRole] = useState("ALL");

  const filteredInterviews =
    selectedFilterRole === "ALL"
      ? allInterviews
      : (allInterviews || []).filter(
          (i) => i.targetRole?.toLowerCase() === selectedFilterRole.toLowerCase()
        );

  const handleOpenReport = (interview) => {
    handleSelectPastInterview(interview);
    navigate("/interview/report");
  };

  const handleLoadWorkspace = (interview) => {
    handleSelectPastInterview(interview);
    navigate("/interview");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <span>Interview History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-mono border border-yellow-500/20">
              {allInterviews.length} Sessions
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Review your past AI interview sessions, 3-round scorecards, and hiring recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/interview")}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.25)] hover:scale-[1.02] transition self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Interview</span>
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="bg-[#0A0A0A] border border-yellow-500/15 rounded-2xl p-3 backdrop-blur-xl flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedFilterRole("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedFilterRole === "ALL"
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/40"
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          All Roles ({allInterviews.length})
        </button>
        {STANDARD_ROLES.map((role) => {
          const count = (allInterviews || []).filter(
            (i) => i.targetRole?.toLowerCase() === role.toLowerCase()
          ).length;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedFilterRole(role)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedFilterRole === role
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/40"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {role} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Sessions List */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-white/[0.03] border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            <History size={24} />
          </div>
          <h3 className="text-base font-bold text-white">No interview sessions found</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            {selectedFilterRole === "ALL"
              ? "Your completed interview sessions and evaluations will appear here."
              : `No sessions found for "${selectedFilterRole}".`}
          </p>
          <button
            type="button"
            onClick={() => navigate("/interview")}
            className="mt-2 px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 font-bold text-xs hover:bg-yellow-500/30 transition"
          >
            Start an Interview Now →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInterviews.map((item) => {
            const isCompleted = item.status === "COMPLETED";
            const score = item.decision?.overallScore
              ? Math.round(item.decision.overallScore * 10)
              : item.decision?.technicalFit || null;
            const roundCount = item.roundRecommendations?.length || (item.currentRound ? 1 : 0);

            return (
              <div
                key={item._id || item.interviewId}
                className="bg-[#0A0A0A] border border-yellow-500/15 hover:border-yellow-500/35 rounded-2xl p-4 sm:p-5 backdrop-blur-xl transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {item.targetRole || "Software Development Engineer"}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                        {item.interviewId}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isCompleted
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {isCompleted ? "Completed" : "In Progress"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                      <span>{formatDate(item.createdAt)}</span>
                      <span>•</span>
                      <span>{item.conversationHistory?.length || 0} Turns</span>
                      <span>•</span>
                      <span>{roundCount} / 3 Rounds Evaluated</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                  {score && (
                    <div className="text-left sm:text-right mr-2">
                      <p className="text-lg font-black text-yellow-400 font-mono leading-none">
                        {score}/100
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">Hiring Score</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenReport(item)}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-yellow-500/30 text-gray-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Award size={14} className="text-yellow-400" />
                    <span>View Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadWorkspace(item)}
                    className="px-3.5 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/25 text-xs font-bold flex items-center gap-1 transition"
                  >
                    <span>Open</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteInterview(item._id || item.interviewId)}
                    title="Delete interview session"
                    className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
