const { GoogleGenAI } = require("@google/genai");

let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI client:", e);
  }
}

// Clean JSON response utility
const parseAIJson = (rawText, defaultFallback = {}) => {
  if (!rawText) return defaultFallback;
  try {
    let clean = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    // find first { and last }
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
  } catch (err) {
    console.error("JSON parsing error on AI response:", err, rawText);
    return defaultFallback;
  }
};

// Safe generate content with multiple fallback models
const safeGenerateContent = async (prompt) => {
  if (!ai) return null;

  const modelsToTry = [
    "gemini-3.6-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
  ];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`Model ${modelName} call failed, trying next fallback:`, err.message || err);
    }
  }

  return null;
};

/**
 * 1. Extract Resume Data (Skills, Education, Experience)
 */
const extractResumeData = async (resumeText) => {
  try {
    const prompt = `
You are an expert AI Technical Recruiter and Resume Parser.
Analyze the following resume text and extract the candidate's core technical and professional skills.

Return ONLY a valid JSON object in this exact schema:
{
  "skills": ["JavaScript", "React", "Node.js", "DSA", "Operating Systems", "DBMS", "MongoDB", "SQL"],
  "education": "B.Tech Computer Science",
  "experience": "Fresher / 1+ Year"
}

Resume Text:
${resumeText.substring(0, 5000)}
`;

    const rawText = await safeGenerateContent(prompt);
    if (rawText) {
      const parsed = parseAIJson(rawText, null);
      if (parsed && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Gemini extractResumeData error:", err);
  }

  // Fallback extraction from text regex heuristics
  const commonKeywords = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Ruby", "PHP",
    "React", "React.js", "Next.js", "Angular", "Vue", "HTML", "CSS", "Tailwind CSS", "Bootstrap",
    "Node.js", "Express", "Express.js", "FastAPI", "Django", "Spring Boot",
    "MongoDB", "MySQL", "PostgreSQL", "SQL", "Redis", "Firebase", "DynamoDB",
    "DSA", "Data Structures", "Algorithms", "Operating Systems", "OS", "DBMS", "Computer Networks", "CN", "OOPs",
    "Git", "GitHub", "Docker", "Kubernetes", "AWS", "CI/CD", "REST API", "GraphQL", "Machine Learning", "AI"
  ];

  const foundSkills = [];
  const textLower = resumeText.toLowerCase();
  for (const keyword of commonKeywords) {
    const pattern = new RegExp(`\\b${keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(textLower) && !foundSkills.includes(keyword)) {
      foundSkills.push(keyword);
    }
  }

  return {
    skills: foundSkills.length > 0 ? foundSkills : ["DSA", "Operating Systems", "DBMS", "Computer Networks", "JavaScript", "React.js"],
    education: "B.Tech / Computer Science",
    experience: "Entry-Level / Software Engineering",
  };
};

/**
 * 2. Generate Next Interview Question (3-Round Realistic Architecture)
 */
const generateRecruiterQuestion = async ({
  candidateName = "Candidate",
  skills = ["DSA", "React.js", "Node.js", "DBMS"],
  targetRole = "Software Development Engineer (SDE)",
  round = "ROUND_1_TECHNICAL",
  currentQuestionIndex = 0,
  previousConversations = [],
  resumeText = "",
}) => {
  let stage = "TECHNICAL";
  let targetSkill = skills[0] || "Core Fundamentals";
  let isFollowUp = false;

  // Determine stage and focus based on round & index
  if (round === "ROUND_2_MANAGERIAL") {
    stage = "MANAGERIAL";
    const managerialTopics = [
      "Teamwork & Conflict Resolution",
      "Handling Tight Deadlines & Production Incidents",
      "Project Ownership & Trade-offs",
      "Leadership & Mentorship",
    ];
    targetSkill = managerialTopics[currentQuestionIndex % managerialTopics.length];
    isFollowUp = currentQuestionIndex > 0 && currentQuestionIndex % 2 === 1;
  } else if (round === "ROUND_3_HR") {
    stage = "HR";
    const hrTopics = [
      "Career Goals & Company Culture Fit",
      "Salary Expectations & Work Preferences",
      "Work Ethics, Notice Period & Joining",
      "Candidate Questions for the Organization",
    ];
    targetSkill = hrTopics[currentQuestionIndex % hrTopics.length];
    isFollowUp = currentQuestionIndex > 0 && currentQuestionIndex % 2 === 1;
  } else {
    // ROUND_1_TECHNICAL
    stage = "TECHNICAL";
    const techSkills = skills.length > 0 ? skills : ["DSA", "System Architecture", "DBMS", "Coding Logic"];
    targetSkill = techSkills[currentQuestionIndex % techSkills.length];
    isFollowUp = currentQuestionIndex > 0 && currentQuestionIndex % 2 === 1;
  }

  try {
    const historyContext = previousConversations
      .slice(-6)
      .map((msg) => `${msg.speaker}: ${msg.text}`)
      .join("\n");

    let rolePersonaPrompt = "";
    if (round === "ROUND_2_MANAGERIAL") {
      rolePersonaPrompt = `
You are the Senior Engineering Manager and Team Lead conducting "Round 2: Managerial & Behavioral Round" for "${candidateName}" applying for "${targetRole}".
Focus on:
- How they collaborate across engineering, product, and QA teams.
- Situational questions using the STAR framework (Situation, Task, Action, Result).
- How they resolve disagreements with peers, handle scope creep, or manage production outages under pressure.
- In follow-ups, challenge their decisions: "Why did you choose that approach instead of escalating to the tech lead?".
`;
    } else if (round === "ROUND_3_HR") {
      rolePersonaPrompt = `
You are the Head of Human Resources conducting "Round 3: HR Discussion Round" for "${candidateName}" for "${targetRole}".
Focus on:
- Career aspirations, motivation for choosing this company, and long-term vision.
- Salary expectations, relocation preferences, work culture alignment, and notice period.
- Workplace ethics, adaptability to feedback, and addressing any questions they have for the recruiter.
- Maintain a warm, encouraging, yet professional and thorough HR tone.
`;
    } else {
      // ROUND_1_TECHNICAL
      rolePersonaPrompt = `
You are a Principal Software Engineer & Bar Raiser conducting "Round 1: Technical & Skill-Based Interview" for "${candidateName}" for "${targetRole}".
Focus on:
- Deep dive into core subjects (DSA, OS, DBMS, Networks, Concurrency, System Design, REST APIs).
- Practical code reasoning, debugging scenarios, algorithmic complexity, memory bottlenecks, and architectural trade-offs.
- Avoid superficial questions like "What is HTML". Ask realistic engineering scenarios (e.g. "How would you optimize a database query with millions of records?", "How does Node.js event loop handle blocking I/O?", "Explain how you architected a project from your resume.").
- If this is a follow-up, actively probe the candidate's last spoken answer regarding edge cases or scalability.
`;
    }

    const prompt = `
${rolePersonaPrompt}

Candidate confirmed skills: ${skills.join(", ")}.
Current Round: ${round}
Question Number in this Round: ${currentQuestionIndex + 1}
Target Area / Skill: ${targetSkill}
Is Follow-up Probe: ${isFollowUp ? "YES" : "NO"}

Recent Conversation in this Round:
${historyContext || "No previous interactions in this round. This is the opening question."}

Instructions:
- Frame a realistic, high-impact spoken interview question suited for ${round}.
- Make sure questions are varied, insightful, and directly test practical competency.
- Keep the recruiter question concise and natural to be spoken by Text-to-Speech (1 to 2 sentences max).

Return ONLY valid JSON in this exact structure:
{
  "questionText": "Realistic spoken question text here...",
  "stage": "${stage}",
  "targetSkill": "${targetSkill}",
  "isFollowUp": ${isFollowUp}
}
`;

    const rawText = await safeGenerateContent(prompt);
    if (rawText) {
      const parsed = parseAIJson(rawText, null);
      if (parsed && parsed.questionText) {
        return {
          questionText: parsed.questionText.trim(),
          stage: parsed.stage || stage,
          targetSkill: parsed.targetSkill || targetSkill,
          isFollowUp: parsed.isFollowUp || isFollowUp,
        };
      }
    }
  } catch (err) {
    console.error("Gemini generateRecruiterQuestion error:", err);
  }

  // Realistic Fallback Questions by Round
  if (round === "ROUND_2_MANAGERIAL") {
    const managerialFallbacks = [
      {
        stage: "MANAGERIAL",
        targetSkill: "Teamwork & Conflict Resolution",
        questionText: `Welcome to the Managerial Round, ${candidateName}. Can you describe a situation where you had a strong disagreement with a team member or tech lead on an implementation, and how you reached a resolution?`,
        isFollowUp: false,
      },
      {
        stage: "MANAGERIAL",
        targetSkill: "Handling Production Incidents",
        questionText: "Tell me about a time when a critical bug or outage occurred in a system you worked on close to a deadline. How did you diagnose and prioritize the fix?",
        isFollowUp: true,
      },
      {
        stage: "MANAGERIAL",
        targetSkill: "Project Ownership & Trade-offs",
        questionText: "How do you manage trade-offs between delivering features quickly for business needs versus maintaining clean architecture and code quality?",
        isFollowUp: false,
      },
      {
        stage: "MANAGERIAL",
        targetSkill: "Leadership & Growth",
        questionText: "Can you give an example of how you mentor junior teammates or proactively improve processes in your development cycle?",
        isFollowUp: true,
      },
    ];
    return managerialFallbacks[currentQuestionIndex % managerialFallbacks.length];
  } else if (round === "ROUND_3_HR") {
    const hrFallbacks = [
      {
        stage: "HR",
        targetSkill: "Introduction & Culture Fit",
        questionText: `Hello ${candidateName}, welcome to the HR Discussion Round. What attracted you to our organization, and where do you see your career growing over the next 2 to 3 years?`,
        isFollowUp: false,
      },
      {
        stage: "HR",
        targetSkill: "Salary & Work Preferences",
        questionText: "What are your salary expectations for this role, and what are your preferences regarding work environment and joining availability?",
        isFollowUp: false,
      },
      {
        stage: "HR",
        targetSkill: "Workplace Values",
        questionText: "What type of team culture enables you to do your best work, and do you have any questions for our HR leadership team?",
        isFollowUp: true,
      },
    ];
    return hrFallbacks[currentQuestionIndex % hrFallbacks.length];
  } else {
    // ROUND_1_TECHNICAL
    const techSkill1 = skills[0] || "Data Structures";
    const techSkill2 = skills[1] || "Databases & System Architecture";
    const techFallbacks = [
      {
        stage: "TECHNICAL",
        targetSkill: techSkill1,
        questionText: `Welcome to Round 1: Technical Interview, ${candidateName}. Let's dive into ${techSkill1}. How do you choose the right data structures to optimize both time complexity and memory usage in high-throughput applications?`,
        isFollowUp: false,
      },
      {
        stage: "TECHNICAL",
        targetSkill: techSkill1,
        questionText: `Building on that, can you walk me through an edge-case or performance bottleneck you encountered with ${techSkill1} in a real project and how you solved it?`,
        isFollowUp: true,
      },
      {
        stage: "TECHNICAL",
        targetSkill: techSkill2,
        questionText: `Let's discuss ${techSkill2}. How do you handle concurrency, indexing, and data consistency when designing scalable backend services?`,
        isFollowUp: false,
      },
      {
        stage: "TECHNICAL",
        targetSkill: "System Design & Architecture",
        questionText: "If you had to design an API with rate limiting and caching to prevent server overload, what architecture and strategies would you choose?",
        isFollowUp: true,
      },
    ];
    return techFallbacks[currentQuestionIndex % techFallbacks.length];
  }
};

