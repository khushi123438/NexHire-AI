const multer = require("multer");
const path = require("path");
const fs = require("fs");

const audioDir = path.join(__dirname, "../uploads/audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "candidate-answer-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("audio/") ||
    file.mimetype.includes("webm") ||
    file.mimetype.includes("octet-stream") ||
    file.mimetype.includes("wav") ||
    file.mimetype.includes("mp3") ||
    file.mimetype.includes("ogg")
  ) {
    cb(null, true);
  } else {
    cb(null, true); // be lenient for various browser audio recording mime types
  }
};

const audioUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter,
});

module.exports = audioUpload;
