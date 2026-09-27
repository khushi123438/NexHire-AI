import { useNavigate } from "react-router-dom";
import { Sparkles, Mic, ArrowRight, Briefcase, ChevronDown } from "lucide-react";
import { useInterview, STANDARD_ROLES } from "../../context/InterviewContext";

export default function WelcomeHero() {
  const navigate = useNavigate();
  const { userName, currentRole, handleRoleSelect, session } = useInterview();

  // Dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="bg-gradient-to-r from-yellow-500/10 via-[#0d0d0d] to-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.05)]">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Welcome Text */}
        <div className="space-y-3">
         

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {getGreeting()}, {userName}.
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl leading-relaxed">
              Here is what your AI interview coach synthesized across your technical turns and concept memory.
            </p>
          </div>

          {/* Active Target Role Badge / Selector */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-400 font-medium">Target Role:</span>
            <div className="relative inline-block">
              <select
                value={currentRole}
                onChange={(e) => handleRoleSelect(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 rounded-xl bg-[#141414] border border-yellow-500/30 text-yellow-300 font-semibold text-xs outline-none focus:border-yellow-400 cursor-pointer shadow-sm"
              >
                {STANDARD_ROLES.map((role) => (
                  <option key={role} value={role} className="bg-[#141414] text-white">
                    {role}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate("/interview")}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-extrabold text-xs sm:text-sm hover:scale-[1.02] transition flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,215,0,0.3)]"
          >
            <Mic size={16} />
            <span>Start AI Interview</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/intelligence")}
            className="px-5 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-yellow-500/30 text-gray-200 hover:text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
          >
            <span>View Intelligence</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
