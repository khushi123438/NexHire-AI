# NexHire AI

**NexHire AI** is an AI-powered interview preparation and career intelligence platform that analyzes a candidate's resume, recommends suitable roles, conducts adaptive interviews, evaluates answers, and generates personalized career guidance.

## 🚀 Core Flow

```text
Upload Resume
      ↓
Resume Analysis + NLP
      ↓
Candidate Profile
      ↓
AI Role Recommendations
      ↓
Candidate Selects Role
      ↓
Adaptive Interview
      ↓
AI Evaluation
      ↓
Career Roadmap
```

## 🎯 Interview Rounds

NexHire AI contains 3 interview rounds:

- Technical – DSA, CS fundamentals, role-specific concepts
- Managerial – Decision-making, problem-solving, teamwork
- HR / Behavioral – Communication, motivation, workplace scenarios

Follow-up questions are dynamically generated within each round.
Project Discussion is not a separate round.


## 🤖 AI Technologies

- NLP – Resume parsing, skill extraction & normalization
- LLM – Question generation, evaluation & feedback
- Generative AI – Personalized interview conversations
- RAG – Context-aware knowledge retrieval
- Embeddings – Semantic similarity and retrieval
- Agentic AI – Adaptive interview decision-making
- LLM-as-a-Judge – Multi-dimensional answer evaluation
- Candidate Memory – Stores strengths, weaknesses & learning gaps


## 🧠 Agentic Interview System

```
Candidate Answer
      ↓
Evaluation Agent
      ↓
Candidate Memory
      ↓
Supervisor Agent
      ↓
 ┌───────────────┐
 │  Next Action  │
 ├───────────────┤
 │ Ask Question  │
 │ Retrieve RAG  │
 │ Remediate     │
 │ Change Topic  │
 │ Adjust Level  │
 │ End Round     │
 └───────────────┘
```

## 🛠️ Tech Stack

# Backend :
- Python
- FastAPI
- Uvicorn
- Pydantic
  
# AI / ML :
- NLP
- Gemini LLM
- Gemini Embeddings
- RAG
- Generative AI
- Agentic AI

# Database :
- MongoDB

# Security :
- JWT
- bcrypt
- OAuth

# Resume Processing :
- PDF Text Extraction
- Skill Normalization


## 📁 Main Backend Modules
```
app/
├── agents/
├── nlp/
├── rag/
├── services/
├── models/
├── routes/
├── controllers/
└── main.py
```

## ⭐ Key Features

- Resume-first interview workflow
- AI-based role recommendations
- Adaptive difficulty
- Dynamic follow-up questions
- RAG-powered contextual questions
- AI answer evaluation
- Candidate memory
- Personalized feedback
- Career roadmap generation

## 🔥 Project Highlight

NexHire AI combines NLP, RAG, LLMs, Generative AI and Agentic AI to create an adaptive interview system that changes its questioning strategy according to the candidate's resume, answers, performance and learning gaps.

## 👩‍💻 Author

Khushi Pandey
B.Tech CSE (AI) — PSIT Kanpur
