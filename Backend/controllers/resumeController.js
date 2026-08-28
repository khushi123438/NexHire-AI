const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const Resume = require("../models/Resume");
const User = require("../models/User");
const { extractResumeData } = require("../services/geminiService");

/**
 * 1. Upload Resume & Extract Skills (Supports multiple roles per user)
 */
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume not uploaded",
      });
    }

    const userId = req.user.id;
    const targetRole = req.body.targetRole?.trim() || "Software Development Engineer (SDE)";

    // Read PDF
    const buffer = fs.readFileSync(req.file.path);

    // Extract text
    const data = await pdf(buffer);

    // Gemini / AI Skill Extraction
    const result = await extractResumeData(data.text);

    // Clean up any existing resume for the exact same targetRole to prevent clutter
    const existingSameRole = await Resume.find({ user: userId, targetRole });
    for (const oldRes of existingSameRole) {
      if (oldRes.resumeUrl && oldRes.resumeUrl !== `/uploads/resumes/${req.file.filename}`) {
        const oldPath = path.join(__dirname, "..", oldRes.resumeUrl);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {}
        }
      }
    }
    await Resume.deleteMany({ user: userId, targetRole });

    // Save New Resume with targetRole in MongoDB
    const resume = await Resume.create({
      user: userId,
      fileName: req.file.originalname || req.file.filename,
      targetRole,
      resumeUrl: `/uploads/resumes/${req.file.filename}`,
      extractedText: data.text,
      skills: result.skills || [],
      education: result.education || "",
      experience: result.experience || "",
    });

    // Update User model latest skills
    await User.findByIdAndUpdate(userId, {
      skills: result.skills || [],
      resume: resume.resumeUrl,
    });

    // Fetch all resumes of this user
    const allResumes = await Resume.find({ user: userId }).sort({ uploadedAt: -1 });

    return res.status(201).json({
      success: true,
      message: `Resume for "${targetRole}" uploaded and skills extracted successfully`,
      resume,
      allResumes,
      skills: result.skills || [],
      targetRole,
    });
  } catch (error) {
    console.error("uploadResume error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to parse resume",
    });
  }
};

/**
 * 2. Get Current Candidate Resume & Skills (Filterable by role)
 */
exports.getCurrentResume = async (req, res) => {
  try {
    const { role } = req.query;
    const allResumes = await Resume.find({ user: req.user.id }).sort({
      uploadedAt: -1,
    });

    let activeResume = null;
    if (role) {
      activeResume = allResumes.find((r) => r.targetRole?.toLowerCase() === role.toLowerCase()) || null;
    }
    if (!activeResume && allResumes.length > 0) {
      activeResume = allResumes[0];
    }

    return res.status(200).json({
      success: true,
      hasResume: !!activeResume,
      resume: activeResume,
      resumes: allResumes,
      skills: activeResume ? activeResume.skills : [],
      targetRole: activeResume ? activeResume.targetRole : (role || "Software Development Engineer (SDE)"),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 3. Get All Resumes Uploaded by User
 */
exports.getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({
      uploadedAt: -1,
    });

    return res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 4. Delete / Remove Specific Resume by ID or Role
 */
exports.deleteResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (id && id !== "all") {
      let resumeToDelete = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        resumeToDelete = await Resume.findOne({ _id: id, user: userId });
      }
      if (!resumeToDelete) {
        resumeToDelete = await Resume.findOne({ targetRole: id, user: userId });
      }

      if (resumeToDelete) {
        if (resumeToDelete.resumeUrl) {
          const fullPath = path.join(__dirname, "..", resumeToDelete.resumeUrl);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
            } catch (e) {}
          }
        }
        await Resume.findByIdAndDelete(resumeToDelete._id);
      }
    } else {
      // Delete all
      const existingResumes = await Resume.find({ user: userId });
      for (const oldRes of existingResumes) {
        if (oldRes.resumeUrl) {
          const fullPath = path.join(__dirname, "..", oldRes.resumeUrl);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
            } catch (e) {}
          }
        }
      }
      await Resume.deleteMany({ user: userId });
      await User.findByIdAndUpdate(userId, { skills: [], resume: "" });
    }

    const remaining = await Resume.find({ user: userId }).sort({ uploadedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
      resumes: remaining,
      hasResume: remaining.length > 0,
      resume: remaining.length > 0 ? remaining[0] : null,
      skills: remaining.length > 0 ? remaining[0].skills : [],
    });
  } catch (error) {
    console.error("deleteResume error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete resume",
    });
  }
};

/**
 * 5. Confirm / Update Extracted Skills for a specific Resume or user
 */
exports.confirmSkills = async (req, res) => {
  try {
    const { skills, targetRole, resumeId } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: "Skills must be an array of strings",
      });
    }

    await User.findByIdAndUpdate(req.user.id, { skills });

    if (resumeId) {
      await Resume.findByIdAndUpdate(resumeId, {
        skills,
        ...(targetRole ? { targetRole } : {}),
      });
    } else {
      const latestResume = await Resume.findOne({ user: req.user.id }).sort({
        uploadedAt: -1,
      });
      if (latestResume) {
        latestResume.skills = skills;
        if (targetRole) latestResume.targetRole = targetRole;
        await latestResume.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Skills confirmed successfully",
      skills,
      targetRole: targetRole || "Software Development Engineer (SDE)",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};