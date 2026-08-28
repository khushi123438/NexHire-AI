import { Briefcase, Plus, CheckCircle2, Clock, Trash2, Award } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../Api";

export default function RoleInterviewSwitcher({
  interviews = [],
  activeInterviewId = null,
  onSelectInterview,
  onStartNewRole,
}) {
  const handleDeleteInterview = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this interview record?")) return;

    try {
      await API.delete(`/interview/${id}`);
      toast.success("Interview deleted.");
      if (onStartNewRole) onStartNewRole();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete interview");
    }
  };

  if (!interviews || interviews.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="text-yellow-400" size={18} />
          <h3 className="text-sm font-bold text-white">
            Your Role-Wise Interviews ({interviews.length})
          </h3>
          <span className="text-[11px] text-gray-400">
            Click any role to view its conversation history & AI recruiter decision
          </span>
        </div>

        <button
          onClick={onStartNewRole}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold text-xs hover:scale-105 transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,215,0,0.25)] self-start md:self-auto"
        >
          <Plus size={14} /> Prepare for Another Role
        </button>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
        {interviews.map((item) => {
          const isSelected = activeInterviewId === item.interviewId || activeInterviewId === item._id;
          const isCompleted = item.status === "COMPLETED";
          const score = item.decision?.overallScore;

          return (
            <div
              key={item._id || item.interviewId}
              onClick={() => onSelectInterview(item)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center gap-2.5 ${
                isSelected
                  ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                  : "bg-[#0A0A0A] border-yellow-500/10 text-gray-300 hover:border-yellow-400/40 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isCompleted ? (
                  <CheckCircle2 size={14} className="text-green-400" />
                ) : (
                  <Clock size={14} className="text-yellow-400 animate-pulse" />
                )}
                <span>{item.targetRole || "Software Engineer"}</span>
              </div>

              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-gray-400">
                {item.interviewId}
              </span>

              {isCompleted && score ? (
                <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 flex items-center gap-1">
                  <Award size={11} /> {score}/10
                </span>
              ) : (
                <span className="text-[10px] text-orange-400 font-normal">
                  {item.status === "IN_PROGRESS" ? "Live" : item.status}
                </span>
              )}

              <button
                type="button"
                onClick={(e) => handleDeleteInterview(item._id || item.interviewId, e)}
                title="Delete this interview"
                className="text-gray-500 hover:text-red-400 ml-1"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
