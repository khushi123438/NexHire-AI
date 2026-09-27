import re
import json
import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config.db import get_db
from app.utils.helpers import to_object_id, serialize_doc
from app.config.role_domains import ROLE_DOMAINS
from app.llm.client import generate_completion, parse_llm_json
from app.llm.prompts import (
    build_interview_planning_prompt,
    build_question_generation_prompt,
    build_career_roadmap_prompt,
)

# Role-specific curated technical question fallbacks
ROLE_TECHNICAL_FALLBACKS: Dict[str, List[Dict[str, Any]]] = {
    "Frontend Developer": [
        {
            "questionText": "When architecting a large-scale React application, how do you manage state between server cache, client state, and local component state to prevent unnecessary re-renders?",
            "topic": "React & Component Architecture",
            "expectedConcepts": ["React Server Components", "React Query/SWR", "Context API vs Redux/Zustand", "Virtual DOM Memoization"],
            "aiReasoning": "Assessing architectural state management and rendering optimization in frontend systems.",
        },
        {
            "questionText": "Can you explain how the browser rendering engine calculates critical rendering path, reflows, and repaints, and how you optimize Core Web Vitals like LCP and INP?",
            "topic": "Web Performance Optimization & Core Web Vitals",
            "expectedConcepts": ["Critical Rendering Path", "Reflow vs Repaint", "LCP / FID / INP / CLS", "Resource Hinting (preload/prefetch)"],
            "aiReasoning": "Probing deep understanding of browser rendering mechanics and page load performance.",
        },
        {
            "questionText": "How do you ensure web accessibility (WCAG compliance) in dynamic web applications, especially when building complex custom UI widgets like modals or comboboxes?",
            "topic": "Web Accessibility (a11y) & Cross-Browser Compatibility",
            "expectedConcepts": ["WAI-ARIA Attributes", "Keyboard Navigation & Focus Management", "Semantic HTML5", "Screen Reader Announcements"],
            "aiReasoning": "Evaluating accessibility standards and production UI resilience.",
        },
        {
            "questionText": "In one of your recent frontend projects, what was the most difficult cross-browser layout or performance bug you diagnosed, and what trade-offs did you make to resolve it?",
            "topic": "Modern JavaScript & Debugging",
            "expectedConcepts": ["Profiling DevTools", "CSS Subgrid/Flexbox quirks", "Async Hydration", "Memory Leaks in Closures"],
            "aiReasoning": "Probing real-world troubleshooting and practical frontend project experience.",
        },
    ],
    "Backend Developer": [
        {
            "questionText": "When designing a high-throughput REST or GraphQL API, how do you handle distributed rate limiting, idempotent retries, and database connection pooling under traffic spikes?",
            "topic": "RESTful API Design & Best Practices",
            "expectedConcepts": ["Token Bucket / Leaky Bucket", "Idempotency Keys", "Connection Pooling (HikariCP/pgbouncer)", "Backpressure"],
            "aiReasoning": "Evaluating API resilience, rate limiting algorithms, and backend scalability.",
        },
        {
            "questionText": "How do you decide between optimistic locking versus pessimistic locking when managing concurrent transactions in a transactional database system?",
            "topic": "Database Systems & Concurrency",
            "expectedConcepts": ["ACID Isolation Levels", "Optimistic Concurrency Control (Version fields)", "Pessimistic Row Locking (SELECT FOR UPDATE)", "Deadlock Detection"],
            "aiReasoning": "Assessing transaction isolation, concurrency management, and data consistency.",
        },
        {
            "questionText": "How would you architect a distributed caching layer with Redis to protect your primary database from cache stampedes and cache penetration?",
            "topic": "Distributed Caching & Message Queues",
            "expectedConcepts": ["Cache Stampede / Mutual Exclusion Locks", "Bloom Filters for Cache Penetration", "Write-Through vs Write-Behind", "TTL Jitter"],
            "aiReasoning": "Probing distributed caching strategies and database protection.",
        },
        {
            "questionText": "Walk me through an asynchronous event processing pipeline you built or would design using message brokers like Kafka or RabbitMQ, focusing on message ordering and dead-letter handling.",
            "topic": "Concurrency, Threading & Asynchronous I/O",
            "expectedConcepts": ["Partition Keys for Ordering", "Consumer Groups & Rebalancing", "Dead Letter Queues (DLQ)", "At-least-once vs Exactly-once Delivery"],
            "aiReasoning": "Testing event-driven architecture and asynchronous distributed messaging.",
        },
    ],
    "Full Stack Developer": [
        {
            "questionText": "How do you design a secure, stateless authentication and session management architecture across a decoupled Single Page App and backend microservices?",
            "topic": "End-to-End Authentication & Security",
            "expectedConcepts": ["JWT Access & Refresh Tokens", "HttpOnly Secure Cookies", "CSRF Protection", "CORS Preflight Mechanics"],
            "aiReasoning": "Assessing full-stack security principles and end-to-end token flow.",
        },
        {
            "questionText": "When synchronizing real-time data between client and server, how do you choose between WebSockets, Server-Sent Events (SSE), and Long Polling?",
            "topic": "Client-Server Data Flow & WebSockets",
            "expectedConcepts": ["Full-duplex vs Half-duplex", "Connection Overhead & Heartbeats", "Reconnection & Fallbacks", "Scaling via Redis Pub/Sub"],
            "aiReasoning": "Evaluating full-stack real-time communication protocols and scaling strategies.",
        },
        {
            "questionText": "In your full stack applications, how do you maintain data consistency and minimize latency when coordinating multiple database queries and third-party APIs?",
            "topic": "Database Design & ORM/ODM",
            "expectedConcepts": ["Query N+1 Problem & Dataloaders", "Database Indexing", "Aggregations vs Normalization", "Circuit Breakers"],
            "aiReasoning": "Probing full-stack data modeling, query optimization, and latency mitigation.",
        },
        {
            "questionText": "Can you describe the architectural decisions you made in a full stack project you developed from scratch, particularly around deployment and state synchronization?",
            "topic": "Full Stack System Architecture & Deployment",
            "expectedConcepts": ["Monorepo vs Decoupled Repos", "CI/CD & Dockerization", "Environment Config Management", "Client State Hydration"],
            "aiReasoning": "Evaluating holistic full-stack engineering maturity and project ownership.",
        },
    ],
    "Data Scientist / AI Engineer": [
        {
            "questionText": "When evaluating a classification model on an imbalanced dataset, why can accuracy be misleading, and how do you choose between Precision, Recall, F1-Score, and PR-AUC?",
            "topic": "Machine Learning Algorithms & Model Evaluation",
            "expectedConcepts": ["Class Imbalance Techniques (SMOTE/Focal Loss)", "Precision-Recall Trade-off", "PR-AUC vs ROC-AUC", "Confusion Matrix Cost Asymmetry"],
            "aiReasoning": "Assessing model evaluation rigor and metric selection under real-world data skew.",
        },
        {
            "questionText": "How does the Self-Attention mechanism in Transformer architectures compute token relationships, and why did it replace recurrence in state-of-the-art NLP models?",
            "topic": "Natural Language Processing & Generative AI / LLMs",
            "expectedConcepts": ["Query, Key, Value Matrices", "Scaled Dot-Product Attention", "Parallelization vs Sequential RNN Bottlenecks", "Positional Embeddings"],
            "aiReasoning": "Probing deep understanding of modern Transformer architectures and attention math.",
        },
        {
            "questionText": "How do you detect and mitigate feature drift and concept drift in a production machine learning pipeline after deployment?",
            "topic": "MLOps, Model Deployment & Pipeline Monitoring",
            "expectedConcepts": ["Statistical Distance (KS Test, PSI)", "Ground Truth Delay", "Automated Retraining Pipelines", "Shadow Deployments"],
            "aiReasoning": "Evaluating operational machine learning, monitoring, and production reliability.",
        },
        {
            "questionText": "In a machine learning or LLM project you worked on, how did you approach feature engineering or prompt engineering/RAG to overcome data sparsity or hallucinations?",
            "topic": "Feature Engineering & Data Preprocessing",
            "expectedConcepts": ["Vector Embeddings & Semantic Search", "Handling Missingness & Outliers", "Grounding Context Windows", "Dimensionality Reduction"],
            "aiReasoning": "Probing practical project experience in data prep, RAG, or model tuning.",
        },
    ],
    "DevOps / Cloud Engineer": [
        {
            "questionText": "In Kubernetes, how do Deployments, ReplicaSets, and Pods interact during a zero-downtime rolling update, and how do Readiness and Liveness probes prevent broken releases?",
            "topic": "Container Orchestration with Kubernetes",
            "expectedConcepts": ["RollingUpdate Strategy (maxSurge/maxUnavailable)", "Liveness vs Readiness vs Startup Probes", "Kubelet Endpoint Controller", "Graceful Termination (preStop hooks)"],
            "aiReasoning": "Assessing Kubernetes container orchestration and zero-downtime deployment mechanics.",
        },
        {
            "questionText": "How do you structure an automated CI/CD pipeline with quality gates, secret management, and artifact versioning to ensure secure deployments across multi-region cloud environments?",
            "topic": "CI/CD Pipelines & Automated Deployments",
            "expectedConcepts": ["Ephemeral Runners & Caching", "KMS & Secret Injection (Vault/Secrets Manager)", "Immutable Container Tags", "Canary / Blue-Green Deployments"],
            "aiReasoning": "Evaluating CI/CD pipeline design, security controls, and release safety.",
        },
        {
            "questionText": "How do you manage Infrastructure as Code with Terraform at scale, specifically handling state locking, drift detection, and modular architecture across multiple environments?",
            "topic": "Infrastructure as Code (Terraform / Ansible)",
            "expectedConcepts": ["Remote State Backends (S3 + DynamoDB locking)", "Terraform Plan & Drift Resolution", "DRY Modules & Terragrunt", "IAM Principle of Least Privilege"],
            "aiReasoning": "Probing Terraform state management, IaC patterns, and cloud infrastructure reliability.",
        },
        {
            "questionText": "When troubleshooting a high CPU utilization or network latency spike in a production cluster, what observability tools and diagnostic steps do you execute?",
            "topic": "Monitoring, Logging & Observability (Prometheus/Grafana)",
            "expectedConcepts": ["Prometheus Metrics (RED/USE Methods)", "Distributed Tracing (OpenTelemetry/Jaeger)", "Log Aggregation & Grep/Kibana", "Linux perf/top/tcpdump analysis"],
            "aiReasoning": "Evaluating incident response, production triage, and systems observability.",
        },
    ],
    "Software Development Engineer (SDE)": [
        {
            "questionText": "How do internal hash tables handle hash collisions, and under what circumstances does HashMap performance degrade from constant O(1) to logarithmic O(log N) or linear O(N) time?",
            "topic": "DSA & Algorithm Complexity",
            "expectedConcepts": ["Separate Chaining vs Open Addressing", "Load Factor & Rehashing", "Treeification (Red-Black Trees)", "Hash Code Distribution"],
            "aiReasoning": "Assessing foundational data structure internals, collisions, and algorithmic bounds.",
        },
        {
            "questionText": "When designing a scalable relational database schema, how do B-Tree and B+ Tree indexes work internally to speed up range queries, and what are the trade-offs of over-indexing?",
            "topic": "Database Management Systems (DBMS)",
            "expectedConcepts": ["B+ Tree Leaf Node Linked Lists", "Clustered vs Non-Clustered Indexes", "Write Amplification on INSERT/UPDATE", "Index Cardinality & Composite Indexes"],
            "aiReasoning": "Evaluating database indexing internals and performance trade-offs.",
        },
        {
            "questionText": "How does the operating system handle context switching between threads versus processes, and how do thread pools prevent resource exhaustion under high concurrency?",
            "topic": "Operating Systems & Concurrency",
            "expectedConcepts": ["PCB vs TCB context switch cost", "Virtual Memory Page Table Invalidation", "Thread Pool Work Queues (CPU-bound vs I/O-bound sizing)", "Mutex vs Read-Write Locks"],
            "aiReasoning": "Probing operating systems fundamentals, concurrency primitives, and thread management.",
        },
        {
            "questionText": "In a distributed system, how do you ensure eventual consistency across decoupled microservices without introducing distributed lock bottlenecks?",
            "topic": "System Design & Scalability",
            "expectedConcepts": ["Saga Pattern (Choreography vs Orchestration)", "Transactional Outbox Pattern", "Idempotent Consumer Logic", "CAP Theorem Trade-offs"],
            "aiReasoning": "Assessing distributed system design, consistency patterns, and architectural trade-offs.",
        },
    ],
}

