import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/NexHire-AI")

client: AsyncIOMotorClient = None
db = None

def get_database_name(uri: str) -> str:
    # Extract DB name from URI if present, default to NexHire-AI
    try:
        parts = uri.split("/")
        if len(parts) > 3 and "?" in parts[-1]:
            return parts[-1].split("?")[0]
        elif len(parts) > 3 and parts[-1]:
            return parts[-1]
    except Exception:
        pass
    return "NexHire-AI"

DB_NAME = get_database_name(MONGO_URI)

async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DB_NAME]
        # Ping server to verify connection
        await client.admin.command('ping')
        print(f"MongoDB Connected: {DB_NAME} 🚀")
        await create_indexes()
    except Exception as error:
        print(f"[MongoDB Connection Error]: {error}")

async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

def get_db():
    global db
    if db is None:
        # Fallback initialization
        client_instance = AsyncIOMotorClient(MONGO_URI)
        return client_instance[DB_NAME]
    return db

async def create_indexes():
    """Create essential indexes matching the Mongoose schemas"""
    try:
        database = get_db()
        # User indexes
        await database.users.create_index("email", unique=True)
        
        # CandidateMemory indexes
        await database.candidatememories.create_index([("candidateId", 1), ("topic", 1), ("type", 1)])
        await database.candidatememories.create_index("candidateId")
        
        # KnowledgeChunk indexes
        await database.knowledgechunks.create_index([("domain", 1), ("topic", 1), ("difficulty", 1)])
        await database.knowledgechunks.create_index("tags")
        
        # Interview indexes
        await database.interviews.create_index("interviewId", unique=True)
        await database.interviews.create_index("candidate")
        
        # Conversation indexes
        await database.conversations.create_index("interviewId")
        await database.conversations.create_index("user")
        
        # CandidateProfile index
        await database.candidateprofiles.create_index("userId", unique=True)
        
        # LearningPlan index
        await database.learningplans.create_index("candidateId")
        
        # AgentRun indexes
        await database.agentruns.create_index("agent")
        await database.agentruns.create_index("interviewId")
        await database.agentruns.create_index("candidateId")
    except Exception as e:
        print(f"[MongoDB Index Notice]: {e}")
