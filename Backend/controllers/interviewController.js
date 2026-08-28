const Interview = require("../models/Interview");
const Conversation = require("../models/Conversation");
const Resume = require("../models/Resume");
const User = require("../models/User");
const {
  generateRecruiterQuestion,
  evaluateAnswer,
  generateRoundRecommendation,
  generateRecruiterDecision,
} = require("../services/geminiService");

const QUESTIONS_PER_ROUND = {
  ROUND_1_TECHNICAL: 4,
  ROUND_2_MANAGERIAL: 3,
  ROUND_3_HR: 3,
};

/**
 * 1. Start a New Interview Session (3-Round Architecture)
 */
exports.startInterview = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let { skills, targetRole, resumeId, round } = req.body;

    const selectedRole = targetRole?.trim() || "Software Development Engineer (SDE)";
    const selectedRound = round || "ROUND_1_TECHNICAL";

    // Find resume or skills for this role
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      if (resumeId) {
        const targetResume = await Resume.findOne({ _id: resumeId, user: userId });
        if (targetResume && targetResume.skills?.length > 0) {
          skills = targetResume.skills;
        }
      }
      if (!skills || skills.length === 0) {
        const latestResume = await Resume.findOne({ user: userId, targetRole: selectedRole });
        if (latestResume && latestResume.skills?.length > 0) {
          skills = latestResume.skills;
        } else {
          const anyResume = await Resume.findOne({ user: userId }).sort({ uploadedAt: -1 });
          if (anyResume && anyResume.skills?.length > 0) {
            skills = anyResume.skills;
          } else if (user && user.skills?.length > 0) {
            skills = user.skills;
          }
        }
      }
    }

    if (!skills || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume or confirm your skills for this role before starting.",
      });
    }

    // Generate Interview ID e.g. INT12345
    const interviewId = "INT" + Math.floor(10000 + Math.random() * 90000);
    const candidateName = user?.name || "Candidate";

    // Generate first question for selected round
    const firstQ = await generateRecruiterQuestion({
      candidateName,
      skills,
      targetRole: selectedRole,
      round: selectedRound,
      currentQuestionIndex: 0,
      previousConversations: [],
    });

    const initialConversation = {
      speaker: "AI_RECRUITER",
      text: firstQ.questionText,
      audioUrl: "",
      timestamp: new Date(),
      duration: 12,
      questionIndex: 0,
      round: selectedRound,
      stage: firstQ.stage,
    };

    const newInterview = await Interview.create({
      interviewId,
      candidate: userId,
      candidateName,
      skills,
      targetRole: selectedRole,
      currentRound: selectedRound,
      roundStatus: "IN_PROGRESS",
      status: "IN_PROGRESS",
      currentQuestionIndex: 0,
      currentStage: firstQ.stage,
      currentQuestionText: firstQ.questionText,
      questions: [
        {
          questionIndex: 0,
          round: selectedRound,
          stage: firstQ.stage,
          targetSkill: firstQ.targetSkill,
          questionText: firstQ.questionText,
          isFollowUp: false,
          duration: 12,
        },
      ],
      conversationHistory: [initialConversation],
      evaluations: [],
      roundRecommendations: [],
      startTime: new Date(),
    });

    // Persist in Conversation collection
    await Conversation.create({
      interviewId,
      targetRole: selectedRole,
      user: userId,
      speaker: "AI_RECRUITER",
      text: firstQ.questionText,
      audioUrl: "",
      timestamp: new Date(),
      duration: 12,
      stage: firstQ.stage,
    });

    return res.status(201).json({
      success: true,
      message: `Interview started for "${selectedRole}" [${selectedRound}]`,
      interview: newInterview,
    });
  } catch (error) {
    console.error("startInterview error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to start interview",
    });
  }
};

/**
 * 2. Get Current / Active Interview Session (Or latest for specific role)
 */
