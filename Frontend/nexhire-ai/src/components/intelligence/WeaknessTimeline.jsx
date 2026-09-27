import { Brain, AlertCircle, Clock, Tag, ShieldAlert } from "lucide-react";

export default function WeaknessTimeline({ weaknesses = [] }) {
  if (!weaknesses || weaknesses.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400">
        No persistent concept weaknesses logged in memory. Complete interview turns to populate candidate telemetry.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weaknesses.map((item, index) => (
        <div
          key={index}
          className="bg-[#0A0A0A] p-4 rounded-2xl border border-red-500/20 hover:border-red-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-300">
                {item.topic || item.concept || "Architecture Concept"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                {item.score !== undefined ? `${item.score}/10 Score` : "Identified Gap"}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {item.concept || item.evidence || "Concept omission detected during technical explanation turns."}
            </p>
          </div>

          <div className="text-left sm:text-right flex-shrink-0 text-[10px] text-gray-500 font-mono">
            <span>Detected in Turns</span>
          </div>
        </div>
      ))}
    </div>
  );
}
