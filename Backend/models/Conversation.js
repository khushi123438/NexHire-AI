const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      default: "Software Development Engineer (SDE)",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
      type: Number, // in seconds
      default: 0,
    },
    stage: {
      type: String,
      enum: ["HR", "TECHNICAL", "FOLLOWUP"],
      default: "HR",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversation", conversationSchema);