exports.getCurrentSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role, interviewId } = req.query;

    let query = { candidate: userId };
    if (interviewId) {
      query = { candidate: userId, interviewId };
    } else if (role) {
      query.targetRole = role;
    }

    // Find active interview in progress or paused
    let interview = await Interview.findOne({
      ...query,
      status: { $in: ["IN_PROGRESS", "PAUSED"] },
    }).sort({ updatedAt: -1 });

    if (!interview) {
      // Find latest completed interview matching query
      interview = await Interview.findOne(query).sort({ updatedAt: -1 });
    }

    if (!interview) {
      return res.status(200).json({
        success: true,
        hasActiveSession: false,
        interview: null,
      });
    }

    return res.status(200).json({
      success: true,
      hasActiveSession: interview.status === "IN_PROGRESS" || interview.status === "PAUSED",
      interview,
    });
  } catch (error) {
    console.error("getCurrentSession error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 3. Get Specific Interview Session by ID
 */
exports.getSessionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const interview = await Interview.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { interviewId: id }],
      candidate: userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    return res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Switch to a specific Round (Round 1 / Round 2 / Round 3)
 */
exports.switchRound = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const { interviewId, round, targetRole, skills } = req.body;

    const selectedRole = targetRole?.trim() || "Software Development Engineer (SDE)";
    const targetRound = round || "ROUND_1_TECHNICAL";

    let interview = null;
    if (interviewId) {
      interview = await Interview.findOne({
        $or: [{ _id: interviewId.match(/^[0-9a-fA-F]{24}$/) ? interviewId : null }, { interviewId }],
        candidate: userId,
      });
    }

    if (!interview) {
      interview = await Interview.findOne({ candidate: userId, targetRole: selectedRole }).sort({ updatedAt: -1 });
    }

    let activeSkills = skills;
    if (!activeSkills || activeSkills.length === 0) {
      activeSkills = interview?.skills || user?.skills || ["DSA", "System Architecture", "DBMS"];
    }

    const candidateName = user?.name || interview?.candidateName || "Candidate";

    // Generate first question for the target round
    const firstQ = await generateRecruiterQuestion({
      candidateName,
      skills: activeSkills,
      targetRole: selectedRole,
      round: targetRound,
      currentQuestionIndex: 0,
      previousConversations: [],
    });

    const aiMsg = {
      speaker: "AI_RECRUITER",
      text: firstQ.questionText,
      audioUrl: "",
      timestamp: new Date(),
      duration: 12,
      questionIndex: 0,
      round: targetRound,
      stage: firstQ.stage,
    };

    if (interview) {
      interview.currentRound = targetRound;
      interview.roundStatus = "IN_PROGRESS";
      interview.status = "IN_PROGRESS";
      interview.currentQuestionIndex = 0;
      interview.currentStage = firstQ.stage;
      interview.currentQuestionText = firstQ.questionText;
      interview.questions.push({
        questionIndex: 0,
        round: targetRound,
        stage: firstQ.stage,
        targetSkill: firstQ.targetSkill,
        questionText: firstQ.questionText,
        isFollowUp: false,
        duration: 12,
      });
      interview.conversationHistory.push(aiMsg);
      await interview.save();
    } else {
      const newIntId = "INT" + Math.floor(10000 + Math.random() * 90000);
      interview = await Interview.create({
        interviewId: newIntId,
        candidate: userId,
        candidateName,
        skills: activeSkills,
        targetRole: selectedRole,
        currentRound: targetRound,
        roundStatus: "IN_PROGRESS",
        status: "IN_PROGRESS",
        currentQuestionIndex: 0,
        currentStage: firstQ.stage,
        currentQuestionText: firstQ.questionText,
        questions: [
          {
            questionIndex: 0,
            round: targetRound,
            stage: firstQ.stage,
            targetSkill: firstQ.targetSkill,
            questionText: firstQ.questionText,
            isFollowUp: false,
            duration: 12,
          },
        ],
        conversationHistory: [aiMsg],
        evaluations: [],
        roundRecommendations: [],
        startTime: new Date(),
      });
    }

    await Conversation.create({
      interviewId: interview.interviewId,
      targetRole: selectedRole,
      user: userId,
      speaker: "AI_RECRUITER",
      text: firstQ.questionText,
      audioUrl: "",
      timestamp: new Date(),
      duration: 12,
      stage: firstQ.stage,
    });

    return res.status(200).json({
      success: true,
      message: `Switched to ${targetRound}`,
      interview,
    });
  } catch (error) {
    console.error("switchRound error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Proceed to Next Round after Passing Current Round
 */
exports.proceedToNextRound = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interviewId } = req.body;

    const interview = await Interview.findOne({
      $or: [{ _id: interviewId.match(/^[0-9a-fA-F]{24}$/) ? interviewId : null }, { interviewId }],
      candidate: userId,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview session not found" });
    }

    let nextRound = "ROUND_2_MANAGERIAL";
    if (interview.currentRound === "ROUND_1_TECHNICAL") {
      nextRound = "ROUND_2_MANAGERIAL";
    } else if (interview.currentRound === "ROUND_2_MANAGERIAL") {
      nextRound = "ROUND_3_HR";
    }

    // Generate first question for next round
    const firstQ = await generateRecruiterQuestion({
      candidateName: interview.candidateName,
      skills: interview.skills,
      targetRole: interview.targetRole,
      round: nextRound,
      currentQuestionIndex: 0,
      previousConversations: interview.conversationHistory,
    });

    interview.currentRound = nextRound;
    interview.roundStatus = "IN_PROGRESS";
    interview.status = "IN_PROGRESS";
    interview.currentQuestionIndex = 0;
    interview.currentStage = firstQ.stage;
    interview.currentQuestionText = firstQ.questionText;

    interview.questions.push({
      questionIndex: 0,
      round: nextRound,
      stage: firstQ.stage,
      targetSkill: firstQ.targetSkill,
      questionText: firstQ.questionText,
      isFollowUp: false,
      duration: 12,
    });

    const nextAiMsg = {
      speaker: "AI_RECRUITER",
      text: firstQ.questionText,
      audioUrl: "",
      timestamp: new Date(),
      duration: 12,
      questionIndex: 0,
      round: nextRound,
      stage: firstQ.stage,
    };

    interview.conversationHistory.push(nextAiMsg);
    await interview.save();

    await Conversation.create({
      interviewId: interview.interviewId,
      targetRole: interview.targetRole,
      user: userId,
      speaker: "AI_RECRUITER",
      text: firstQ.questionText,
      audioUrl: "",
      timestamp: new Date(),
      duration: 12,
      stage: firstQ.stage,
    });

    return res.status(200).json({
      success: true,
      message: `Proceeded to ${nextRound} successfully 🚀`,
      interview,
    });
  } catch (error) {
    console.error("proceedToNextRound error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Submit Candidate Answer & Handle Round Progression / Completion
 */
exports.submitAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interviewId, text, duration } = req.body;

    const interview = await Interview.findOne({
      interviewId,
      candidate: userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    const answerText = text || "I have worked on these concepts in my projects.";
    const audioUrl = req.file ? `/uploads/audio/${req.file.filename}` : "";
    const answerDuration = Number(duration) || (req.file ? 25 : 15);
    const qIndex = interview.currentQuestionIndex;
    const activeRound = interview.currentRound || "ROUND_1_TECHNICAL";

    // Candidate message
    const candidateMsg = {
      speaker: "CANDIDATE",
      text: answerText,
      audioUrl,
      timestamp: new Date(),
      duration: answerDuration,
      questionIndex: qIndex,
      round: activeRound,
      stage: interview.currentStage,
    };

    interview.conversationHistory.push(candidateMsg);

    // Save in standalone Conversation collection
    await Conversation.create({
      interviewId,
      targetRole: interview.targetRole,
      user: userId,
      speaker: "CANDIDATE",
      text: answerText,
      audioUrl,
      timestamp: new Date(),
      duration: answerDuration,
      stage: interview.currentStage,
    });

    // Evaluate answer with AI
    const evaluation = await evaluateAnswer({
      questionText: interview.currentQuestionText,
      candidateAnswer: answerText,
      targetSkill: interview.skills[qIndex % interview.skills.length] || "Technical Skills",
      stage: interview.currentStage,
      candidateName: interview.candidateName,
    });

    const evalRecord = {
      questionIndex: qIndex,
      round: activeRound,
      questionText: interview.currentQuestionText,
      candidateAnswer: answerText,
      ...evaluation,
      evaluatedAt: new Date(),
    };

    interview.evaluations.push(evalRecord);

    const nextQIndex = qIndex + 1;
    const maxQuestionsForThisRound = QUESTIONS_PER_ROUND[activeRound] || 3;

    let nextQuestion = null;
    let roundRecommendation = null;
    let finalDecision = null;

    if (nextQIndex >= maxQuestionsForThisRound) {
      // 1. Current Round Completed! Generate Round Recommendation
      interview.roundStatus = "ROUND_COMPLETED";

      const roundEvals = interview.evaluations.filter((e) => e.round === activeRound);
      roundRecommendation = await generateRoundRecommendation({
        candidateName: interview.candidateName,
        targetRole: interview.targetRole,
        round: activeRound,
        evaluations: roundEvals,
        conversationHistory: interview.conversationHistory,
      });

      // Update or push into roundRecommendations
      const existingRecIdx = interview.roundRecommendations.findIndex((r) => r.round === activeRound);
      if (existingRecIdx >= 0) {
        interview.roundRecommendations[existingRecIdx] = roundRecommendation;
      } else {
        interview.roundRecommendations.push(roundRecommendation);
      }

      // If this was Round 3 (or all rounds completed), finalize overall interview decision
      if (activeRound === "ROUND_3_HR") {
        interview.status = "COMPLETED";
        interview.roundStatus = "ALL_COMPLETED";
        interview.endTime = new Date();
        interview.durationSeconds = Math.round(
          (interview.endTime - interview.startTime) / 1000
        );

        finalDecision = await generateRecruiterDecision({
          candidateName: interview.candidateName,
          skills: interview.skills,
          targetRole: interview.targetRole,
          conversationHistory: interview.conversationHistory,
          evaluations: interview.evaluations,
          roundRecommendations: interview.roundRecommendations,
        });

        interview.decision = {
          ...finalDecision,
          decidedAt: new Date(),
        };
      }
    } else {
      // Generate Next Dynamic Question for this round
      nextQuestion = await generateRecruiterQuestion({
        candidateName: interview.candidateName,
        skills: interview.skills,
        targetRole: interview.targetRole,
        round: activeRound,
        currentQuestionIndex: nextQIndex,
        previousConversations: interview.conversationHistory.filter((c) => c.round === activeRound),
      });

      interview.currentQuestionIndex = nextQIndex;
      interview.currentStage = nextQuestion.stage;
      interview.currentQuestionText = nextQuestion.questionText;

      interview.questions.push({
        questionIndex: nextQIndex,
        round: activeRound,
        stage: nextQuestion.stage,
        targetSkill: nextQuestion.targetSkill,
        questionText: nextQuestion.questionText,
        isFollowUp: nextQuestion.isFollowUp || false,
        duration: 12,
      });

      const nextAiMsg = {
        speaker: "AI_RECRUITER",
        text: nextQuestion.questionText,
        audioUrl: "",
        timestamp: new Date(),
        duration: 12,
        questionIndex: nextQIndex,
        round: activeRound,
        stage: nextQuestion.stage,
      };

      interview.conversationHistory.push(nextAiMsg);

      await Conversation.create({
        interviewId,
        targetRole: interview.targetRole,
        user: userId,
        speaker: "AI_RECRUITER",
        text: nextQuestion.questionText,
        audioUrl: "",
        timestamp: new Date(),
        duration: 12,
        stage: nextQuestion.stage,
      });
    }

    await interview.save();

    return res.status(200).json({
      success: true,
      interview,
      latestEvaluation: evalRecord,
      nextQuestion,
      roundRecommendation,
      isRoundCompleted: interview.roundStatus === "ROUND_COMPLETED" || interview.roundStatus === "ALL_COMPLETED",
      isCompleted: interview.status === "COMPLETED",
      decision: interview.decision,
    });
  } catch (error) {
    console.error("submitAnswer error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit answer",
    });
  }
};

/**
 * 5. Pause Interview
 */
exports.pauseInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findOne({
      interviewId,
      candidate: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    interview.status = "PAUSED";
    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview paused",
      interview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Resume Interview
 */
exports.resumeInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findOne({
      interviewId,
      candidate: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    interview.status = "IN_PROGRESS";
    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview resumed",
      interview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Skip Current Question
 */
exports.skipQuestion = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findOne({
      interviewId,
      candidate: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    if (interview.questions[interview.currentQuestionIndex]) {
      interview.questions[interview.currentQuestionIndex].isSkipped = true;
    }

    const nextQIndex = interview.currentQuestionIndex + 1;
    const MAX_QUESTIONS = 5;

    if (nextQIndex >= MAX_QUESTIONS) {
      interview.status = "COMPLETED";
      interview.endTime = new Date();
      interview.durationSeconds = Math.round(
        (interview.endTime - interview.startTime) / 1000
      );

      const decision = await generateRecruiterDecision({
        candidateName: interview.candidateName,
        skills: interview.skills,
        targetRole: interview.targetRole,
        conversationHistory: interview.conversationHistory,
        evaluations: interview.evaluations,
      });

      interview.decision = {
        ...decision,
        decidedAt: new Date(),
      };
    } else {
      const nextQuestion = await generateRecruiterQuestion({
        candidateName: interview.candidateName,
        skills: interview.skills,
        targetRole: interview.targetRole,
        currentQuestionIndex: nextQIndex,
        previousConversations: interview.conversationHistory,
      });

      interview.currentQuestionIndex = nextQIndex;
      interview.currentStage = nextQuestion.stage;
      interview.currentQuestionText = nextQuestion.questionText;

      interview.questions.push({
        questionIndex: nextQIndex,
        stage: nextQuestion.stage,
        targetSkill: nextQuestion.targetSkill,
        questionText: nextQuestion.questionText,
        isFollowUp: nextQuestion.isFollowUp || false,
        duration: 12,
      });

      const nextAiMsg = {
        speaker: "AI_RECRUITER",
        text: nextQuestion.questionText,
        audioUrl: "",
        timestamp: new Date(),
        duration: 12,
        questionIndex: nextQIndex,
        stage: nextQuestion.stage,
      };

      interview.conversationHistory.push(nextAiMsg);

      await Conversation.create({
        interviewId,
        targetRole: interview.targetRole,
        user: req.user.id,
        speaker: "AI_RECRUITER",
        text: nextQuestion.questionText,
        audioUrl: "",
        timestamp: new Date(),
        duration: 12,
        stage: nextQuestion.stage,
      });
    }

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Question skipped",
      interview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. Mark Question for Review
 */
exports.markForReview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findOne({
      interviewId,
      candidate: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    if (interview.questions[interview.currentQuestionIndex]) {
      interview.questions[interview.currentQuestionIndex].isReviewed = true;
    }

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Question marked for review",
      interview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 9. End / Finalize Interview (Generates AI Recruiter Decision)
 */
exports.endInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findOne({
      interviewId,
      candidate: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    interview.status = "COMPLETED";
    interview.endTime = new Date();
    interview.durationSeconds = Math.round(
      (interview.endTime - interview.startTime) / 1000
    );

    const decision = await generateRecruiterDecision({
      candidateName: interview.candidateName,
      skills: interview.skills,
      targetRole: interview.targetRole,
      conversationHistory: interview.conversationHistory,
      evaluations: interview.evaluations,
    });

    interview.decision = {
      ...decision,
      decidedAt: new Date(),
    };

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview ended successfully",
      interview,
      decision: interview.decision,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 10. Get Candidate's All Past Role Interviews
 */
exports.getInterviewHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ candidate: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 11. Delete an Interview Session (Cascades Conversation cleanup)
 */
exports.deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { interviewId: id }],
      candidate: req.user.id,
    });

    if (interview) {
      await Conversation.deleteMany({ interviewId: interview.interviewId });
      await Interview.findByIdAndDelete(interview._id);
    }

    const remaining = await Interview.find({ candidate: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Interview deleted successfully",
      interviews: remaining,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 12. Clear Conversation History for an Interview Session / Role
 */
exports.clearInterviewConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { interviewId: id },
        { targetRole: id, candidate: req.user.id },
      ],
      candidate: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // Clean standalone conversations
    await Conversation.deleteMany({ interviewId: interview.interviewId });

    // Reset conversation history and evaluations in interview session
    interview.conversationHistory = [];
    interview.evaluations = [];
    interview.currentQuestionIndex = 0;
    if (interview.status === "COMPLETED") {
      interview.status = "NOT_STARTED";
      interview.decision = {};
    }
    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Conversation history cleared successfully",
      interview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 13. Delete a Single Conversation Message from an Interview Session
 */
exports.deleteConversationMessage = async (req, res) => {
  try {
    const { id, messageIndex } = req.params;
    const idx = parseInt(messageIndex, 10);

    const interview = await Interview.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { interviewId: id },
      ],
      candidate: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (isNaN(idx) || idx < 0 || idx >= interview.conversationHistory.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid message index",
      });
    }

    const removedMsg = interview.conversationHistory[idx];

    // Remove from embedded array
    interview.conversationHistory.splice(idx, 1);

    // Also remove from standalone Conversation collection if matching text and timestamp
    if (removedMsg) {
      await Conversation.deleteOne({
        interviewId: interview.interviewId,
        speaker: removedMsg.speaker,
        text: removedMsg.text,
      });
    }

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Conversation message deleted successfully",
      interview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 12. Get Candidate's Dashboard Stats (Accurate role-based counts)
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumesCount = await Resume.countDocuments({ user: userId });
    const completedInterviews = await Interview.find({
      candidate: userId,
      status: "COMPLETED",
    });

    const totalCompleted = completedInterviews.length;
    let avgScore = "--";
    let hiringStatus = "Not Started";

    if (totalCompleted > 0) {
      const validScores = completedInterviews
        .map((i) => i.decision?.overallScore)
        .filter((s) => typeof s === "number" && s > 0);

      if (validScores.length > 0) {
        const sum = validScores.reduce((acc, cur) => acc + cur, 0);
        const avg = (sum / validScores.length).toFixed(1);
        avgScore = `${avg}/10`;
        hiringStatus = avg >= 8.0 ? "Strong Fit" : avg >= 6.5 ? "Moderate Fit" : "Needs Review";
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        resumes: resumesCount,
        interviews: totalCompleted,
        aiScore: avgScore,
        hiring: hiringStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
