import { useNavigate } from "react-router-dom";
import { Brain, AlertCircle, ArrowUpRight, ArrowRight, ShieldAlert } from "lucide-react";
import { useInterview } from "../../context/InterviewContext";

export default function WeaknessMemoryCard() {
  const navigate = useNavigate();
  const { weaknesses, currentRole } = useInterview();

  const weaknessList = (weaknesses || []).slice(0, 3);

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-yellow-500/40 transition-all duration-300">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-400">
              <Brain size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-wider text-yellow-400 uppercase">
                Persistent Memory
              </p>
              <h2 className="text-sm md:text-base font-bold text-white">WEAKNESS MEMORY</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/intelligence/memory")}
            className="text-[11px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-semibold transition"
          >
            <span>View Memory</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Weakness items or intelligent empty state */}
        {weaknessList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400 my-2">
            <p>No persistent concept weaknesses detected yet.</p>
            <p className="text-[11px] text-gray-500 mt-1">
              The AI Supervisor logs concept gaps across interview turns to automatically adapt difficulty.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 my-2">
            {weaknessList.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white/[0.02] border border-red-500/20 hover:border-red-500/40 transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-red-300 truncate">
                    {item.topic || item.concept || "Architecture Concept"}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {item.concept || item.evidence || "Detected in recent session"}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {item.score !== undefined ? `${item.score}/10` : "Needs Polish"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
        <span>Logged Concept Gaps</span>
        <button
          onClick={() => navigate("/intelligence/memory")}
          className="text-yellow-400 hover:underline font-semibold flex items-center gap-1"
        >
          <span>Deep Analytics</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
