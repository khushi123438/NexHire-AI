import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.config.db import connect_db, close_db
from app.rag.ingestion.ingestion_service import seed_knowledge_base
from app.middleware.upload import BACKEND_DIR, RESUME_UPLOAD_DIR, AUDIO_UPLOAD_DIR
from app.routes.auth_routes import router as auth_router
from app.routes.resume_routes import router as resume_router
from app.routes.interview_routes import router as interview_router
from app.routes.rag_routes import router as rag_router
from app.routes.agent_routes import router as agent_router
from app.routes.learning_routes import router as learning_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect DB and seed RAG knowledge base
    await connect_db()
    try:
        await seed_knowledge_base()
    except Exception as e:
        print(f"RAG seed initialization warning: {e}")
    yield
    # Shutdown
    await close_db()

app = FastAPI(
    title="NexHire AI Platform API",
    description="Agentic RAG-Based Adaptive Interview Coach Backend (Python/FastAPI)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration matching Express
client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
allowed_origins = [
    client_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory
uploads_path = BACKEND_DIR / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Mount API Routers
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(interview_router, prefix="/api/interview")
app.include_router(interview_router, prefix="/api/interviews") # Support alias
app.include_router(rag_router)
app.include_router(agent_router)
app.include_router(learning_router)

@app.get("/")
def root():
    return {
        "success": True,
        "platform": "NexHire AI — Agentic RAG-Based Adaptive Interview Coach",
        "status": "Operational 🚀",
        "agents": [
            "ResumeIntelligenceAgent",
            "InterviewPlannerAgent",
            "InterviewerAgent",
            "QuestionGenerationAgent",
            "EvaluationAgent",
            "CareerCoachAgent",
            "SupervisorAgent",
        ],
    }
