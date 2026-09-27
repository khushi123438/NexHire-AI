import { User, Mail, Briefcase, FileText, CheckCircle2, Award, Sparkles, Layers } from "lucide-react";
import { useInterview, STANDARD_ROLES } from "../context/InterviewContext";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, userName, currentRole, handleRoleSelect, confirmedSkills, allResumes, allInterviews } = useInterview();

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <span>Candidate Profile</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-mono border border-yellow-500/20">
            Verified Account
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Manage your candidate identity, active target role benchmark, and verified technical competencies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: User Card */}
        <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 flex items-center justify-center font-black text-black text-2xl shadow-[0_0_25px_rgba(255,215,0,0.3)]">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{userName}</h2>
              <p className="text-xs text-gray-400">{user?.email || "candidate@nexhire.ai"}</p>
              <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                AI Memory Active
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/5 text-xs text-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Interviews:</span>
              <span className="font-mono font-bold text-white">{allInterviews.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Saved Resumes:</span>
              <span className="font-mono font-bold text-white">{allResumes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Verified Skills:</span>
              <span className="font-mono font-bold text-yellow-400">{confirmedSkills.length}</span>
            </div>
          </div>
        </div>

        {/* Right: Target Role Preferences & Verified Skills */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Role Selector Card */}
          <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-yellow-400" />
              <h3 className="text-sm font-bold text-white">Target Role Benchmark</h3>
            </div>

            <p className="text-xs text-gray-400">
              Select your primary job track. NexHire AI tailors technical questions, rubric weightings, and roadmaps to your chosen benchmark.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {STANDARD_ROLES.map((role) => {
                const isSelected = currentRole.toLowerCase() === role.toLowerCase();
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`p-3 rounded-2xl text-left border text-xs font-semibold transition flex items-center justify-between ${
                      isSelected
                        ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                        : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-yellow-500/30 hover:text-white"
                    }`}
                  >
                    <span className="truncate mr-2">{role}</span>
                    {isSelected && <CheckCircle2 size={14} className="text-yellow-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirmed Skills Grid */}
          <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-yellow-400" />
                <h3 className="text-sm font-bold text-white">Confirmed Skills for {currentRole}</h3>
              </div>
              <span className="text-xs text-yellow-400 font-mono font-bold">
                {confirmedSkills.length} Skills
              </span>
            </div>

            {confirmedSkills.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No skills confirmed for this role yet. Upload a resume to automatically extract skills.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {confirmedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
