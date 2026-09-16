const { planInterview } = require("../plannerAgent/plannerAgent");
const { generateQuestion } = require("../questionAgent/questionAgent");
const { evaluateCandidateAnswer } = require("../evaluationAgent/evaluationAgent");
const { generateLearningRoadmap } = require("../careerCoachAgent/careerCoachAgent");
const { retrieveKnowledge } = require("../../rag/retrieval/retrievalService");
const {
  recordEvaluationMemory,
  getCandidateWeaknesses,
  getCandidateMemorySummary,
} = require("../../services/memoryService");
const CandidateProfile = require("../../models/CandidateProfile");

const DIFFICULTY_LEVELS = ["beginner", "medium", "advanced", "hard"];

/**
 * Deterministic Difficulty Router
 * Computes next difficulty level strictly based on rubric evaluation score
 */
const routeDifficulty = (currentDifficulty = "medium", score = 7.5) => {
  let currentIndex = DIFFICULTY_LEVELS.indexOf(currentDifficulty.toLowerCase());
  if (currentIndex === -1) currentIndex = 1; // default to medium

  let nextDifficulty = currentDifficulty;
  let action = "maintain";

  if (score >= 8.0) {
    if (currentIndex < DIFFICULTY_LEVELS.length - 1) {
      currentIndex += 1;
      nextDifficulty = DIFFICULTY_LEVELS[currentIndex];
      action = "increase";
    } else {
      nextDifficulty = "hard";
      action = "maintain_peak";
    }
  } else if (score < 5.0) {
    if (currentIndex > 0) {
      currentIndex -= 1;
      nextDifficulty = DIFFICULTY_LEVELS[currentIndex];
      action = "remediate";
    } else {
      nextDifficulty = "beginner";
      action = "maintain_floor";
    }
  } else {
    action = "maintain";
  }

  return { nextDifficulty, action };
};

/**
 * Supervisor: Orchestrate Interview Initialization
 */
const startOrchestratedInterview = async ({
  userId,
  candidateName = "Candidate",
  targetRole = "Software Development Engineer (SDE)",
  round = "ROUND_1_TECHNICAL",
  skills = [],
}) => {
  // 1. Fetch Candidate Profile & Historical Memory
  let candidateProfile = await CandidateProfile.findOne({ userId });
  if (!candidateProfile && skills.length > 0) {
    candidateProfile = {
      skills: skills.map((s) => ({ name: s, level: "intermediate", confidence: 0.8 })),
      targetRoles: [targetRole],
    };
  }

  const candidateWeaknesses = await getCandidateWeaknesses(userId, 5);
  const memorySummary = await getCandidateMemorySummary(userId);

  // 2. Planner Agent builds topic & difficulty roadmap
  const interviewPlan = await planInterview({
    candidateProfile,
    targetRole,
    round,
    candidateWeaknesses,
    candidateId: userId,
  });

  const initialTopic = interviewPlan.topics[0] || (skills[0] || "Core Fundamentals");
  const initialDifficulty = interviewPlan.initialDifficulty || "medium";

  // 3. RAG Retrieval for initial topic
  const ragResult = await retrieveKnowledge({
    query: initialTopic,
    domain: initialTopic.includes("Java") ? "Java" : initialTopic.includes("React") ? "React" : "General",
    topic: initialTopic,
    difficulty: initialDifficulty,
    topK: 2,
  });

  // 4. Question Generation Agent crafts first question
  const firstQuestion = await generateQuestion({
    candidateName,
    targetRole,
    round,
    currentTopic: initialTopic,
    difficulty: initialDifficulty,
    previousAnswer: "",
    lastEvaluation: null,
    ragContext: ragResult.contextSnippet,
    candidateMemorySummary: memorySummary,
    questionIndex: 0,
    isFollowUp: false,
    candidateId: userId,
  });

  return {
    interviewPlan,
    initialTopic,
    initialDifficulty,
    firstQuestion,
    ragContext: ragResult.contextSnippet,
  };
};

/**
 * Supervisor: Process Candidate Answer Turn with Closed-Loop Orchestration
 */