/**
 * 3. AI Answer Evaluation (Per question evaluation across 4 dimensions)
 */
const evaluateAnswer = async ({
  questionText,
  candidateAnswer,
  targetSkill = "Technical Skills",
  stage = "TECHNICAL",
  candidateName = "Candidate",
}) => {
  try {
    if (candidateAnswer && candidateAnswer.trim().length > 5) {
      const prompt = `
You are NexHire AI, an expert technical and managerial interviewer evaluating an interview answer.

Question Asked: "${questionText}"
Stage: "${stage}" (${targetSkill})
Candidate Spoken Answer: "${candidateAnswer}"

Evaluate the candidate's answer across these dimensions:
1. technicalAccuracy (Score out of 10, e.g. 8.5)
2. communication (Score out of 10, e.g. 7.8)
3. confidence (Score out of 10, e.g. 8.0)
4. examplesUsed (Score out of 10, e.g. 6.5)
5. strengths: Brief sentence on what was good (e.g. "Clear explanation of core concept and key principles")
6. areasToImprove: Brief constructive suggestion (e.g. "Add practical examples and mention time complexity")
7. feedback: Concise recruiter summary feedback

Return ONLY valid JSON in this exact structure:
{
  "technicalAccuracy": 8.5,
  "communication": 7.8,
  "confidence": 8.0,
  "examplesUsed": 6.5,
  "strengths": "Clear explanation of core concept",
  "areasToImprove": "Add practical examples and mention time complexity",
  "feedback": "Strong communication and confidence. Improve technical depth in practical state management for a stronger recommendation."
}
`;

      const rawText = await safeGenerateContent(prompt);
      if (rawText) {
        const parsed = parseAIJson(rawText, null);
        if (parsed && typeof parsed.technicalAccuracy === "number") {
          return {
            technicalAccuracy: Math.min(10, Math.max(1, Number(parsed.technicalAccuracy.toFixed(1)))),
            communication: Math.min(10, Math.max(1, Number(parsed.communication.toFixed(1)))),
            confidence: Math.min(10, Math.max(1, Number(parsed.confidence.toFixed(1)))),
            examplesUsed: Math.min(10, Math.max(1, Number(parsed.examplesUsed.toFixed(1)))),
            strengths: parsed.strengths || "Clear explanation of core concept",
            areasToImprove: parsed.areasToImprove || "Add practical examples and mention time complexity",
            feedback: parsed.feedback || "Good conceptual clarity and structured delivery.",
          };
        }
      }
    }
  } catch (err) {
    console.error("Gemini evaluateAnswer error:", err);
  }

  // Fallback evaluation heuristic
  const wordCount = (candidateAnswer || "").trim().split(/\s+/).filter(Boolean).length;
  let baseScore = wordCount > 25 ? 8.5 : wordCount > 10 ? 7.5 : 6.0;

  return {
    technicalAccuracy: Number((baseScore).toFixed(1)),
    communication: Number((baseScore - 0.7).toFixed(1)),
    confidence: Number((baseScore - 0.5).toFixed(1)),
    examplesUsed: Number((baseScore - 1.2).toFixed(1)),
    strengths: "Clear explanation of core concept and structured thought process",
    areasToImprove: "Add practical code examples and mention real-world trade-offs",
    feedback: "Demonstrated solid understanding of the fundamentals with articulate communication.",
  };
};

