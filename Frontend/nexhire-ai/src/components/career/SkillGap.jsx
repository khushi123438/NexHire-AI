import { Target, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";

export default function SkillGap({ targetRole = "Software Development Engineer (SDE)", weaknesses = [], confirmedSkills = [] }) {
  const SDE_REQUIRED_SKILLS = [
    "Data Structures & Algorithms",
    "System Design & Scalability",
    "Database Management (SQL/NoSQL)",
    "Object-Oriented Design",
    "Concurrency & Multithreading",
    "RESTful API & Microservices",
  ];

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Target Role Skill Gaps</h3>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">{targetRole}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SDE_REQUIRED_SKILLS.map((reqSkill, idx) => {
          const isWeak = (weaknesses || []).some(
            (w) =>
              (w.topic || "").toLowerCase().includes(reqSkill.toLowerCase().slice(0, 5)) ||
              (w.concept || "").toLowerCase().includes(reqSkill.toLowerCase().slice(0, 5))
          );
          const isConfirmed = (confirmedSkills || []).some(
            (s) =>
              s.toLowerCase().includes(reqSkill.toLowerCase().slice(0, 4))
          );

          const status = isWeak ? "Needs Drill" : isConfirmed ? "Strong" : "In Progress";

          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2"
            >
              <span className="text-xs font-semibold text-gray-200 truncate">{reqSkill}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                  isWeak
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : isConfirmed
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
