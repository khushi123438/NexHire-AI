import { useState } from "react";
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function CareerRoadmap({ dailyRoadmap = [] }) {
  const [expandedDay, setExpandedDay] = useState(1);

  if (!dailyRoadmap || dailyRoadmap.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400">
        No daily roadmap milestones generated yet. Click "Regenerate AI Study Plan" to synthesize your customized progression.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dailyRoadmap.map((milestone) => {
        const isExpanded = expandedDay === milestone.day;
        return (
          <div
            key={milestone.day}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isExpanded
                ? "bg-[#0A0A0A] border-yellow-400/50 shadow-[0_0_25px_rgba(255,215,0,0.1)]"
                : "bg-[#0A0A0A]/60 border-yellow-500/10 hover:border-yellow-500/30"
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedDay(isExpanded ? null : milestone.day)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-yellow-500/20 text-yellow-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                  D{milestone.day}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{milestone.title}</h4>
                  <p className="text-xs text-yellow-400/80 font-medium">{milestone.focusArea}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400 hidden sm:inline-block">
                  {milestone.concepts?.length || 0} Concepts • {milestone.practiceQuestions?.length || 0} Drills
                </span>
                {isExpanded ? (
                  <ChevronDown size={18} className="text-yellow-400" />
                ) : (
                  <ChevronRight size={18} className="text-gray-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 border-t border-white/5 space-y-4">
                {/* Core Concepts */}
                {milestone.concepts?.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-yellow-400" />
                      <span>Core Concepts to Master</span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {milestone.concepts.map((c, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Questions */}
                {milestone.practiceQuestions?.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span>Recommended Practice Drills</span>
                    </h5>
                    <div className="space-y-2">
                      {milestone.practiceQuestions.map((q, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-gray-300 flex items-start gap-2"
                        >
                          <span className="text-yellow-400 font-bold font-mono">#{i + 1}</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* References */}
                {milestone.resources?.length > 0 && (
                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-gray-400 mb-1">Recommended References:</h5>
                    <p className="text-xs text-gray-400 font-mono">
                      {milestone.resources.join(" • ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
