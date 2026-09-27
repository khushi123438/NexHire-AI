import { useNavigate } from "react-router-dom";
import { Layers, ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useInterview } from "../../context/InterviewContext";

export default function SkillOverview() {
  const navigate = useNavigate();
  const { confirmedSkills, candidateProfile, currentRole } = useInterview();

  // Extract skills from candidateProfile or confirmedSkills strictly from database
  let skillsList = [];

  if (candidateProfile?.skills && candidateProfile.skills.length > 0) {
    skillsList = candidateProfile.skills.slice(0, 5).map((s) => {
      const hasConfidence = typeof s.confidence === "number" && s.confidence > 0;
      return {
        name: s.name,
        score: hasConfidence ? Math.round(s.confidence * 100) : null,
        level: s.level || "Proficient",
      };
    });
  } else if (confirmedSkills && confirmedSkills.length > 0) {
    skillsList = confirmedSkills.slice(0, 5).map((skillName) => ({
      name: skillName,
      score: null,
      level: "Verified",
    }));
  }

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-yellow-500/40 transition-all duration-300">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-400">
              <Layers size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-wider text-yellow-400 uppercase">
                Proficiency Index
              </p>
              <h2 className="text-sm md:text-base font-bold text-white">YOUR SKILL INTELLIGENCE</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/intelligence/skills")}
            className="text-[11px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-semibold transition"
          >
            <span>All Skills</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Skills list or empty state */}
        {skillsList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400 my-2">
            <p>No confirmed skills for {currentRole} yet.</p>
            <button
              onClick={() => navigate("/resumes")}
              className="mt-2 text-yellow-400 font-bold hover:underline inline-block"
            >
              Upload Resume to Extract Skills →
            </button>
          </div>
        ) : (
          <div className="space-y-3 my-2">
            {skillsList.map((skill) => (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-200 truncate max-w-[150px]">
                    {skill.name}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    {skill.score !== null ? (
                      <span className="text-yellow-400 font-bold">{skill.score}%</span>
                    ) : (
                      <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.2 rounded font-medium">
                        {skill.level}
                      </span>
                    )}
                  </div>
                </div>
                {skill.score !== null ? (
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-yellow-500/30 h-1.5 rounded-full w-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
        <span>Verified via Resume Extraction</span>
        <span className="text-gray-300 font-mono font-bold">{skillsList.length} Active Skills</span>
      </div>
    </div>
  );
}