/**
 * 4. Generate Personalized Round Recommendation & Progression Decision
 */
const generateRoundRecommendation = async ({
  candidateName = "Candidate",
  targetRole = "Software Development Engineer (SDE)",
  round = "ROUND_1_TECHNICAL",
  evaluations = [],
  conversationHistory = [],
}) => {
  const roundNames = {
    ROUND_1_TECHNICAL: {
      name: "Round 1: Technical & Skill-Based Assessment",
      nextRound: "ROUND_2_MANAGERIAL",
      nextTitle: "Round 2: Managerial & Behavioral Round",
    },
    ROUND_2_MANAGERIAL: {
      name: "Round 2: Managerial & Behavioral Assessment",
      nextRound: "ROUND_3_HR",
      nextTitle: "Round 3: HR Discussion Round",
    },
    ROUND_3_HR: {
      name: "Round 3: HR Discussion & Culture Fit",
      nextRound: "COMPLETED",
      nextTitle: "Final Hiring Offer Decision",
    },
  };

  const currentInfo = roundNames[round] || roundNames.ROUND_1_TECHNICAL;

  try {
    const summaryEvaluations = evaluations
      .map(
        (e, idx) =>
          `Q${idx + 1}: [Accuracy: ${e.technicalAccuracy || 8}/10, Comm: ${e.communication || 8}/10, Conf: ${e.confidence || 8}/10, Examples: ${e.examplesUsed || 7}/10] Strengths: "${e.strengths}", Areas to Polish: "${e.areasToImprove}"`
      )
      .join("\n");

    const prompt = `
You are the Head Interview Panel at NexHire AI.
Analyze the candidate's performance in "${currentInfo.name}" for "${targetRole}".
Candidate: "${candidateName}".

Evaluations in this round:
${summaryEvaluations}

Evaluate whether the candidate successfully cleared this round and is recommended to proceed to "${currentInfo.nextTitle}".
- If average score >= 6.5: passed = true, proceedToNext = true.
- If average score < 6.5: passed = false, proceedToNext = false.

Return ONLY valid JSON in this exact schema:
{
  "round": "${round}",
  "title": "${currentInfo.name}",
  "passed": true,
  "proceedToNext": true,
  "score": 8.4,
  "keyFeedback": "Candidate demonstrated impressive technical clarity, sound algorithmic foundation, and structured communication throughout this round.",
  "strengths": "Strong command of core programming concepts and practical scenario reasoning.",
  "areasToImprove": "Provide deeper edge-case coverage and quantify metrics when describing past project wins.",
  "recommendedNextRound": "${currentInfo.nextRound}"
}
`;

    const rawText = await safeGenerateContent(prompt);
    if (rawText) {
      const parsed = parseAIJson(rawText, null);
      if (parsed && typeof parsed.score === "number") {
        return {
          round,
          title: currentInfo.name,
          passed: parsed.passed ?? true,
          proceedToNext: parsed.proceedToNext ?? true,
          score: Number(parsed.score.toFixed(1)),
          keyFeedback: parsed.keyFeedback || "Candidate demonstrated commendable performance in this round.",
          strengths: parsed.strengths || "Clear articulation and strong problem-solving mindset.",
          areasToImprove: parsed.areasToImprove || "Deepen practical code examples and edge-case analysis.",
          recommendedNextRound: currentInfo.nextRound,
          evaluatedAt: new Date(),
        };
      }
    }
  } catch (err) {
    console.error("Gemini generateRoundRecommendation error:", err);
  }

  // Fallback calculation
  let avgScore = 8.0;
  if (evaluations.length > 0) {
    const sum = evaluations.reduce((acc, cur) => acc + (cur.technicalAccuracy || 8) + (cur.communication || 8), 0);
    avgScore = Number((sum / (evaluations.length * 2)).toFixed(1));
  }

  const passed = avgScore >= 6.5;

  return {
    round,
    title: currentInfo.name,
    passed,
    proceedToNext: passed,
    score: avgScore,
    keyFeedback: passed
      ? `Strong performance in ${currentInfo.name}. Candidate is well-prepared to proceed to ${currentInfo.nextTitle}.`
      : `Needs further polish in core areas before retrying ${currentInfo.name}.`,
    strengths: "Structured responses and good understanding of industry practices.",
    areasToImprove: "Elaborate with deeper concrete examples and real-world system trade-offs.",
    recommendedNextRound: currentInfo.nextRound,
    evaluatedAt: new Date(),
  };
};

