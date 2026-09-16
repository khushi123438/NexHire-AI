const { callLLM, parseAIJson } = require("../../services/llmService");

/**
 * Agent 4: Question Generation Agent
 * Formulates grounded, adaptive questions using candidate profile, RAG context, memory, and difficulty
 */
const generateQuestion = async ({
  candidateName = "Candidate",
  targetRole = "Software Development Engineer (SDE)",
  round = "ROUND_1_TECHNICAL",
  currentTopic = "Core Fundamentals",
  difficulty = "medium",
  previousAnswer = "",
  lastEvaluation = null,
  ragContext = "",
  candidateMemorySummary = "",
  questionIndex = 0,
  isFollowUp = false,
  candidateId = null,
  interviewId = "",
}) => {
  const prompt = `
You are the Question Generation Agent for NexHire AI.
Generate a highly targeted, realistic spoken interview question.

Context & Parameters:
- Candidate Name: "${candidateName}"
- Target Role: "${targetRole}"
- Current Round: "${round}" (Question #${questionIndex + 1})
- Target Topic: "${currentTopic}"
- Current Difficulty Level: "${difficulty}"
- Is Follow-up Probe: ${isFollowUp ? "YES (Probe edge-cases or missing concepts from last answer)" : "NO"}
- Previous Candidate Answer: "${previousAnswer ? previousAnswer.substring(0, 400) : "N/A - Opening Question"}"
- Previous Evaluation: ${lastEvaluation ? JSON.stringify({ score: lastEvaluation.overall, missing: lastEvaluation.missingConcepts }) : "N/A"}
- RAG Technical Grounding Context:
${ragContext || "No domain context."}
- Candidate Performance Memory:
${candidateMemorySummary || "Clean slate."}

Guidelines:
1. Ground the question in the RAG Technical Context and candidate's target role.
2. If previous answer missed concepts or was weak, generate an adaptive follow-up or remediation question.
3. If previous answer was strong and difficulty increased, ask an architectural trade-off or concurrency/scaling question.
4. Keep the questionText natural and concise for Text-to-Speech (1 to 2 spoken sentences).
5. Provide a concise, user-friendly AI reasoning explaining why this question was selected (e.g. "Formulated to evaluate HashMap collision resolution following your initial answer").

Return ONLY valid JSON:
{
  "questionText": "Clear spoken interview question...",
  "topic": "${currentTopic}",
  "difficulty": "${difficulty}",
  "expectedConcepts": ["Hashing", "Separate Chaining", "Red-Black Trees", "Time Complexity"],
  "aiReasoning": "Selected to assess internal memory management and collision resolution in collections.",
  "isFollowUp": ${isFollowUp},
  "stage": "TECHNICAL"
}
`;

  const llmResult = await callLLM({
    prompt,
    agentName: "QuestionGenerationAgent",
    interviewId,
    candidateId,
    temperature: 0.35,
  });

  if (llmResult.text) {
    const parsed = parseAIJson(llmResult.text, null);
    if (parsed && parsed.questionText) {
      return {
        questionText: parsed.questionText.trim(),
        topic: parsed.topic || currentTopic,
        difficulty: parsed.difficulty || difficulty,
        expectedConcepts: Array.isArray(parsed.expectedConcepts) ? parsed.expectedConcepts : [currentTopic],
        aiReasoning: parsed.aiReasoning || `Targeted question on ${currentTopic} at ${difficulty} level.`,
        isFollowUp: parsed.isFollowUp ?? isFollowUp,
        stage: parsed.stage || (round === "ROUND_2_MANAGERIAL" ? "MANAGERIAL" : round === "ROUND_3_HR" ? "HR" : "TECHNICAL"),
        ragSource: ragContext ? currentTopic : "General Knowledge",
      };
    }
  }

  // Realistic adaptive fallbacks by round & topic
  if (round === "ROUND_2_MANAGERIAL") {
    const managerialFallbacks = [
      {
        questionText: `Can you describe a situation where you had a critical disagreement with a senior engineer or product manager on system architecture, and how you arrived at a consensus?`,
        topic: "Teamwork & Conflict Resolution",
        expectedConcepts: ["STAR Framework", "Data-driven decisions", "Disagree and Commit", "Communication"],
        aiReasoning: "Assessing team collaboration and constructive dispute resolution techniques.",
      },
      {
        questionText: `Tell me about a high-severity production outage or memory leak in a project you owned. How did you triage, resolve it under pressure, and prevent regression?`,
        topic: "Production Outages & Incident Management",
        expectedConcepts: ["Root Cause Analysis", "Monitoring", "Post-mortem", "Zero Downtime"],
        aiReasoning: "Probing resilience and production incident diagnosis under strict deadlines.",
      },
      {
        questionText: `How do you balance the trade-offs between rapid feature delivery requested by business stakeholders versus refactoring technical debt and maintaining high test coverage?`,
        topic: "Project Ownership & Trade-offs",
        expectedConcepts: ["Technical Debt", "Prioritization", "Maintainability", "Agile Velocity"],
        aiReasoning: "Evaluating engineering leadership and pragmatic prioritization.",
      },
    ];
    const picked = managerialFallbacks[questionIndex % managerialFallbacks.length];
    return {
      ...picked,
      difficulty,
      isFollowUp,
      stage: "MANAGERIAL",
      ragSource: "Managerial Competencies",
    };
  }

  if (round === "ROUND_3_HR") {
    const hrFallbacks = [
      {
        questionText: `What key factors motivated you to apply for ${targetRole} with us, and where do you see your engineering growth over the next two to three years?`,
        topic: "Career Aspirations & Culture Fit",
        expectedConcepts: ["Career Alignment", "Culture Fit", "Continuous Learning", "Team Impact"],
        aiReasoning: "Evaluating motivation and long-term career alignment with company culture.",
      },
      {
        questionText: `What are your salary expectations for this position, and what are your preferences regarding work environment and joining availability?`,
        topic: "Compensation & Work Logistics",
        expectedConcepts: ["Market Alignment", "Work Flexibility", "Notice Period"],
        aiReasoning: "Clarifying expectations regarding compensation and onboarding timelines.",
      },
      {
        questionText: `What type of team culture empowers you to do your highest quality work, and what questions do you have for our engineering leadership?`,
        topic: "Workplace Ethics & Values",
        expectedConcepts: ["Team Culture", "Engineering Standards", "Curiosity"],
        aiReasoning: "Checking organizational values alignment and candidate initiative.",
      },
    ];
    const picked = hrFallbacks[questionIndex % hrFallbacks.length];
    return {
      ...picked,
      difficulty,
      isFollowUp,
      stage: "HR",
      ragSource: "HR & Culture",
    };
  }

  // Technical Round fallback
  const techFallbacks = [
    {
      questionText: `Let's discuss ${currentTopic}. How does it work internally, and how do you optimize it for high-throughput concurrency and low latency?`,
      topic: currentTopic,
      expectedConcepts: ["Internal Working", "Time Complexity", "Concurrency", "Optimization"],
      aiReasoning: `Grounded in ${currentTopic} fundamentals and performance characteristics.`,
    },
    {
      questionText: `Can you walk me through a specific edge-case or performance bottleneck you encountered with ${currentTopic} in a production project and how you diagnosed it?`,
      topic: currentTopic,
      expectedConcepts: ["Edge Cases", "Debugging", "Profiling", "Trade-offs"],
      aiReasoning: `Probing practical troubleshooting and real-world system debugging on ${currentTopic}.`,
    },
    {
      questionText: `When scaling an API to millions of daily requests, what database indexing and caching strategies would you apply to prevent database contention?`,
      topic: "System Design & Optimization",
      expectedConcepts: ["Indexing B+ Trees", "Redis Caching", "Rate Limiting", "Connection Pooling"],
      aiReasoning: "Testing architectural scalability and distributed caching principles.",
    },
  ];

  const picked = techFallbacks[questionIndex % techFallbacks.length];
  return {
    ...picked,
    difficulty,
    isFollowUp,
    stage: "TECHNICAL",
    ragSource: currentTopic,
  };
};

module.exports = {
  generateQuestion,
};
