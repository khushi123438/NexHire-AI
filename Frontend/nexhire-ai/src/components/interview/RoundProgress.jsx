import { Code, Users, Briefcase, CheckCircle2 } from "lucide-react";

export const ROUNDS_CONFIG = [
  {
    key: "ROUND_1_TECHNICAL",
    name: "Round 1: Technical & Skill-Based",
    shortName: "Round 1: Technical",
    icon: Code,
    description: "Deep dive into core CS, data structures, algorithms, and role architecture.",
    maxQuestions: 4,
  },
  {
    key: "ROUND_2_MANAGERIAL",
    name: "Round 2: Managerial & Behavioral",
    shortName: "Round 2: Managerial",
    icon: Users,
    description: "STAR method evaluation on ownership, conflicts, outages & team leadership.",
    maxQuestions: 3,
  },
  {
    key: "ROUND_3_HR",
    name: "Round 3: HR Discussion",
    shortName: "Round 3: HR Round",
    icon: Briefcase,
    description: "Culture fit, company alignment, salary expectations & career goals.",
    maxQuestions: 3,
  },
];

export default function RoundProgress({
  activeRoundKey,
  onSwitchRound,
  roundRecommendations = [],
  currentQuestionIndex = 0,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold tracking-wider text-gray-400 uppercase">
          Interview Rounds
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-yellow-400">
          3-Stage Pipeline
        </span>
      </div>

      <div className="space-y-2">
        {ROUNDS_CONFIG.map((round, idx) => {
          const isCurrentActive = activeRoundKey === round.key;
          const roundRec = (roundRecommendations || []).find((rec) => rec.round === round.key);
          const isCompleted = !!roundRec;
          const Icon = round.icon;

          return (
            <div
              key={round.key}
              onClick={() => onSwitchRound && onSwitchRound(round.key)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                isCurrentActive
                  ? "bg-yellow-500/15 border-yellow-400 text-yellow-300 shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                  : isCompleted
                  ? "bg-green-500/5 border-green-500/20 text-gray-300 hover:border-green-500/40"
                  : "bg-[#0A0A0A] border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center ${
                      isCurrentActive
                        ? "bg-yellow-500/20 text-yellow-400"
                        : isCompleted
                        ? "bg-green-500/20 text-green-400"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    <Icon size={13} />
                  </div>
                  <span className="text-xs font-bold truncate max-w-[140px]">{round.shortName}</span>
                </div>

                {isCompleted ? (
                  <span className="text-[11px] font-mono font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                    {roundRec.score}/10
                  </span>
                ) : isCurrentActive ? (
                  <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.2 rounded">
                    Q{Math.min(currentQuestionIndex + 1, round.maxQuestions)}/{round.maxQuestions}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 font-mono">Stage {idx + 1}</span>
                )}
              </div>

              <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mt-1">
                {round.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
