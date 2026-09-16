import {
  Upload,
  FileText,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Briefcase,
  Layers,
  Calendar,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import API from "../../Api";

const POPULAR_ROLES = [
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "DevOps / Cloud Engineer",
  "AI Engineer / ML Engineer"
];

export default function ResumeUpload({
  onSkillsConfirmed,
  onRoleChange,
  currentSkills = [],
  currentRole = "Software Development Engineer (SDE)",
  allResumes = [],
  onResumeUpdated,
}) {
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState(currentRole);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [skills, setSkills] = useState(currentSkills || []);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Find active resume matching targetRole
  const currentRoleResume = (allResumes || []).find(
    (r) => r.targetRole?.toLowerCase() === (targetRole || "").toLowerCase()
  );

  // Sync when parent updates current skills or resumes
  useEffect(() => {
    if (Array.isArray(currentSkills) && currentSkills.length > 0) {
      setSkills(currentSkills);
      setIsConfirmed(true);
    } else if (currentRoleResume && currentRoleResume.skills?.length > 0) {
      setSkills(currentRoleResume.skills);
      setIsConfirmed(true);
    } else {
      setSkills([]);
      setIsConfirmed(false);
    }
  }, [currentSkills, currentRoleResume]);

  useEffect(() => {
    if (currentRole) {
      setTargetRole(currentRole);
      if (!POPULAR_ROLES.includes(currentRole)) {
        setIsCustomRole(true);
        setCustomRoleInput(currentRole);
      } else {
        setIsCustomRole(false);
      }
    }
  }, [currentRole]);

  const handleChooseFile = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleRoleSelectChange = (e) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustomRole(true);
      const customVal = customRoleInput || "Custom Role";
      setTargetRole(customVal);
      if (onRoleChange) onRoleChange(customVal);
    } else {
      setIsCustomRole(false);
      setTargetRole(val);
      if (onRoleChange) onRoleChange(val);
    }
    setIsConfirmed(false);
  };

  const handleCustomRoleBlur = () => {
    if (customRoleInput.trim()) {
      const customVal = customRoleInput.trim();
      setTargetRole(customVal);
      if (onRoleChange) onRoleChange(customVal);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const activeRole = isCustomRole ? customRoleInput.trim() || "Software Engineer" : targetRole;

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("targetRole", activeRole);

    try {
      setLoading(true);
      const res = await API.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.skills && res.data.skills.length > 0) {
        setSkills(res.data.skills);
        setSelectedResumeId(res.data.resume._id);
        setIsConfirmed(true);
        if (onSkillsConfirmed) {
          onSkillsConfirmed(res.data.skills, activeRole, res.data.resume._id);
        }
        toast.success(`Extracted ${res.data.skills.length} skills for "${activeRole}"! 🎯`);
      } else {
        toast.success(`Resume uploaded for "${activeRole}"! Please add your skills.`);
      }

      if (onResumeUpdated) onResumeUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Resume upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExistingResume = (resume) => {
    setSelectedResumeId(resume._id);
    setTargetRole(resume.targetRole || "Software Development Engineer (SDE)");
    setSkills(resume.skills || []);
    setIsConfirmed(true);
    if (onRoleChange) {
      onRoleChange(resume.targetRole);
    }
    if (onSkillsConfirmed) {
      onSkillsConfirmed(resume.skills, resume.targetRole, resume._id);
    }
    toast.success(`Loaded resume for "${resume.targetRole}"`);
  };

  const handleDeleteResume = async (resumeId, roleName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the resume for "${roleName || targetRole}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const idToDelete = resumeId || currentRoleResume?._id || targetRole;
      await API.delete(`/resume/${idToDelete}`);
      setSkills([]);
      setIsConfirmed(false);
      setSelectedResumeId(null);
      toast.success(`Resume for "${roleName || targetRole}" deleted successfully 🗑️`);
      if (onResumeUpdated) onResumeUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete resume");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast.error("Skill already in list");
      return;
    }
    const updated = [...skills, newSkill.trim()];
    setSkills(updated);
    setNewSkill("");
    setIsConfirmed(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    setIsConfirmed(false);
  };

  const handleConfirmSkills = async () => {
    if (skills.length === 0) {
      toast.error("Please upload a resume or add at least one skill");
      return;
    }

    const activeRole = isCustomRole ? customRoleInput.trim() || "Software Engineer" : targetRole;

    try {
      await API.put("/resume/skills", {
        skills,
        targetRole: activeRole,
        resumeId: selectedResumeId || currentRoleResume?._id,
      });
      setIsConfirmed(true);
      if (onSkillsConfirmed) {
        onSkillsConfirmed(skills, activeRole, selectedResumeId || currentRoleResume?._id);
      }
      toast.success(`Skills confirmed for "${activeRole}"! Voice Interview unlocked 🚀`);
    } catch (err) {
      console.error(err);
      setIsConfirmed(true);
      if (onSkillsConfirmed) {
        onSkillsConfirmed(skills, activeRole, selectedResumeId || currentRoleResume?._id);
      }
      toast.success("Skills confirmed! Ready for interview.");
    }
  };

  return (
    <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <FileText className="text-yellow-400" size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Resume & Role Selection
              </h2>
              <p className="text-sm text-gray-400">
                Upload role-specific resumes & extract skills
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isConfirmed
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : skills.length > 0
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                : "bg-white/[0.05] text-gray-400 border border-white/10"
            }`}
          >
            {isConfirmed ? (
              <>
                <CheckCircle2 size={13} /> Role Confirmed
              </>
            ) : skills.length > 0 ? (
              "Needs Confirmation"
            ) : (
              "Upload Resume"
            )}
          </span>
        </div>

        {/* Target Role Selector */}
        <div className="mb-4 bg-[#0A0A0A] p-4 rounded-2xl border border-yellow-500/10">
          <label className="block text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1.5">
            <Briefcase size={14} />
            Select Interview Target Role:
          </label>

          <div className="grid grid-cols-1 gap-2">
            <select
              value={isCustomRole ? "CUSTOM" : targetRole}
              onChange={handleRoleSelectChange}
              className="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-yellow-500/20 text-white text-xs font-semibold outline-none focus:border-yellow-400"
            >
              {POPULAR_ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#141414] text-white">
                  {r}
                </option>
              ))}
              <option value="CUSTOM" className="bg-[#141414] text-yellow-400">
                + Custom / Other Target Role...
              </option>
            </select>

            {isCustomRole && (
              <input
                type="text"
                placeholder="Enter custom role title (e.g. iOS Developer, Blockchain Engineer)..."
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                onBlur={handleCustomRoleBlur}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#141414] border border-yellow-500/30 text-white outline-none focus:border-yellow-400 mt-1"
              />
            )}
          </div>
        </div>

        {/* Existing Role Resumes List */}
        {allResumes && allResumes.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                <Layers size={13} className="text-yellow-400" />
                Your Uploaded Role Resumes ({allResumes.length}):
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {allResumes.map((r) => {
                const isSelected = targetRole?.toLowerCase() === r.targetRole?.toLowerCase();
                return (
                  <div
                    key={r._id}
                    onClick={() => handleSelectExistingResume(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border flex items-center gap-2 transition ${
                      isSelected
                        ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                        : "bg-[#141414] border-yellow-500/20 text-gray-400 hover:border-yellow-400/50 hover:text-white"
                    }`}
                  >
                    <Briefcase size={12} className={isSelected ? "text-yellow-400" : "text-gray-500"} />
                    <span>{r.targetRole}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                      {r.skills?.length || 0} skills
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteResume(r._id, r.targetRole, e)}
                      title={`Delete resume for ${r.targetRole}`}
                      className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 ml-1 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Saved Resume Card with Delete Button if uploaded for this role */}
        {currentRoleResume && (
          <div className="mb-4 bg-[#0A0A0A] border border-green-500/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{currentRoleResume.fileName || "Resume.pdf"}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-green-500/20 text-green-300">
                    Saved for {targetRole}
                  </span>
                </p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={10} />
                  {new Date(currentRoleResume.uploadedAt).toLocaleDateString()} • {currentRoleResume.skills?.length || 0} Skills Extracted
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => handleDeleteResume(currentRoleResume._id, targetRole, e)}
              title={`Delete resume for ${targetRole}`}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Upload Zone */}
        <div
          onClick={handleChooseFile}
          className="border-2 border-dashed border-yellow-500/30 rounded-2xl p-5 text-center hover:border-yellow-400 hover:bg-yellow-500/[0.02] transition cursor-pointer"
        >
          <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2.5">
            {loading ? (
              <Loader2 className="animate-spin text-yellow-400" size={24} />
            ) : (
              <Upload className="text-yellow-400" size={24} />
            )}
          </div>

          <h3 className="text-sm font-bold text-white mb-1">
            {currentRoleResume
              ? `Replace / Upload New Resume for "${targetRole}"`
              : `Upload Resume for "${targetRole}"`}
          </h3>

          <p className="text-xs text-gray-400 mb-2.5">
            AI will extract specific technical skills for this role
          </p>

          <button
            type="button"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold text-xs hover:scale-105 transition disabled:opacity-50"
          >
            {loading ? "Extracting Skills with AI..." : "+ Choose Resume PDF"}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            hidden
            onChange={handleUpload}
          />
        </div>

        {/* Extracted Skills Section */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-xs">
              Extracted Skills for {targetRole}
            </h3>
            <span className="text-xs text-yellow-400 font-semibold font-mono">
              {skills.length} Skills
            </span>
          </div>

          {skills.length === 0 ? (
            <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-yellow-500/10 text-center">
              <AlertCircle size={18} className="text-yellow-400/60 mx-auto mb-1" />
              <p className="text-gray-400 text-xs">
                No skills extracted yet for this role. Upload a resume or add skills below.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-medium flex items-center gap-1.5 hover:border-yellow-400/50 transition"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSkill(skill);
                    }}
                    className="text-gray-400 hover:text-red-400 ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick Add Custom Skill */}
          <form onSubmit={handleAddSkill} className="mt-2.5 flex gap-2">
            <input
              type="text"
              placeholder={`Add skill for ${targetRole} (e.g. React, SQL)...`}
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/[0.05] border border-yellow-500/20 text-white outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-[#141414] border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 text-xs font-semibold flex items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          </form>
        </div>
      </div>

      {/* Confirm Skills Button */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={handleConfirmSkills}
          disabled={skills.length === 0}
          className={`w-full py-3 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center gap-2 ${
            skills.length === 0
              ? "bg-white/[0.05] border border-white/10 text-gray-500 cursor-not-allowed"
              : isConfirmed
              ? "bg-green-500/20 text-green-400 border border-green-500/40"
              : "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,215,0,0.25)]"
          }`}
        >
          <CheckCircle2 size={16} />
          {isConfirmed
            ? `Ready for ${targetRole} Interview ✓`
            : `Confirm Skills for ${targetRole}`}
        </button>
      </div>
    </div>
  );
}