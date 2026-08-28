const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  uploadResume,
  getCurrentResume,
  getAllResumes,
  deleteResume,
  confirmSkills,
} = require("../controllers/resumeController");
const { protect } = require("../middleware/authMiddleware");

router.post("/upload", protect, upload.single("resume"), uploadResume);
router.get("/current", protect, getCurrentResume);
router.get("/all", protect, getAllResumes);
router.delete("/:id", protect, deleteResume);
router.put("/skills", protect, confirmSkills);

module.exports = router;