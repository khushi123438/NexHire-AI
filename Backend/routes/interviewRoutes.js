const express = require("express");
const router = express.Router();
const audioUpload = require("../middleware/audioUpload");
const { protect } = require("../middleware/authMiddleware");
const {
  startInterview,
  getCurrentSession,
  getSessionById,
  submitAnswer,
  pauseInterview,
  resumeInterview,
  skipQuestion,
  markForReview,
  endInterview,
  getInterviewHistory,
  deleteInterview,
  clearInterviewConversation,
  deleteConversationMessage,
  switchRound,
  proceedToNextRound,
  getStats,
} = require("../controllers/interviewController");

// All interview routes require auth
router.use(protect);

router.post("/start", startInterview);
router.get("/current", getCurrentSession);
router.get("/session/:id", getSessionById);
router.post("/switch-round", switchRound);
router.post("/proceed-round", proceedToNextRound);
router.post("/answer", audioUpload.single("audio"), submitAnswer);
router.post("/pause", pauseInterview);
router.post("/resume", resumeInterview);
router.post("/skip", skipQuestion);
router.post("/mark-review", markForReview);
router.post("/end", endInterview);
router.get("/history", getInterviewHistory);
router.delete("/:id/conversation/:messageIndex", deleteConversationMessage);
router.delete("/:id/conversation", clearInterviewConversation);
router.delete("/:id", deleteInterview);
router.get("/stats", getStats);

module.exports = router;
