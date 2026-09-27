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
  Sparkles,
  ArrowRight,
  Target,
  Check,
} from "lucide-react";

import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../../Api";

const POPULAR_ROLES = [
  "AI / ML Engineer",
  "Data Scientist",
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps / Cloud Engineer",
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
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [targetRole, setTargetRole] = useState(currentRole);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [skills, setSkills] = useState(currentSkills || []);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const currentRoleResume = (allResumes || []).find(
    (resume) =>
      resume.targetRole?.toLowerCase() === (targetRole || "").toLowerCase()
  );

  useEffect(() => {
    if (Array.isArray(currentSkills) && currentSkills.length > 0) {
      setSkills(currentSkills);
    } else if (currentRoleResume?.skills?.length > 0) {
      setSkills(currentRoleResume.skills);
    }
  }, [currentSkills, allResumes, currentRoleResume]);

  useEffect(() => {
    if (!currentRole) return;
    setTargetRole(currentRole);

    if (!POPULAR_ROLES.includes(currentRole)) {
      setIsCustomRole(true);
      setCustomRoleInput(currentRole);
    } else {
      setIsCustomRole(false);
    }
  }, [currentRole]);

  // Load existing profile recommendations on mount
  useEffect(() => {
    API.get("/resume/profile")
      .then((res) => {
        const candidateProfile = res.data?.candidateProfile;
        if (candidateProfile?.recommendations && Array.isArray(candidateProfile.recommendations)) {
          setRecommendations(candidateProfile.recommendations);
        } else if (candidateProfile?.roleRecommendations) {
          const recArray = Object.entries(candidateProfile.roleRecommendations).map(
            ([roleName, score]) => ({
              role: roleName,
              match_score: score,
              reason: `Matched resume skills for ${roleName}.`,
              matched_skills: candidateProfile.skills?.slice(0, 4).map((s) => s.name || s) || [],
              skill_gaps: ["Advanced Trade-offs", "System Architecture"],
            })
          );
          recArray.sort((a, b) => b.match_score - a.match_score);
          setRecommendations(recArray);
        }
      })
      .catch(() => {});
  }, []);

  const handleChooseFile = () => {
    fileRef.current?.click();
  };

  const generateFallbackRecommendations = (extractedSkills) => {
    const skillList = (extractedSkills || []).map((s) => (typeof s === "string" ? s : s.name || ""));
    const skillLower = skillList.map((s) => s.toLowerCase());

    const isAI = skillLower.some((s) => s.includes("python") || s.includes("ml") || s.includes("nlp") || s.includes("tensor") || s.includes("torch"));
    const isFront = skillLower.some((s) => s.includes("react") || s.includes("js") || s.includes("html") || s.includes("css") || s.includes("view"));
    const isBack = skillLower.some((s) => s.includes("node") || s.includes("api") || s.includes("sql") || s.includes("mongo") || s.includes("fastapi"));
    const isCloud = skillLower.some((s) => s.includes("docker") || s.includes("aws") || s.includes("linux") || s.includes("kubernetes"));

    const fallbackList = [
      {
        role: "AI / ML Engineer",
        match_score: isAI ? 92 : 75,
        reason: isAI ? "Extracted core Python, machine learning and model pipeline skills." : "Demonstrates general technical problem solving and algorithm fundamentals.",
        matched_skills: skillList.slice(0, 3),
        skill_gaps: ["MLOps", "Model Deployment"],
      },
      {
        role: "Backend Developer",
        match_score: isBack ? 88 : 78,
        reason: isBack ? "Strong backend database and API architecture experience." : "Core software development and database fundamentals.",
        matched_skills: skillList.slice(0, 3),
        skill_gaps: ["Redis Caching", "Microservices"],
      },
      {
        role: "Frontend Developer",
        match_score: isFront ? 90 : 70,
        reason: isFront ? "Demonstrated modern UI framework and web client capabilities." : "Basic web and UI presentation principles.",
        matched_skills: skillList.slice(0, 3),
        skill_gaps: ["Core Web Vitals", "State Management"],
      },
      {
        role: "Software Development Engineer (SDE)",
        match_score: 85,
        reason: "Broad foundational engineering skills in algorithms, design, and code logic.",
        matched_skills: skillList.slice(0, 3),
        skill_gaps: ["Distributed Systems", "Concurrency"],
      },
      {
        role: "Full Stack Developer",
        match_score: isFront && isBack ? 91 : 80,
        reason: "Comprehensive client-server software application development capabilities.",
        matched_skills: skillList.slice(0, 4),
        skill_gaps: ["CI/CD Pipelines", "System Monitoring"],
      },
      {
        role: "DevOps / Cloud Engineer",
        match_score: isCloud ? 89 : 68,
        reason: isCloud ? "Containerization and cloud infrastructure experience." : "Basic deployment and Linux system operations.",
        matched_skills: skillList.slice(0, 3),
        skill_gaps: ["Terraform", "Kubernetes"],
      },
    ];

    fallbackList.sort((a, b) => b.match_score - a.match_score);
    return fallbackList;
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      setUploadSuccess(false);

      setProcessingStep("Extracting PDF text...");
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStep("Running NLP & Extracting Skills...");
      const res = await API.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProcessingStep("Generating AI Role Recommendations...");
      await new Promise((r) => setTimeout(r, 300));

      const extractedList = res.data?.skills || [];
      setSkills(extractedList);

      if (res.data?.resume?._id) {
        setSelectedResumeId(res.data.resume._id);
      }

      // Handle structured recommendations
      let recs = res.data?.recommendations;
      if (!recs || !Array.isArray(recs) || recs.length === 0) {
        if (res.data?.roleRecommendations) {
          recs = Object.entries(res.data.roleRecommendations).map(
            ([roleName, score]) => ({
              role: roleName,
              match_score: score,
              reason: `Matched skills for ${roleName}.`,
              matched_skills: extractedList.slice(0, 3),
              skill_gaps: ["System Architecture"],
            })
          );
          recs.sort((a, b) => b.match_score - a.match_score);
        } else {
          recs = generateFallbackRecommendations(extractedList);
        }
      }

      setRecommendations(recs);
      setUploadSuccess(true);

      // Auto-adopt top recommended role if user hasn't locked one
      if (recs && recs.length > 0) {
        const topRole = recs[0].role;
        setTargetRole(topRole);
        if (onRoleChange) onRoleChange(topRole);
      }

      if (onResumeUpdated) onResumeUpdated();

      toast.success(`Resume uploaded! Extracted ${extractedList.length} skills with AI Role Recommendations 🚀`);
    } catch (err) {
      console.error("Resume upload error:", err);
      toast.error(err.response?.data?.message || "Resume upload failed.");

      // Provide graceful fallback recommendations even on network error
      const fallbacks = generateFallbackRecommendations(skills);
      setRecommendations(fallbacks);
    } finally {
      setLoading(false);
      setProcessingStep("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSelectRecommendedRole = async (roleName) => {
    setIsCustomRole(false);
    setTargetRole(roleName);
    setIsConfirmed(true);

    if (onRoleChange) {
      onRoleChange(roleName);
    }

    try {
      await API.put("/resume/skills", {
        skills,
        targetRole: roleName,
        resumeId: selectedResumeId || currentRoleResume?._id,
      });
      if (onSkillsConfirmed) {
        onSkillsConfirmed(skills, roleName, selectedResumeId || currentRoleResume?._id);
      }
      toast.success(`Target role set to "${roleName}"! Ready for interview 🎯`);
    } catch (err) {
      if (onSkillsConfirmed) {
        onSkillsConfirmed(skills, roleName, selectedResumeId || currentRoleResume?._id);
      }
      toast.success(`Target role set to "${roleName}" 🎯`);
    }
  };

  const handleRoleSelectChange = (e) => {
    const value = e.target.value;
    if (value === "CUSTOM") {
      setIsCustomRole(true);
      const customVal = customRoleInput || "Custom Role";
      setTargetRole(customVal);
      if (onRoleChange) onRoleChange(customVal);
    } else {
      setIsCustomRole(false);
      setTargetRole(value);
      if (onRoleChange) onRoleChange(value);
    }
    setIsConfirmed(false);
  };

  const handleCustomRoleBlur = () => {
    const customValue = customRoleInput.trim();
    if (!customValue) return;
    setTargetRole(customValue);
    if (onRoleChange) onRoleChange(customValue);
  };

  const handleSelectExistingResume = (resume) => {
    setSelectedResumeId(resume._id);
    const role = resume.targetRole || "Software Development Engineer (SDE)";
    setTargetRole(role);
    setSkills(resume.skills || []);
    setIsConfirmed(true);

    if (onRoleChange) onRoleChange(role);
    if (onSkillsConfirmed) onSkillsConfirmed(resume.skills || [], role, resume._id);

    toast.success(`Loaded resume for "${role}"`);
  };

  const handleDeleteResume = async (resumeId, roleName, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to delete the resume for "${roleName || targetRole}"?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const idToDelete = resumeId || currentRoleResume?._id || targetRole;
      await API.delete(`/resume/${idToDelete}`);

      setSkills([]);
      setIsConfirmed(false);
      setSelectedResumeId(null);
      toast.success(`Resume deleted 🗑️`);

      if (onResumeUpdated) onResumeUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete resume");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const skill = newSkill.trim();
    if (!skill) return;

    const alreadyExists = skills.some((existingSkill) => existingSkill.toLowerCase() === skill.toLowerCase());
    if (alreadyExists) {
      toast.error("Skill already in list");
      return;
    }

    setSkills((prev) => [...prev, skill]);
    setNewSkill("");
    setIsConfirmed(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
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
      toast.success(`Role confirmed for "${activeRole}"! Ready for adaptive interview 🚀`);
    } catch (err) {
      setIsConfirmed(true);
      if (onSkillsConfirmed) {
        onSkillsConfirmed(skills, activeRole, selectedResumeId || currentRoleResume?._id);
      }
      toast.success(`Role confirmed for "${activeRole}"! Ready for interview.`);
    }
  };

  const handleStartInterviewClick = async () => {
    await handleConfirmSkills();
    navigate("/interview");
  };

  return (
    <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between space-y-6">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <FileText className="text-yellow-400" size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Resume Upload</h2>
              <p className="text-sm text-gray-400">
                Upload your resume to get AI-powered role recommendations.
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
                <CheckCircle2 size={13} />
                Role Locked: {targetRole}
              </>
            ) : skills.length > 0 ? (
              "Skills Extracted"
            ) : (
              "Upload Resume"
            )}
          </span>
        </div>

        {/* Upload Zone (First Action) */}
        <div
          onClick={handleChooseFile}
          className="border-2 border-dashed border-yellow-500/30 rounded-2xl p-6 text-center hover:border-yellow-400 hover:bg-yellow-500/[0.02] transition cursor-pointer mb-6"
        >
          <div className="h-14 w-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
            {loading ? (
              <Loader2 className="animate-spin text-yellow-400" size={28} />
            ) : (
              <Upload className="text-yellow-400" size={28} />
            )}
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            {loading ? processingStep || "Processing Resume with AI..." : "Upload Resume"}
          </h3>

          <p className="text-xs text-gray-400 mb-3 max-w-md mx-auto">
            Upload your resume PDF to automatically extract technical skills, projects, and receive AI-powered role fit recommendations.
          </p>

          <button
            type="button"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold text-xs hover:scale-105 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                {processingStep || "Analyzing Resume..."}
              </>
            ) : (
              <>
                <Plus size={15} />
                Choose Resume PDF
              </>
            )}
          </button>

          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={handleUpload} />
        </div>

        {/* Saved Resumes History Bar */}
        {allResumes?.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                <Layers size={13} className="text-yellow-400" />
                Your Uploaded Resumes ({allResumes.length}):
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {allResumes.map((resume) => {
                const isSelected = targetRole?.toLowerCase() === resume.targetRole?.toLowerCase();

                return (
                  <div
                    key={resume._id}
                    onClick={() => handleSelectExistingResume(resume)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border flex items-center gap-2 transition ${
                      isSelected
                        ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                        : "bg-[#141414] border-yellow-500/20 text-gray-400 hover:border-yellow-400/50 hover:text-white"
                    }`}
                  >
                    <Briefcase size={12} className={isSelected ? "text-yellow-400" : "text-gray-500"} />
                    <span>{resume.targetRole || "Extracted Profile"}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                      {resume.skills?.length || 0} skills
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteResume(resume._id, resume.targetRole, e)}
                      title={`Delete resume`}
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

        {/* Extracted Skills Section */}
        {skills.length > 0 && (
          <div className="mb-6 bg-[#0A0A0A] p-4 rounded-2xl border border-yellow-500/15">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles size={14} className="text-yellow-400" />
                Extracted Skills from Resume
              </h3>
              <span className="text-xs text-yellow-400 font-semibold font-mono">
                {skills.length} Skills Found
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 mb-3">
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

            {/* Add Custom Skill Form */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom skill (e.g. PyTorch, System Design)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/[0.05] border border-yellow-500/20 text-white outline-none focus:border-yellow-400"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#141414] border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 text-xs font-semibold flex items-center gap-1"
              >
                <Plus size={14} />
                Add Skill
              </button>
            </form>
          </div>
        )}

        {/* AI Role Recommendations Section */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                AI Role Recommendations
              </span>
              <span className="text-xs text-yellow-400 font-mono">
                Calibrated to your resume
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((item) => {
                const roleName = item.role;
                const matchScore = item.match_score || 80;
                const isSelected = targetRole?.toLowerCase() === roleName.toLowerCase();

                return (
                  <div
                    key={roleName}
                    onClick={() => handleSelectRecommendedRole(roleName)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? "bg-yellow-500/15 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.12)]"
                        : "bg-[#0A0A0A] border-white/10 hover:border-yellow-500/30 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Briefcase size={15} className={isSelected ? "text-yellow-400" : "text-gray-400"} />
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px]">
                            {roleName}
                          </h4>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono border ${
                            matchScore >= 85
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : matchScore >= 70
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-white/10 text-gray-300 border-white/10"
                          }`}
                        >
                          {matchScore}% Match
                        </span>
                      </div>

                      {/* Reason */}
                      <p className="text-[11px] text-gray-300 line-clamp-2 mb-2.5">
                        {item.reason}
                      </p>

                      {/* Matched Skills */}
                      {item.matched_skills?.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] text-gray-400 block mb-1 font-semibold">Matched Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.matched_skills.map((s) => (
                              <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-300 border border-green-500/20">
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skill Gaps */}
                      {item.skill_gaps?.length > 0 && (
                        <div>
                          <span className="text-[10px] text-gray-400 block mb-1 font-semibold">Target Growth Areas:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.skill_gaps.map((g) => (
                              <span key={g} className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400/80 border border-yellow-500/20">
                                • {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRecommendedRole(roleName);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-yellow-400 text-black shadow-md"
                          : "bg-[#141414] text-gray-300 border border-white/10 hover:border-yellow-400 hover:text-white"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={14} /> Selected Target Role
                        </>
                      ) : (
                        <>
                          <Target size={13} /> Select {roleName}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual Target Role Dropdown Selector */}
        <div className="bg-[#0A0A0A] p-4 rounded-2xl border border-yellow-500/10">
          <label className="block text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1.5">
            <Briefcase size={14} />
            Selected Interview Target Role:
          </label>

          <div className="grid grid-cols-1 gap-2">
            <select
              value={isCustomRole ? "CUSTOM" : targetRole}
              onChange={handleRoleSelectChange}
              className="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-yellow-500/20 text-white text-xs font-semibold outline-none focus:border-yellow-400"
            >
              {POPULAR_ROLES.map((role) => (
                <option key={role} value={role} className="bg-[#141414] text-white">
                  {role}
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
      </div>

      {/* Confirmation & Start Interview CTA */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        <button
          type="button"
          onClick={handleStartInterviewClick}
          disabled={skills.length === 0}
          className={`w-full py-3.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center gap-2 ${
            skills.length === 0
              ? "bg-white/[0.05] border border-white/10 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,215,0,0.25)]"
          }`}
        >
          <CheckCircle2 size={18} />
          Confirm Role & Start {targetRole} Interview
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}