const processOrchestratedAnswerTurn = async ({
  interview,
  userId,
  answerText,
  duration,
  audioUrl = "",
}) => {
  const currentQIndex = interview.currentQuestionIndex;
  const activeRound = interview.currentRound || "ROUND_1_TECHNICAL";
  const currentDiff = interview.difficultyLevel || "medium";
  const currentTopic =
    interview.questions[currentQIndex]?.targetSkill ||
    interview.questions[currentQIndex]?.topic ||
    interview.skills[currentQIndex % interview.skills.length] ||
    "Core Fundamentals";

  // 1. Evaluation Agent scores answer via 5-factor rubric
  const evaluation = await evaluateCandidateAnswer({
    questionText: interview.currentQuestionText,
    candidateAnswer: answerText,
    expectedConcepts: interview.questions[currentQIndex]?.expectedConcepts || [],
    targetSkill: currentTopic,
    stage: interview.currentStage,
    candidateName: interview.candidateName,
    candidateId: userId,
    interviewId: interview.interviewId,
  });

  // 2. Deterministic Difficulty Adjustment
  const { nextDifficulty, action: diffAction } = routeDifficulty(currentDiff, evaluation.overall);

  // 3. Update Candidate Memory with weaknesses or strengths
  await recordEvaluationMemory({
    candidateId: userId,
    interviewId: interview.interviewId,
    domain: currentTopic,
    topic: currentTopic,
    concept: evaluation.missingConcepts?.[0] || currentTopic,
    score: evaluation.overall,
    evidence: evaluation.areasToImprove || evaluation.feedback,
    missingConcepts: evaluation.missingConcepts || [],
  });

  // Check round limits
  const maxQuestions = activeRound === "ROUND_1_TECHNICAL" ? 4 : 3;
  const nextQIndex = currentQIndex + 1;
  const isRoundCompleted = nextQIndex >= maxQuestions;

  let nextQuestion = null;
  let learningPlan = null;

  if (!isRoundCompleted) {
    // 4. Retrieve RAG Context for the next question topic
    const nextTopic =
      interview.interviewPlan?.topics?.[nextQIndex] ||
      interview.skills[nextQIndex % interview.skills.length] ||
      "System Architecture";

    const memorySummary = await getCandidateMemorySummary(userId);

    const ragResult = await retrieveKnowledge({
      query: nextTopic,
      domain: nextTopic,
      topic: nextTopic,
      difficulty: nextDifficulty,
      topK: 2,
    });

    const shouldFollowUp = evaluation.overall < 6.0 || (evaluation.missingConcepts?.length > 0 && Math.random() > 0.4);

    // 5. Question Generation Agent produces grounded next question
    nextQuestion = await generateQuestion({
      candidateName: interview.candidateName,
      targetRole: interview.targetRole,
      round: activeRound,
      currentTopic: nextTopic,
      difficulty: nextDifficulty,
      previousAnswer: answerText,
      lastEvaluation: evaluation,
      ragContext: ragResult.contextSnippet,
      candidateMemorySummary: memorySummary,
      questionIndex: nextQIndex,
      isFollowUp: shouldFollowUp,
      candidateId: userId,
      interviewId: interview.interviewId,
    });
  } else {
    // Round or Interview Completed: Invoke Career Coach if final round completed
    if (activeRound === "ROUND_3_HR" || interview.currentRound === "ROUND_3_HR") {
      const allWeaknesses = await getCandidateWeaknesses(userId, 10);
      const coachResult = await generateLearningRoadmap({
        candidateId: userId,
        interviewId: interview.interviewId,
        targetRole: interview.targetRole,
        evaluations: [...interview.evaluations, evaluation],
        candidateMemories: allWeaknesses,
      });
      learningPlan = coachResult.learningPlan;
    }
  }

  return {
    evaluation,
    nextDifficulty,
    diffAction,
    nextQuestion,
    isRoundCompleted,
    learningPlan,
  };
};

module.exports = {
  routeDifficulty,
  startOrchestratedInterview,
  processOrchestratedAnswerTurn,
};
