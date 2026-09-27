import { useState, useEffect } from "react";
import { useInterview } from "../context/InterviewContext";
import ResumeUpload from "../components/dashboard/ResumeUpload";
import API from "../Api";

export default function ResumeManager() {
  const {
    currentRole,
    confirmedSkills,
    allResumes,
    handleRoleSelect,
    handleSkillsConfirmed,
    loadDashboardData,
  } = useInterview();

  const [roleRecommendations, setRoleRecommendations] = useState({});

  useEffect(() => {
    API.get("/resume/profile")
      .then((res) => {
        const recommendations = res.data?.candidateProfile?.roleRecommendations;
        if (recommendations) {
          setRoleRecommendations(recommendations);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <span>Resumes & Roles</span>

          <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-mono border border-yellow-500/20">
            Resume Intelligence
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Upload tailored resumes for specific target roles to activate
          role-calibrated technical questions.
        </p>
      </div>

    

      {/* Full Width Resume Manager */}
      <div className="w-full">
        <ResumeUpload
          onSkillsConfirmed={handleSkillsConfirmed}
          onRoleChange={handleRoleSelect}
          currentSkills={confirmedSkills}
          currentRole={currentRole}
          allResumes={allResumes}
          onResumeUpdated={() => loadDashboardData(currentRole)}
        />
      </div>
    </div>
  );
}