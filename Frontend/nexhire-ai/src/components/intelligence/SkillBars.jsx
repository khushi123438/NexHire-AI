import { Layers, TrendingUp, CheckCircle2 } from "lucide-react";

export default function SkillBars({ skills = [] }) {
  if (!skills || skills.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400">
        No verified skills extracted yet. Upload a resume to populate your skill telemetry.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {skills.map((skill, index) => {
        const name = typeof skill === "string" ? skill : skill.name;
        const hasConfidence = typeof skill === "object" && typeof skill.confidence === "number" && skill.confidence > 0;
        const confidence = hasConfidence ? Math.round(skill.confidence * 100) : null;
        const level = typeof skill === "object" ? skill.level || "Proficient" : "Proficient";

        return (
          <div
            key={index}
            className="bg-[#0A0A0A] p-4 rounded-2xl border border-yellow-500/10 hover:border-yellow-500/30 transition-all duration-200 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate max-w-[140px]">{name}</span>
              {confidence !== null ? (
                <span className="text-[10px] font-mono text-yellow-400 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">
                  {confidence}%
                </span>
              ) : (
                <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded font-medium">
                  Verified
                </span>
              )}
            </div>

            {confidence !== null ? (
              <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            ) : (
              <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                <div className="bg-yellow-500/30 h-1.5 rounded-full w-full" />
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span className="capitalize">{level}</span>
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle2 size={11} /> Verified
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
