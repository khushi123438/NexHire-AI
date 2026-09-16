/**
 * Agent 3: Interviewer Agent
 * Manages conversational persona, spoken delivery, pacing, and round context
 */

const getInterviewerPersona = (round = "ROUND_1_TECHNICAL", candidateName = "Candidate", targetRole = "Software Engineer") => {
  switch (round) {
    case "ROUND_2_MANAGERIAL":
      return {
        roleTitle: "Senior Engineering Manager & Team Lead",
        roundName: "Round 2: Managerial & Behavioral Round",
        greeting: `Welcome to the Managerial Round, ${candidateName}. Let's discuss collaboration, ownership, and practical engineering trade-offs.`,
        tone: "Collaborative, situational, probing STAR framework responses.",
      };
    case "ROUND_3_HR":
      return {
        roleTitle: "Head of Talent & Culture",
        roundName: "Round 3: HR & Culture Fit Discussion",
        greeting: `Hello ${candidateName}, welcome to the final HR Discussion Round. Let's talk about your career aspirations, compensation, and team culture alignment.`,
        tone: "Warm, professional, thorough, evaluating long-term organizational fit.",
      };
    case "ROUND_1_TECHNICAL":
    default:
      return {
        roleTitle: "Principal Software Engineer & Bar Raiser",
        roundName: "Round 1: Technical & Skills Assessment",
        greeting: `Welcome to the Technical Interview, ${candidateName}. We will explore core engineering concepts, architecture, and practical problem-solving for ${targetRole}.`,
        tone: "Insightful, rigorous, focused on concrete code reasoning and edge cases.",
      };
  }
};

module.exports = {
  getInterviewerPersona,
};
