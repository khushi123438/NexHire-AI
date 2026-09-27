import json
from typing import Dict, Any, List, Optional
from app.services.llm_service import call_llm, parse_ai_json
from app.config.role_domains import ROLE_DOMAINS

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

async def generate_question(
    candidate_name: str = "Candidate",
    target_role: str = "Software Development Engineer (SDE)",
    round: str = "ROUND_1_TECHNICAL",
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
    previous_questions: Optional[List[str]] = None,
    candidate_id: Any = None,
    interview_id: str = ""
) -> Dict[str, Any]:
    """
    Agent 4: Question Generation Agent
    Generates dynamic, grounded, strictly NON-CODING interview questions matching the candidate's actual resume,
    skills, projects, experience, performance history, weak areas, candidate memory, and RAG context.
    Avoids repetitions and semantic duplicates.
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
            "score": last_evaluation.get("overall", last_evaluation.get("technicalAccuracy", 8)),
            "missingConcepts": last_evaluation.get("missingConcepts", []),
            "feedback": last_evaluation.get("feedback", "")
        })

    # Format projects context
    formatted_projects = []
    for p in candidate_projects:
        if isinstance(p, dict):
            techs = f" (Tech: {', '.join(p.get('technologies', []))})" if p.get("technologies") else ""
            formatted_projects.append(f"- {p.get('name', 'Project')}{techs}: {p.get('description', '')} {p.get('impact', '')}")
        elif isinstance(p, str):
            formatted_projects.append(f"- {p}")
    projects_str = "\n".join(formatted_projects) if formatted_projects else "General software & technical project experience"

    previous_questions_str = "\n".join([f"- {q}" for q in previous_questions]) if previous_questions else "None (Opening question of session)"
    skills_str = ", ".join(candidate_skills) if candidate_skills else "General technical skills"
    weak_areas_str = ", ".join(weak_areas) if weak_areas else "None identified"

    # Select dynamic question type to ensure variety
    question_types = [
        "Conceptual", "Practical", "Scenario-based", "Project-based",
        "Resume-specific", "Why/How", "Debugging", "Architecture",
        "Trade-off", "Real-world", "Follow-up", "Problem diagnosis", "Decision-making"
    ]
    recommended_type = "Follow-up" if is_follow_up else question_types[question_index % len(question_types)]

    prompt = f"""
You are an adaptive technical interviewer.

Generate the next interview question for this candidate.

Target Role:
{target_role}

Candidate Skills:
{skills_str}

Projects:
{projects_str}

Experience:
{candidate_experience or 'Demonstrated technical engineering experience.'}

Current Domain:
{current_domain or target_role}

Current Topic:
{current_topic}

Current Difficulty:
{difficulty}

Recommended Question Category:
{recommended_type} (e.g. Conceptual, Practical, Scenario-based, Project-based, Resume-specific, Why/How, Debugging, Architecture, Trade-off, Real-world, Follow-up, Problem diagnosis, Decision-making)

Previous Questions:
{previous_questions_str}

Previous Performance:
{eval_snippet}

Known Weak Areas:
{weak_areas_str}

Candidate Memory:
{candidate_memory_summary or 'Clean slate / no recorded persistent weaknesses.'}

Retrieved RAG Context:
{rag_context or 'Use foundational industry best practices for ' + target_role + '.'}

Requirements:
1. Generate exactly one question.
2. Do not repeat previous questions.
3. Avoid semantic duplicates of any previously asked question.
4. Prefer resume-specific and project-specific questions when relevant.
5. Adapt difficulty to the candidate's performance ({difficulty}).
6. Use realistic, natural spoken interview language (1-2 sentences).
7. Do not ask coding/programming implementation questions (NO 'write code', NO LeetCode).
8. Focus on conceptual, practical, scenario-based, project-based, architecture, debugging, trade-off, and real-world questions.
9. Use the RAG context for factual grounding.
10. Do not mention that RAG or an AI system was used.
11. Do not fabricate experience that is not present in the resume.

Return ONLY valid JSON in this exact structure:
{{
  "questionText": "Realistic interview question...",
  "questionType": "{recommended_type}",
  "topic": "{current_topic}",
  "domain": "{current_domain or target_role}",
  "difficulty": "{difficulty}",
  "expectedConcepts": ["Key Concept 1", "Key Concept 2", "Key Concept 3"],
  "aiReasoning": "Why this question was generated based on candidate profile, target role, and difficulty.",
  "isFollowUp": {'true' if is_follow_up else 'false'},
  "stage": "TECHNICAL"
}}
"""

    llm_result = await call_llm(
        prompt=prompt,
        agent_name="QuestionGenerationAgent",
        interview_id=interview_id,
        candidate_id=candidate_id,
        temperature=0.35
    )

    if llm_result.get("text"):
        parsed = parse_ai_json(llm_result["text"], None)
        if parsed and parsed.get("questionText"):
            q_text = parsed["questionText"].strip()
            # Verify anti-repetition and semantic duplicate avoidance
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
                    "stage": parsed.get("stage", ("MANAGERIAL" if round == "ROUND_2_MANAGERIAL" else ("HR" if round == "ROUND_3_HR" else "TECHNICAL"))),
                    "ragSource": current_topic if rag_context else "Role Knowledge Base"
                }

    # Fallback paths for Managerial and HR rounds
    if round == "ROUND_2_MANAGERIAL":
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
        # Pick non-duplicate fallback
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

    if round == "ROUND_3_HR":
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

    # Technical Round fallback selected from role-specific catalog with anti-duplicate selection
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