/**
 * 5. AI Recruiter Final Decision (Aggregating all 3 rounds)
 */
const generateRecruiterDecision = async ({
  candidateName = "Candidate",
  skills = [],
  targetRole = "Software Engineer / SDE",
  conversationHistory = [],
  evaluations = [],
  roundRecommendations = [],
}) => {
  try {
    const summaryEvaluations = evaluations
      .map(
        (e, idx) =>
          `Q${idx + 1}: [Acc: ${e.technicalAccuracy}/10, Comm: ${e.communication}/10, Conf: ${e.confidence}/10] Strengths: "${e.strengths}"`
      )
      .join("\n");

    const prompt = `
You are NexHire AI Head of Recruitment & Talent Assessment.
Generate the final hiring decision and offer recommendation for candidate "${candidateName}" for the role "${targetRole}".
Skills: ${skills.join(", ")}.

Performance summary across Technical, Managerial, and HR interview rounds:
${summaryEvaluations}

Round Highlights:
${JSON.stringify(roundRecommendations)}

Return ONLY valid JSON in this exact structure:
{
  "recommendation": "Recommended for Hire / Offer Extended",
  "fitBadge": "Strong Fit",
  "technicalFit": 86,
  "communicationFit": 84,
  "culturalFit": 88,
  "overallHiringConfidence": 86,
  "overallScore": 8.6,
  "remarks": "The candidate has demonstrated strong technical problem-solving in Round 1, solid leadership & collaboration in Round 2, and excellent culture fit in Round 3. Highly recommended for immediate hiring for ${targetRole}."
}
`;

    const rawText = await safeGenerateContent(prompt);
    if (rawText) {
      const parsed = parseAIJson(rawText, null);
      if (parsed && parsed.recommendation) {
        return {
          recommendation: parsed.recommendation,
          fitBadge: parsed.fitBadge || "Strong Fit",
          technicalFit: Number(parsed.technicalFit || 85),
          communicationFit: Number(parsed.communicationFit || 82),
          culturalFit: Number(parsed.culturalFit || 88),
          overallHiringConfidence: Number(parsed.overallHiringConfidence || 85),
          overallScore: Number(parsed.overallScore || 8.5),
          remarks: parsed.remarks || `Candidate demonstrated outstanding competency across all interview rounds. Recommended for ${targetRole}.`,
        };
      }
    }
  } catch (err) {
    console.error("Gemini generateRecruiterDecision error:", err);
  }

  // Fallback calculations based on evaluations
  let avgAcc = 8.4;
  let avgComm = 8.2;
  let avgConf = 8.5;
  let avgEx = 8.0;

  if (evaluations.length > 0) {
    avgAcc = evaluations.reduce((acc, cur) => acc + (cur.technicalAccuracy || 8), 0) / evaluations.length;
    avgComm = evaluations.reduce((acc, cur) => acc + (cur.communication || 8), 0) / evaluations.length;
    avgConf = evaluations.reduce((acc, cur) => acc + (cur.confidence || 8), 0) / evaluations.length;
    avgEx = evaluations.reduce((acc, cur) => acc + (cur.examplesUsed || 7.5), 0) / evaluations.length;
  }

  const technicalFit = Math.round(avgAcc * 10);
  const communicationFit = Math.round(avgComm * 10);
  const culturalFit = Math.round(avgConf * 10.2);
  const overallHiringConfidence = Math.round((technicalFit + communicationFit + culturalFit) / 3);
  const overallScore = Number(((avgAcc + avgComm + avgConf + avgEx) / 4).toFixed(1));

  return {
    recommendation: overallHiringConfidence >= 75 ? "Recommended for Hire / Offer Extended" : "Recommended for Further Evaluation",
    fitBadge: overallHiringConfidence >= 80 ? "Strong Fit" : "Moderate Fit",
    technicalFit,
    communicationFit,
    culturalFit,
    overallHiringConfidence,
    overallScore,
    remarks: `The candidate demonstrated strong domain fundamentals, clear communication, and leadership maturity. Recommended for ${targetRole}.`,
  };
};

module.exports = {
  extractResumeData,
  generateRecruiterQuestion,
  evaluateAnswer,
  generateRoundRecommendation,
  generateRecruiterDecision,
};