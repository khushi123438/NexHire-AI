const { callLLM, parseAIJson } = require("../../services/llmService");

/**
 * Agent 2: Interview Planner Agent
 * Formulates the interview topic distribution, difficulty strategy, and priority reassessment areas
 */
const planInterview = async ({
  candidateProfile = null,
  targetRole = "Software Development Engineer (SDE)",
  round = "ROUND_1_TECHNICAL",
  candidateWeaknesses = [],
  candidateId = null,
}) => {
  const skillsList = candidateProfile?.skills?.map((s) => s.name) || ["DSA", "React.js", "Node.js", "DBMS"];
  const weaknessList = candidateWeaknesses.map((w) => `${w.topic} (${w.concept || ""})`);

  const prompt = `
You are the Interview Planner Agent for NexHire AI.
Formulate a personalized interview plan for candidate applying for "${targetRole}" in round "${round}".

Candidate Profile Skills: ${skillsList.join(", ")}
Identified Weaknesses from Previous Interviews: ${weaknessList.length > 0 ? weaknessList.join(", ") : "None recorded"}

Requirements:
- Proactively incorporate previously failed/weak topics for reassessment if present.
- Define a realistic topic distribution across 4 questions for Round 1 (or 3 questions for Round 2 / Round 3).
- Choose initial difficulty level: "beginner", "medium", "advanced", or "hard".
- Outline clear strategy for the interviewer.

Return ONLY valid JSON:
{
  "topics": ["Java Collections", "DBMS Indexing", "DSA Problem Solving", "System Architecture"],
  "distribution": {
    "Technical Fundamentals": 1,
    "Core Domain & Reassessment": 2,
    "Problem Solving & Tradeoffs": 1
  },
  "initialDifficulty": "medium",
  "strategy": "Reassess candidate on DBMS Indexing due to previous weakness, followed by concurrency and data structures.",
  "priorityFocus": ["DBMS Indexing", "HashMap Internals"]
}
`;

  const llmResult = await callLLM({
    prompt,
    agentName: "InterviewPlannerAgent",
    candidateId,
    temperature: 0.3,
  });

  if (llmResult.text) {
    const parsed = parseAIJson(llmResult.text, null);
    if (parsed && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
      return {
        topics: parsed.topics,
        distribution: parsed.distribution || {},
        initialDifficulty: parsed.initialDifficulty || "medium",
        strategy: parsed.strategy || "Personalized adaptive assessment based on candidate skills.",
        priorityFocus: parsed.priorityFocus || [],
      };
    }
  }

  // Fallback defaults by round
  if (round === "ROUND_2_MANAGERIAL") {
    return {
      topics: [
        "Teamwork & Conflict Resolution",
        "Handling Production Incidents & Deadlines",
        "Project Ownership & Architecture Trade-offs",
      ],
      distribution: { Behavioral: 1, Leadership: 1, IncidentManagement: 1 },
      initialDifficulty: "medium",
      strategy: "STAR method behavioral probing on ownership and collaboration.",
      priorityFocus: ["Conflict Resolution", "Production Incident Response"],
    };
  }

  if (round === "ROUND_3_HR") {
    return {
      topics: [
        "Career Goals & Culture Alignment",
        "Salary Expectations & Work Environment",
        "Work Ethics & Candidate Questions",
      ],
      distribution: { CultureFit: 1, Logistics: 1, Values: 1 },
      initialDifficulty: "beginner",
      strategy: "Evaluation of long-term retention, compensation alignment, and workplace culture fit.",
      priorityFocus: ["Culture Fit", "Career Aspirations"],
    };
  }

  // Technical Round default
  const primaryTopic = weaknessList[0] || skillsList[0] || "Data Structures";
  const secondaryTopic = skillsList[1] || "Database Systems & Indexing";
  const tertiaryTopic = skillsList[2] || "Backend Architecture & APIs";

  return {
    topics: [primaryTopic, secondaryTopic, tertiaryTopic, "System Design & Optimization"],
    distribution: { Fundamentals: 1, DeepDive: 2, SystemDesign: 1 },
    initialDifficulty: "medium",
    strategy: weaknessList.length > 0
      ? `Re-evaluating previous weakness in ${weaknessList[0]} before advancing to architectural design.`
      : "Structured progression from fundamental concepts to scenario trade-offs.",
    priorityFocus: [primaryTopic, secondaryTopic],
  };
};

module.exports = {
  planInterview,
};
