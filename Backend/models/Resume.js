const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileName: {
    type: String,
    default: "Resume.pdf",
  },
  targetRole: {
    type: String,
    default: "Software Development Engineer (SDE)",
    trim: true,
  },
  resumeUrl: {
    type: String,
    default: "",
  },
  extractedText: {
    type: String,
    default: "",
  },
  skills: {
    type: [String],
    default: [],
  },
  experience: {
    type: String,
    default: "",
  },
  education: {
    type: String,
    default: "",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Resume", resumeSchema);