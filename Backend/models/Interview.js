const mongoose = require("mongoose");

const conversationMessageSchema = new mongoose.Schema({
  speaker: {
    type: String,
    enum: ["AI_RECRUITER", "CANDIDATE"],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  audioUrl: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number, // duration in seconds
    default: 0,
  },
  questionIndex: {
    type: Number,
    default: 0,
  },
  round: {
    type: String,
    default: "ROUND_1_TECHNICAL",
  },
  stage: {
    type: String,
    default: "TECHNICAL",
  },
});

const evaluationSchema = new mongoose.Schema({
  questionIndex: Number,
  round: {
    type: String,
    default: "ROUND_1_TECHNICAL",
  },
  questionText: String,
  candidateAnswer: String,
  technicalAccuracy: {
    type: Number,
    default: 8.0,
  },
  communication: {
    type: Number,
    default: 8.0,
  },
  confidence: {
    type: Number,
    default: 8.0,
  },
  examplesUsed: {
    type: Number,
    default: 7.5,
  },
  strengths: {
    type: String,
    default: "",
  },
  areasToImprove: {
    type: String,
    default: "",
  },
  feedback: {
    type: String,
    default: "",
  },
  evaluatedAt: {
    type: Date,
    default: Date.now,
  },
});

const roundRecommendationSchema = new mongoose.Schema({
  round: {
    type: String,
    enum: ["ROUND_1_TECHNICAL", "ROUND_2_MANAGERIAL", "ROUND_3_HR"],
    required: true,
  },
  title: {
    type: String,
    default: "Round Assessment",
  },
  passed: {
    type: Boolean,
    default: true,
  },
  proceedToNext: {
    type: Boolean,
    default: true,
  },
  score: {
    type: Number,
    default: 8.0,
  },
  keyFeedback: {
    type: String,
    default: "",
  },
  strengths: {
    type: String,
    default: "",
  },
  areasToImprove: {
    type: String,
    default: "",
  },
  recommendedNextRound: {
    type: String,
    default: "ROUND_2_MANAGERIAL",
  },
  evaluatedAt: {
    type: Date,
    default: Date.now,
  },
});

const interviewSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      required: true,
      unique: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidateName: {
      type: String,
      default: "Candidate",
    },
    skills: {
      type: [String],
      default: [],
    },
    targetRole: {
      type: String,
      default: "Software Engineer / SDE",
    },
    currentRound: {
      type: String,
      enum: ["ROUND_1_TECHNICAL", "ROUND_2_MANAGERIAL", "ROUND_3_HR"],
      default: "ROUND_1_TECHNICAL",
    },
    roundStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "ROUND_COMPLETED", "ALL_COMPLETED"],
      default: "NOT_STARTED",
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED"],
      default: "NOT_STARTED",
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    currentStage: {
      type: String,
      default: "TECHNICAL",
    },
    currentQuestionText: {
      type: String,
      default: "",
    },
    questions: [
      {
        questionIndex: Number,
        round: {
          type: String,
          default: "ROUND_1_TECHNICAL",
        },
        stage: String,
        targetSkill: String,
        questionText: String,
        isFollowUp: {
          type: Boolean,
          default: false,
        },
        isSkipped: {
          type: Boolean,
          default: false,
        },
        isReviewed: {
          type: Boolean,
          default: false,
        },
        aiAudioUrl: String,
        duration: Number,
      },
    ],
    conversationHistory: [conversationMessageSchema],
    evaluations: [evaluationSchema],
    roundRecommendations: [roundRecommendationSchema],
    decision: {
      recommendation: {
        type: String,
        default: "",
      },
      fitBadge: {
        type: String,
        default: "Strong Fit",
      },
      technicalFit: {
        type: Number,
        default: 0,
      },
      communicationFit: {
        type: Number,
        default: 0,
      },
      culturalFit: {
        type: Number,
        default: 0,
      },
      overallHiringConfidence: {
        type: Number,
        default: 0,
      },
      overallScore: {
        type: Number,
        default: 0,
      },
      recruiterRemarks: {
        type: String,
        default: "",
      },
      decidedAt: Date,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interview", interviewSchema);