def is_semantic_duplicate(new_q: str, previous_questions: List[str], threshold: float = 0.65) -> bool:
    """Check lexical & jaccard semantic token similarity against previous questions"""
    if not new_q or not previous_questions:
        return False

    def tokenize(text: str) -> set:
        clean = re.sub(r'[^\w\s]', '', text.lower())
        stopwords = {"what", "how", "why", "can", "you", "explain", "describe", "the", "a", "an", "in", "of", "to", "for", "with", "on", "is", "are", "tell", "me", "about"}
        return set(w for w in clean.split() if len(w) > 2 and w not in stopwords)

    new_tokens = tokenize(new_q)
    if not new_tokens:
        return False

    for prev in previous_questions:
        prev_tokens = tokenize(prev)
        if not prev_tokens:
            continue
        intersection = len(new_tokens & prev_tokens)
        union = len(new_tokens | prev_tokens)
        similarity = intersection / union if union > 0 else 0.0
        if similarity >= threshold or new_q.strip().lower() == prev.strip().lower():
            return True
    return False

async def plan_interview_topics(
    candidate_profile: Optional[Dict[str, Any]] = None,
    target_role: str = "Software Development Engineer (SDE)",
    round_name: str = "ROUND_1_TECHNICAL",
    candidate_weaknesses: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Generates structured interview plan and topic distribution"""
    if candidate_weaknesses is None:
        candidate_weaknesses = []

    skills_list = []
    projects_list = []
    if candidate_profile:
        if isinstance(candidate_profile.get("skills"), list):
            for s in candidate_profile["skills"]:
                if isinstance(s, dict) and "name" in s:
                    skills_list.append(s["name"])
                elif isinstance(s, str):
                    skills_list.append(s)
        if isinstance(candidate_profile.get("projects"), list):
            projects_list = [p.get("name", str(p)) if isinstance(p, dict) else str(p) for p in candidate_profile["projects"] if p]

    default_role_topics = ROLE_DOMAINS.get(
        target_role,
        ROLE_DOMAINS.get("Software Development Engineer (SDE)", [
            "Core Programming & Architecture",
            "Database Systems & Optimization",
            "Concurrency & Scalability",
            "System Design & Reliability"
        ])
    )

    if not skills_list:
        skills_list = default_role_topics[:4]

    weakness_list = [f"{w.get('topic', '')} ({w.get('concept', '')})" for w in candidate_weaknesses if w.get("topic")]

    prompt = build_interview_planning_prompt(
        target_role=target_role,
        round_name=round_name,
        skills_list=skills_list,
        projects_list=projects_list,
        weakness_list=weakness_list,
        role_topics=default_role_topics
    )

    llm_result = await generate_completion(prompt=prompt, temperature=0.3)
    if llm_result.get("text"):
        parsed = parse_llm_json(llm_result["text"], None)
        if parsed and isinstance(parsed.get("topics"), list) and len(parsed["topics"]) > 0:
            return {
                "topics": parsed["topics"],
                "distribution": parsed.get("distribution", {}),
                "initialDifficulty": parsed.get("initialDifficulty", "medium"),
                "strategy": parsed.get("strategy", f"Personalized adaptive assessment for {target_role}."),
                "priorityFocus": parsed.get("priorityFocus", [])
            }

    # Fallback planning
    if round_name == "ROUND_2_MANAGERIAL":
        return {
            "topics": [
                "Teamwork & Cross-functional Collaboration",
                "Handling Production Incidents & Deadlines",
                "Technical Ownership & Architecture Trade-offs",
            ],
            "distribution": {"Behavioral": 1, "Leadership": 1, "IncidentManagement": 1},
            "initialDifficulty": "medium",
            "strategy": f"STAR method behavioral probing on ownership, leadership, and crisis management in {target_role}.",
            "priorityFocus": ["Conflict Resolution", "Production Incident Response"],
        }
    if round_name == "ROUND_3_HR":
        return {
            "topics": [
                "Career Goals & Role Motivation",
                "Salary Expectations & Workplace Logistics",
                "Culture Fit, Ethics & Candidate Questions",
            ],
            "distribution": {"CultureFit": 1, "Logistics": 1, "Values": 1},
            "initialDifficulty": "beginner",
            "strategy": f"Evaluation of long-term retention, compensation alignment, and workplace culture fit for {target_role}.",
            "priorityFocus": ["Culture Fit", "Career Aspirations"],
        }

    primary_topic = weakness_list[0] if weakness_list else default_role_topics[0]
    secondary_topic = default_role_topics[1] if len(default_role_topics) > 1 else (skills_list[0] if skills_list else "Core Fundamentals")
    tertiary_topic = default_role_topics[2] if len(default_role_topics) > 2 else (skills_list[1] if len(skills_list) > 1 else "Architecture & Scalability")
    quaternary_topic = default_role_topics[3] if len(default_role_topics) > 3 else "System Architecture & Performance Trade-offs"

    return {
        "topics": [primary_topic, secondary_topic, tertiary_topic, quaternary_topic],
        "distribution": {"Fundamentals": 1, "DeepDive": 2, "ArchitectureAndTradeoffs": 1},
        "initialDifficulty": "medium",
        "strategy": f"Structured progression from core {target_role} fundamentals to practical project architecture and optimization.",
        "priorityFocus": [primary_topic, secondary_topic],
    }

async def generate_interview_question(
    candidate_name: str = "Candidate",
    target_role: str = "Software Development Engineer (SDE)",
    round_name: str = "ROUND_1_TECHNICAL",
    current_domain: str = "Core Engineering",
    current_topic: str = "Core Fundamentals",
    difficulty: str = "medium",
    candidate_skills: Optional[List[str]] = None,
    candidate_projects: Optional[List[Any]] = None,
    candidate_experience: str = "",
    previous_answer: str = "",
    last_evaluation: Optional[Dict[str, Any]] = None,
    weak_areas: Optional[List[str]] = None,
    candidate_memory_summary: str = "",
    rag_context: str = "",
    question_index: int = 0,
    is_follow_up: bool = False,
    previous_questions: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generates dynamic, non-coding, grounded interview questions tailored to the candidate's resume,
    skills, past responses, weak areas, and RAG knowledge context.
    """
    if previous_questions is None:
        previous_questions = []
    if candidate_skills is None:
        candidate_skills = []
    if candidate_projects is None:
        candidate_projects = []
    if weak_areas is None:
        weak_areas = []

    eval_snippet = "No prior answer in this session."
    if last_evaluation:
        eval_snippet = json.dumps({
            "score": last_evaluation.get("overall", last_evaluation.get("correctness", 8)),
            "missingConcepts": last_evaluation.get("missingConcepts", []),
            "feedback": last_evaluation.get("feedback", "")
        })

    formatted_projects = []
    for p in candidate_projects:
        if isinstance(p, dict):
            techs = f" (Tech: {', '.join(p.get('technologies', []))})" if p.get("technologies") else ""
            formatted_projects.append(f"- {p.get('name', 'Project')}{techs}: {p.get('description', '')} {p.get('impact', '')}")
        elif isinstance(p, str):
            formatted_projects.append(f"- {p}")
    projects_str = "\n".join(formatted_projects) if formatted_projects else "General software engineering project experience"

    previous_questions_str = "\n".join([f"- {q}" for q in previous_questions]) if previous_questions else "None (Opening question of session)"
    skills_str = ", ".join(candidate_skills) if candidate_skills else "General technical skills"
    weak_areas_str = ", ".join(weak_areas) if weak_areas else "None identified"

    question_types = [
        "Conceptual", "Practical", "Scenario-based", "Project-based",
        "Resume-specific", "Why/How", "Debugging", "Architecture",
        "Trade-off", "Real-world", "Follow-up", "Problem diagnosis", "Decision-making"
    ]
    recommended_type = "Follow-up" if is_follow_up else question_types[question_index % len(question_types)]

    prompt = build_question_generation_prompt(
        target_role=target_role,
        skills_str=skills_str,
        projects_str=projects_str,
        candidate_experience=candidate_experience,
        current_domain=current_domain,
        current_topic=current_topic,
        difficulty=difficulty,
        recommended_type=recommended_type,
        previous_questions_str=previous_questions_str,
        eval_snippet=eval_snippet,
        weak_areas_str=weak_areas_str,
        candidate_memory_summary=candidate_memory_summary,
        rag_context=rag_context,
        is_follow_up=is_follow_up
    )

    llm_result = await generate_completion(prompt=prompt, temperature=0.35)
    if llm_result.get("text"):
        parsed = parse_llm_json(llm_result["text"], None)
        if parsed and parsed.get("questionText"):
            q_text = parsed["questionText"].strip()
            if not is_semantic_duplicate(q_text, previous_questions):
                return {
                    "questionText": q_text,
                    "questionType": parsed.get("questionType", recommended_type),
                    "topic": parsed.get("topic", current_topic),
                    "domain": parsed.get("domain", current_domain),
                    "difficulty": parsed.get("difficulty", difficulty),
                    "expectedConcepts": parsed.get("expectedConcepts", [current_topic]) if isinstance(parsed.get("expectedConcepts"), list) else [current_topic],
                    "aiReasoning": parsed.get("aiReasoning", f"Dynamic {recommended_type} question on {current_topic} for {target_role}."),
                    "isFollowUp": bool(parsed.get("isFollowUp", is_follow_up)),
                    "stage": parsed.get("stage", ("MANAGERIAL" if round_name == "ROUND_2_MANAGERIAL" else ("HR" if round_name == "ROUND_3_HR" else "TECHNICAL"))),
                    "ragSource": current_topic if rag_context else "Role Knowledge Base"
                }

    # Fallback paths for Managerial and HR rounds
    if round_name == "ROUND_2_MANAGERIAL":
        managerial_fallbacks = [
            {
                "questionText": f"Can you describe a situation in your work as a {target_role} where you had a critical disagreement with a teammate on architecture or tooling, and how you reached a consensus?",
                "topic": "Teamwork & Conflict Resolution",
                "questionType": "Scenario-based",
                "expectedConcepts": ["STAR Framework", "Data-driven decisions", "Disagree and Commit", "Constructive Communication"],
                "aiReasoning": f"Assessing team collaboration and constructive dispute resolution for {target_role}.",
            },
            {
                "questionText": "Tell me about a high-severity production outage or critical deadline crunch you managed. How did you triage, resolve it under pressure, and prevent regression?",
                "topic": "Production Outages & Incident Management",
                "questionType": "Real-world",
                "expectedConcepts": ["Root Cause Analysis", "Monitoring", "Post-mortem", "Zero Downtime"],
                "aiReasoning": "Probing resilience and production incident diagnosis under strict deadlines.",
            },
            {
                "questionText": "How do you balance the trade-offs between rapid feature delivery requested by business stakeholders versus refactoring technical debt and maintaining high code maintainability?",
                "topic": "Project Ownership & Trade-offs",
                "questionType": "Trade-off",
                "expectedConcepts": ["Technical Debt", "Prioritization", "Maintainability", "Agile Velocity"],
                "aiReasoning": "Evaluating engineering leadership and pragmatic prioritization.",
            },
        ]
        for candidate_fb in managerial_fallbacks:
            if not is_semantic_duplicate(candidate_fb["questionText"], previous_questions):
                return {
                    **candidate_fb,
                    "difficulty": difficulty,
                    "isFollowUp": is_follow_up,
                    "stage": "MANAGERIAL",
                    "ragSource": "Managerial Competencies",
                }
        picked = managerial_fallbacks[question_index % len(managerial_fallbacks)]
        return {
            **picked,
            "difficulty": difficulty,
            "isFollowUp": is_follow_up,
            "stage": "MANAGERIAL",
            "ragSource": "Managerial Competencies",
        }

    if round_name == "ROUND_3_HR":
        hr_fallbacks = [
            {
                "questionText": f"What key factors motivated you to apply for the {target_role} position with us, and where do you see your professional growth over the next two to three years?",
                "topic": "Career Aspirations & Culture Fit",
                "questionType": "Conceptual",
                "expectedConcepts": ["Career Alignment", "Culture Fit", "Continuous Learning", "Team Impact"],
                "aiReasoning": f"Evaluating motivation and long-term career alignment with {target_role} expectations.",
            },
            {
                "questionText": f"What are your salary expectations for this {target_role} role, and what are your preferences regarding work environment and joining availability?",
                "topic": "Compensation & Work Logistics",
                "questionType": "Practical",
                "expectedConcepts": ["Market Alignment", "Work Flexibility", "Notice Period"],
                "aiReasoning": "Clarifying expectations regarding compensation and onboarding timelines.",
            },
            {
                "questionText": "What type of team culture empowers you to do your highest quality work, and what questions do you have for our leadership team?",
                "topic": "Workplace Ethics & Values",
                "questionType": "Conceptual",
                "expectedConcepts": ["Team Culture", "Engineering Standards", "Curiosity"],
                "aiReasoning": "Checking organizational values alignment and candidate initiative.",
            },
        ]
        for candidate_fb in hr_fallbacks:
            if not is_semantic_duplicate(candidate_fb["questionText"], previous_questions):
                return {
                    **candidate_fb,
                    "difficulty": difficulty,
                    "isFollowUp": is_follow_up,
                    "stage": "HR",
                    "ragSource": "HR & Culture",
                }
        picked = hr_fallbacks[question_index % len(hr_fallbacks)]
        return {
            **picked,
            "difficulty": difficulty,
            "isFollowUp": is_follow_up,
            "stage": "HR",
            "ragSource": "HR & Culture",
        }

    # Technical Round fallback
    role_catalog = ROLE_TECHNICAL_FALLBACKS.get(
        target_role,
        ROLE_TECHNICAL_FALLBACKS.get("Software Development Engineer (SDE)", [])
    )
    for candidate_fb in role_catalog:
        if not is_semantic_duplicate(candidate_fb["questionText"], previous_questions):
            return {
                **candidate_fb,
                "questionType": recommended_type,
                "difficulty": difficulty,
                "isFollowUp": is_follow_up,
                "stage": "TECHNICAL",
                "ragSource": candidate_fb.get("topic", current_topic),
            }

    picked = role_catalog[question_index % len(role_catalog)] if role_catalog else {
        "questionText": f"In your experience as a {target_role}, how do you evaluate architecture trade-offs for performance and maintainability?",
        "topic": current_topic,
        "expectedConcepts": [current_topic],
        "aiReasoning": f"Grounded technical question for {target_role}."
    }
    return {
        **picked,
        "questionType": recommended_type,
        "difficulty": difficulty,
        "isFollowUp": is_follow_up,
        "stage": "TECHNICAL",
        "ragSource": picked.get("topic", current_topic),
    }

async def generate_round_summary_recommendation(
    candidate_name: str = "Candidate",
    target_role: str = "Software Development Engineer (SDE)",
    round_name: str = "ROUND_1_TECHNICAL",
    evaluations: Optional[List[Dict[str, Any]]] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Generates round summary and progression decision"""
    if evaluations is None:
        evaluations = []

    round_metadata = {
        "ROUND_1_TECHNICAL": {
            "name": "Round 1: Technical & Skill-Based Assessment",
            "next_round": "ROUND_2_MANAGERIAL",
            "next_title": "Round 2: Managerial & Behavioral Round",
        },
        "ROUND_2_MANAGERIAL": {
            "name": "Round 2: Managerial & Behavioral Assessment",
            "next_round": "ROUND_3_HR",
            "next_title": "Round 3: HR Discussion Round",
        },
        "ROUND_3_HR": {
            "name": "Round 3: HR Discussion & Culture Fit",
            "next_round": "COMPLETED",
            "next_title": "Final Hiring Offer Decision",
        },
    }

    current_info = round_metadata.get(round_name, round_metadata["ROUND_1_TECHNICAL"])

    summary_evals = "\n".join([
        f"Q{idx + 1}: [Accuracy: {e.get('correctness', e.get('technicalAccuracy', 8))}/10, Clarity: {e.get('clarity', e.get('communication', 8))}/10] Strengths: '{e.get('strengths', '')}', Areas to Polish: '{e.get('areasToImprove', '')}'"
        for idx, e in enumerate(evaluations)
    ])

    prompt = f"""
You are the Head Interview Panel at NexHire AI.
Analyze the candidate's performance in "{current_info['name']}" for "{target_role}".
Candidate: "{candidate_name}".

Evaluations in this round:
{summary_evals}

Evaluate whether the candidate cleared this round and is recommended to proceed to "{current_info['next_title']}".
- If average score >= 6.5: passed = true, proceedToNext = true.
- If average score < 6.5: passed = false, proceedToNext = false.

Return ONLY valid JSON:
{{
  "round": "{round_name}",
  "title": "{current_info['name']}",
  "passed": true,
  "proceedToNext": true,
  "score": 8.4,
  "keyFeedback": "Candidate demonstrated impressive technical clarity throughout this round.",
  "strengths": "Strong command of core programming concepts.",
  "areasToImprove": "Provide deeper edge-case coverage in answers.",
  "recommendedNextRound": "{current_info['next_round']}"
}}
"""

    llm_result = await generate_completion(prompt=prompt, temperature=0.25)
    if llm_result.get("text"):
        parsed = parse_llm_json(llm_result["text"], None)
        if parsed and isinstance(parsed.get("score"), (int, float)):
            return {
                "round": round_name,
                "title": current_info["name"],
                "passed": bool(parsed.get("passed", True)),
                "proceedToNext": bool(parsed.get("proceedToNext", True)),
                "score": round(float(parsed["score"]), 1),
                "keyFeedback": parsed.get("keyFeedback", "Candidate demonstrated commendable performance in this round."),
                "strengths": parsed.get("strengths", "Clear articulation and strong problem-solving mindset."),
                "areasToImprove": parsed.get("areasToImprove", "Deepen practical code examples and edge-case analysis."),
                "recommendedNextRound": current_info["next_round"],
                "evaluatedAt": datetime.utcnow().isoformat()
            }

    # Fallback calculation
    avg_score = 8.0
    if evaluations:
        total = sum(e.get("correctness", e.get("technicalAccuracy", 8.0)) + e.get("clarity", e.get("communication", 8.0)) for e in evaluations)
        avg_score = round(total / (len(evaluations) * 2), 1)

    passed = avg_score >= 6.5

    return {
        "round": round_name,
        "title": current_info["name"],
        "passed": passed,
        "proceedToNext": passed,
        "score": avg_score,
        "keyFeedback": f"Strong performance in {current_info['name']}. Candidate is well-prepared to proceed." if passed else f"Needs further polish before retrying {current_info['name']}.",
        "strengths": "Structured responses and good understanding of industry practices.",
        "areasToImprove": "Elaborate with deeper concrete examples and real-world system trade-offs.",
        "recommendedNextRound": current_info["next_round"],
        "evaluatedAt": datetime.utcnow().isoformat()
    }

async def generate_recruiter_hiring_decision(
    candidate_name: str = "Candidate",
    skills: Optional[List[str]] = None,
    target_role: str = "Software Development Engineer (SDE)",
    conversation_history: Optional[List[Dict[str, Any]]] = None,
    evaluations: Optional[List[Dict[str, Any]]] = None,
    round_recommendations: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Generates final hiring offer recommendation across all completed rounds"""
    if skills is None:
        skills = []
    if evaluations is None:
        evaluations = []
    if round_recommendations is None:
        round_recommendations = []

    summary_evals = "\n".join([
        f"Q{idx + 1}: [Acc: {e.get('correctness', e.get('technicalAccuracy', 8))}/10, Clarity: {e.get('clarity', e.get('communication', 8))}/10] Strengths: '{e.get('strengths', '')}'"
        for idx, e in enumerate(evaluations)
    ])

    prompt = f"""
You are NexHire AI Head of Recruitment & Talent Assessment.
Generate the final hiring decision and offer recommendation for candidate "{candidate_name}" for the role "{target_role}".
Skills: {', '.join(skills)}.

Performance summary across Technical, Managerial, and HR interview rounds:
{summary_evals}

Return ONLY valid JSON:
{{
  "recommendation": "Recommended for Hire / Offer Extended",
  "fitBadge": "Strong Fit",
  "technicalFit": 86,
  "communicationFit": 84,
  "culturalFit": 88,
  "overallHiringConfidence": 86,
  "overallScore": 8.6,
  "remarks": "The candidate has demonstrated strong technical problem-solving in Round 1, solid leadership in Round 2, and excellent culture fit in Round 3. Highly recommended for {target_role}."
}}
"""

    llm_result = await generate_completion(prompt=prompt, temperature=0.25)
    if llm_result.get("text"):
        parsed = parse_llm_json(llm_result["text"], None)
        if parsed and parsed.get("recommendation"):
            return {
                "recommendation": parsed["recommendation"],
                "fitBadge": parsed.get("fitBadge", "Strong Fit"),
                "technicalFit": round(float(parsed.get("technicalFit", 85))),
                "communicationFit": round(float(parsed.get("communicationFit", 82))),
                "culturalFit": round(float(parsed.get("culturalFit", 88))),
                "overallHiringConfidence": round(float(parsed.get("overallHiringConfidence", 85))),
                "overallScore": round(float(parsed.get("overallScore", 8.5)), 1),
                "remarks": parsed.get("remarks", f"Candidate demonstrated outstanding competency across all interview rounds. Recommended for {target_role}."),
                "recruiterRemarks": parsed.get("remarks", f"Candidate demonstrated outstanding competency across all interview rounds. Recommended for {target_role}."),
            }

    # Fallback calculation
    avg_acc, avg_comm, avg_conf, avg_ex = 8.4, 8.2, 8.5, 8.0
    if evaluations:
        avg_acc = sum(e.get("correctness", e.get("technicalAccuracy", 8.0)) for e in evaluations) / len(evaluations)
        avg_comm = sum(e.get("clarity", e.get("communication", 8.0)) for e in evaluations) / len(evaluations)
        avg_conf = sum(e.get("relevance", e.get("confidence", 8.0)) for e in evaluations) / len(evaluations)
        avg_ex = sum(e.get("technicalDepth", e.get("examplesUsed", 7.5)) for e in evaluations) / len(evaluations)

    tech_fit = round(avg_acc * 10)
    comm_fit = round(avg_comm * 10)
    cult_fit = round(avg_conf * 10.2)
    overall_confidence = round((tech_fit + comm_fit + cult_fit) / 3)
    overall_score = round((avg_acc + avg_comm + avg_conf + avg_ex) / 4, 1)

    rec = "Recommended for Hire / Offer Extended" if overall_confidence >= 75 else "Recommended for Further Evaluation"
    badge = "Strong Fit" if overall_confidence >= 80 else "Moderate Fit"
    remarks_text = f"The candidate demonstrated strong domain fundamentals, clear communication, and leadership maturity. Recommended for {target_role}."

    return {
        "recommendation": rec,
        "fitBadge": badge,
        "technicalFit": tech_fit,
        "communicationFit": comm_fit,
        "culturalFit": cult_fit,
        "overallHiringConfidence": overall_confidence,
        "overallScore": overall_score,
        "remarks": remarks_text,
        "recruiterRemarks": remarks_text,
    }

async def generate_candidate_learning_roadmap(
    candidate_id: Any,
    interview_id: str = "",
    target_role: str = "Software Development Engineer (SDE)",
    evaluations: Optional[List[Dict[str, Any]]] = None,
    candidate_memories: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Generates personalized 5-day study roadmap & weakness diagnostic"""
    if evaluations is None:
        evaluations = []
    if candidate_memories is None:
        candidate_memories = []

    eval_summary_lines = []
    for idx, e in enumerate(evaluations):
        round_name = e.get("round", "TECH")
        score = e.get("overall", e.get("correctness", 8.0))
        missing = ", ".join(e.get("missingConcepts", []))
        weakness = e.get("areasToImprove", "")
        eval_summary_lines.append(f"Q{idx + 1} ({round_name}): Score {score}/10. Missing Concepts: [{missing}]. Weaknesses: '{weakness}'")

    eval_summary = "\n".join(eval_summary_lines)
    mem_summary = "\n".join([f"- {m.get('topic', '')}: {m.get('concept', '')} (Score: {m.get('score', 5)}/10)" for m in candidate_memories])

    prompt = build_career_roadmap_prompt(
        target_role=target_role,
        eval_summary=eval_summary,
        mem_summary=mem_summary
    )

    learning_plan_data = None
    llm_result = await generate_completion(prompt=prompt, temperature=0.3)
    if llm_result.get("text"):
        parsed = parse_llm_json(llm_result["text"], None)
        if parsed and isinstance(parsed.get("dailyRoadmap"), list) and len(parsed["dailyRoadmap"]) > 0:
            learning_plan_data = parsed

    # Fallback roadmap
    if not learning_plan_data:
        learning_plan_data = {
            "overallSummary": "Candidate has strong foundational knowledge with opportunities for improvement in system design trade-offs and database internals.",
            "readinessScore": 75,
            "strongConcepts": ["Core Programming", "REST APIs", "Modern Frameworks"],
            "weaknessReport": [
                {
                    "domain": "Technical Fundamentals",
                    "topic": "Architecture & Optimization",
                    "concept": "Edge Case & Scalability Trade-offs",
                    "severity": "moderate",
                    "evidence": "Room to provide deeper quantifiable metrics in scenario questions.",
                    "score": 6.8,
                    "recommendation": "Review distributed system patterns and time/space complexity analysis.",
                }
            ],
            "dailyRoadmap": [
                {
                    "day": 1,
                    "title": "Core Data Structures & Complexity Analysis",
                    "focusArea": "DSA Fundamentals",
                    "concepts": ["Hash Tables", "Trees", "Graph Traversals"],
                    "practiceQuestions": ["Explain HashMap collision strategies.", "Implement BFS and DFS."],
                    "resources": ["Data Structures and Algorithms in Java/JS"],
                },
                {
                    "day": 2,
                    "title": "Database Internals & Index Optimization",
                    "focusArea": "DBMS",
                    "concepts": ["B+ Tree Indexing", "ACID Transactions", "Query Execution Plans"],
                    "practiceQuestions": ["How does indexing speed up search?", "Explain transaction isolation levels."],
                    "resources": ["Database System Concepts"],
                },
                {
                    "day": 3,
                    "title": "Concurrency & Async Execution",
                    "focusArea": "Runtime Internals",
                    "concepts": ["Event Loop", "Threads vs Processes", "Locks and Semaphores"],
                    "practiceQuestions": ["Explain microtasks vs macrotasks.", "How to avoid deadlocks in multithreading?"],
                    "resources": ["Node.js and JVM Concurrency Guides"],
                },
                {
                    "day": 4,
                    "title": "System Design & Distributed Scalability",
                    "focusArea": "System Architecture",
                    "concepts": ["Caching", "Load Balancing", "Rate Limiting"],
                    "practiceQuestions": ["Design a scalable URL shortener.", "Compare Cache-Aside vs Write-Through."],
                    "resources": ["System Design Primer"],
                },
                {
                    "day": 5,
                    "title": "Behavioral Communication & Full Mock Reassessment",
                    "focusArea": "Interview Readiness",
                    "concepts": ["STAR Framework", "Cross-team Collaboration", "Ownership"],
                    "practiceQuestions": ["Describe a time you handled a production bug.", "Explain a technical trade-off you made."],
                    "resources": ["NexHire AI Mock Simulator"],
                },
            ],
            "nextInterviewStrategy": "State your assumptions clearly, quantify past project metrics, and ask clarifying questions before answering complex architecture prompts.",
            "recommendedTopics": ["Database Indexing", "Concurrency", "System Design", "STAR Framework"]
        }

    # Persist into LearningPlan collection
    plan_doc = None
    if candidate_id:
        try:
            db = get_db()
            c_id = to_object_id(candidate_id)
            doc_to_save = {
                "candidateId": c_id,
                "interviewId": interview_id or "",
                "targetRole": target_role,
                "overallSummary": learning_plan_data.get("overallSummary", ""),
                "readinessScore": learning_plan_data.get("readinessScore", 75),
                "weaknessReport": learning_plan_data.get("weaknessReport", []),
                "strongConcepts": learning_plan_data.get("strongConcepts", []),
                "dailyRoadmap": learning_plan_data.get("dailyRoadmap", []),
                "nextInterviewStrategy": learning_plan_data.get("nextInterviewStrategy", ""),
                "recommendedTopics": learning_plan_data.get("recommendedTopics", []),
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            res = await db.learningplans.insert_one(doc_to_save)
            doc_to_save["_id"] = res.inserted_id
            plan_doc = serialize_doc(doc_to_save)
        except Exception as save_err:
            print(f"[LearningPlan] Save note: {save_err}")

    return {
        "learningPlan": plan_doc or learning_plan_data,
        **learning_plan_data
    }
