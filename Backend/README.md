# NexHire AI — Python FastAPI Backend

This backend powers NexHire AI using **FastAPI, NLP, RAG, LLMs, and Generative AI**.

## Architecture Components

- **NLP Layer (`app/nlp/`)**: PDF text extraction, keyword and entity extraction, canonical skill mapping, and multi-role percentage fit calculation.
- **RAG Layer (`app/rag/`)**: Knowledge corpus ingestion, semantic embeddings, and hybrid vector + lexical retrieval.
- **LLM & GenAI Layer (`app/llm/` & `app/services/genai_service.py`)**: Google Gemini multi-model fallback, input guardrails, dynamic question generation with anti-repetition token checks, round recommendations, recruiter offer decisions, and 5-day study roadmaps.
- **Evaluation Engine (`app/services/evaluation_service.py`)**: LLM-as-a-Judge answer evaluation using a strict 5-factor rubric.
- **Interview Service (`app/services/interview_service.py`)**: Complete interview state machine, turn processing, and deterministic difficulty routing.
- **Candidate Memory (`app/services/memory_service.py`)**: Persistent tracking of candidate strengths and weak areas.

## Running the Backend

```bash
pip install -r requirements.txt
python run.py
```

Server runs on `http://localhost:5000`.
Interactive API Documentation: `http://localhost:5000/docs`
