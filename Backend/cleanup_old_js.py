import os
import shutil
from pathlib import Path

backend_dir = Path(__file__).resolve().parent

# Old JS files to remove
old_js_files = [
    "server.js",
    "config/db.js",
    "config/passport.js",
    "controllers/agentController.js",
    "controllers/authController.js",
    "controllers/interviewController.js",
    "controllers/learningController.js",
    "controllers/ragController.js",
    "controllers/resumeController.js",
    "middleware/audioUpload.js",
    "middleware/authMiddleware.js",
    "middleware/upload.js",
    "models/AgentRun.js",
    "models/CandidateMemory.js",
    "models/CandidateProfile.js",
    "models/Conversation.js",
    "models/Interview.js",
    "models/KnowledgeChunk.js",
    "models/LearningPlan.js",
    "models/Resume.js",
    "models/User.js",
    "rag/ingestion/ingestionService.js",
    "rag/knowledgeBase/curatedData.js",
    "rag/retrieval/retrievalService.js",
    "routes/agentRoutes.js",
    "routes/authRoutes.js",
    "routes/interviewRoutes.js",
    "routes/learningRoutes.js",
    "routes/ragRoutes.js",
    "routes/resumeRoutes.js",
    "services/embeddingService.js",
    "services/geminiService.js",
    "services/llmService.js",
    "services/memoryService.js",
    "utils/emailService.js",
    "utils/generateToken.js",
    "agents/careerCoachAgent/careerCoachAgent.js",
    "agents/evaluationAgent/evaluationAgent.js",
    "agents/interviewerAgent/interviewerAgent.js",
    "agents/plannerAgent/plannerAgent.js",
    "agents/questionAgent/questionAgent.js",
    "agents/resumeAgent/resumeAgent.js",
    "agents/supervisor/supervisorAgent.js",
    "package.json",
    "package-lock.json"
]

for rel_path in old_js_files:
    p = backend_dir / rel_path
    if p.exists():
        try:
            os.remove(p)
            print(f"Removed: {rel_path}")
        except Exception as e:
            print(f"Failed to remove {rel_path}: {e}")

# Remove old empty directories or node_modules if present
old_dirs = [
    "agents/careerCoachAgent",
    "agents/evaluationAgent",
    "agents/interviewerAgent",
    "agents/plannerAgent",
    "agents/questionAgent",
    "agents/resumeAgent",
    "agents/supervisor",
    "agents",
    "config",
    "controllers",
    "middleware",
    "models",
    "rag/ingestion",
    "rag/knowledgeBase",
    "rag/retrieval",
    "rag",
    "routes",
    "services",
    "utils",
    "node_modules"
]

for d in old_dirs:
    dp = backend_dir / d
    if dp.exists() and dp.is_dir():
        try:
            shutil.rmtree(dp)
            print(f"Removed directory: {d}")
        except Exception as e:
            print(f"Failed to remove directory {d}: {e}")

print("Backend cleanup complete. Zero JS backend files remain.")
