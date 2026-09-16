const { callLLM, parseAIJson } = require("../../services/llmService");

/**
 * Agent 5: Evaluation Agent (LLM-as-a-Judge)
 * Evaluates candidate answers using a strict 5-factor rubric and identifies missing concepts
 */
const evaluateCandidateAnswer = async ({
  questionText = "",
  candidateAnswer = "",
  expectedConcepts = [],
  targetSkill = "Technical Skills",
  stage = "TECHNICAL",
  candidateName = "Candidate",
  candidateId = null,
  interviewId = "",
}) => {
  const prompt = `
You are the Senior Evaluation Agent & LLM-as-a-Judge for NexHire AI.
Evaluate the candidate's interview answer objectively using our strict 5-factor evaluation rubric.

Interview Question: "${questionText}"
Stage / Focus: "${stage}" (${targetSkill})
Expected Key Concepts: ${expectedConcepts.length > 0 ? expectedConcepts.join(", ") : "Core principles"}
Candidate Answer: "${candidateAnswer ? candidateAnswer.substring(0, 1500) : "No answer provided"}"

Rubric Dimensions (Scores from 1.0 to 10.0):
1. correctness (30% weight): Technical factual accuracy and correctness.
2. technicalDepth (25% weight): Depth of knowledge, internal mechanics, edge-case awareness.
3. relevance (20% weight): Directness of answer to what was asked.
4. clarity (15% weight): Structure, articulation, precision of language.
5. completeness (10% weight): Thoroughness across required concepts.

Overall Score formula:
overall = (correctness * 0.30) + (technicalDepth * 0.25) + (relevance * 0.20) + (clarity * 0.15) + (completeness * 0.10)

Also identify:
- missingConcepts: List of essential concepts or keywords the candidate omitted.
- strengths: Concise sentence on strong points.
- areasToImprove: Specific actionable advice to reach 10/10.
- feedback: Recruiter summary commentary.

Return ONLY valid JSON:
{
  "correctness": 8.5,
  "technicalDepth": 7.5,
  "relevance": 9.0,
  "clarity": 8.0,
  "completeness": 7.0,
  "overall": 8.1,
  "missingConcepts": ["Time Complexity", "Rebalancing"],
  "strengths": "Accurate explanation of fundamental bucket structures.",
  "areasToImprove": "Mention how treeify threshold is triggered in high collisions.",
  "feedback": "Strong conceptual clarity. Deepening performance specifics will make the response outstanding."
}
`;

  const llmResult = await callLLM({
    prompt,
    agentName: "EvaluationAgent",
    interviewId,
    candidateId,
    temperature: 0.2,
  });

  if (llmResult.text) {
    const parsed = parseAIJson(llmResult.text, null);
    if (parsed && typeof parsed.correctness === "number") {
      const correctness = Math.min(10, Math.max(1, Number(parsed.correctness.toFixed(1))));
      const technicalDepth = Math.min(10, Math.max(1, Number((parsed.technicalDepth || parsed.correctness).toFixed(1))));
      const relevance = Math.min(10, Math.max(1, Number((parsed.relevance || 8.0).toFixed(1))));
      const clarity = Math.min(10, Math.max(1, Number((parsed.clarity || 8.0).toFixed(1))));
      const completeness = Math.min(10, Math.max(1, Number((parsed.completeness || 7.5).toFixed(1))));

      const calculatedOverall = Number(
        (
          correctness * 0.3 +
          technicalDepth * 0.25 +
          relevance * 0.2 +
          clarity * 0.15 +
          completeness * 0.1
        ).toFixed(1)
      );

      const overall = typeof parsed.overall === "number" ? Math.min(10, Math.max(1, Number(parsed.overall.toFixed(1)))) : calculatedOverall;

      return {
        correctness,
        technicalDepth,
        relevance,
        clarity,
        completeness,
        overall,
        missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : [],
        strengths: parsed.strengths || "Good structured explanation.",
        areasToImprove: parsed.areasToImprove || "Elaborate with concrete architectural examples.",
        feedback: parsed.feedback || "Solid foundation with room to demonstrate deeper mechanics.",
        // Backward compatibility
        technicalAccuracy: correctness,
        communication: clarity,
        confidence: relevance,
        examplesUsed: technicalDepth,
      };
    }
  }

  // Deterministic fallback evaluation based on keyword coverage and depth heuristic
  const words = (candidateAnswer || "").trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let baseScore = wordCount >= 40 ? 8.2 : wordCount >= 20 ? 7.2 : wordCount >= 10 ? 6.0 : 4.5;
  const missing = expectedConcepts.filter((c) => !candidateAnswer.toLowerCase().includes(c.toLowerCase()));

  return {
    correctness: Number((baseScore).toFixed(1)),
    technicalDepth: Number((baseScore - 0.5).toFixed(1)),
    relevance: Number((baseScore + 0.3).toFixed(1)),
    clarity: Number((baseScore).toFixed(1)),
    completeness: Number((baseScore - 0.7).toFixed(1)),
    overall: Number((baseScore).toFixed(1)),
    missingConcepts: missing.slice(0, 3),
    strengths: "Structured articulation and clear fundamental reasoning.",
    areasToImprove: "Elaborate on production scalability and edge case handling.",
    feedback: "Demonstrated sound grasp of the requested concept.",
    technicalAccuracy: Number((baseScore).toFixed(1)),
    communication: Number((baseScore).toFixed(1)),
    confidence: Number((baseScore).toFixed(1)),
    examplesUsed: Number((baseScore - 0.5).toFixed(1)),
  };
};

module.exports = {
  evaluateCandidateAnswer,
};
