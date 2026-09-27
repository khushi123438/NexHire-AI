from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config.db import get_db
from app.utils.helpers import to_object_id, serialize_doc
from app.services.llm_service import call_llm, parse_ai_json

async def generate_learning_roadmap(
    candidate_id: Any,
    interview_id: str = "",
    target_role: str = "Software Development Engineer (SDE)",
    evaluations: List[Dict[str, Any]] = None,
    candidate_memories: List[Dict[str, Any]] = None,
    candidate_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Agent 6: Career Coach Agent
    Transforms interview performance, mistakes, and candidate memory into a personalized multi-day study roadmap
    """
    if evaluations is None:
        evaluations = []
    if candidate_memories is None:
        candidate_memories = []

    eval_summary_lines = []
    for idx, e in enumerate(evaluations):
        round_name = e.get("round", "TECH")
        score = e.get("overall", e.get("technicalAccuracy", 8.0))
        missing = ", ".join(e.get("missingConcepts", []))
        weakness = e.get("areasToImprove", "")
        eval_summary_lines.append(f"Q{idx + 1} ({round_name}): Score {score}/10. Missing Concepts: [{missing}]. Weaknesses: '{weakness}'")

    eval_summary = "\n".join(eval_summary_lines)
    mem_summary = "\n".join([f"- {m.get('topic', '')}: {m.get('concept', '')} (Score: {m.get('score', 5)}/10)" for m in candidate_memories])

    prompt = f"""
You are the Career Coach Agent for NexHire AI.
Synthesize the candidate's interview performance and create a comprehensive, high-impact personalized multi-day learning roadmap and weakness report for "{target_role}".

Candidate Performance Summary:
{eval_summary or "Candidate completed standard technical rounds."}

Existing Historical Weaknesses:
{mem_summary or "None logged."}

Instructions:
1. Generate an actionable 5-day structured study roadmap targeting specific missed concepts and weak areas.
2. For each day, provide a title, focusArea, key concepts to study, 2-3 specific practice questions/exercises, and recommended official resources/topics.
3. Categorize weaknesses by severity ("critical", "moderate", "minor") with concrete evidence from the interview.
4. Provide a clear next interview strategy.

Return ONLY valid JSON:
{{
  "overallSummary": "Candidate demonstrates solid foundational awareness but needs structured preparation in database indexing and distributed concurrency.",
  "readinessScore": 76,
  "strongConcepts": ["REST APIs", "JavaScript Closures", "React Component Lifecycle"],
  "weaknessReport": [
    {{
      "domain": "DBMS",
      "topic": "Indexing",
      "concept": "B+ Tree Indexing & Composite Keys",
      "severity": "critical",
      "evidence": "Candidate could not explain B+ tree leaf pointer traversals for range queries.",
      "score": 5.2,
      "recommendation": "Deep dive into storage engine leaf node layouts and leftmost prefix rules."
    }},
    {{
      "domain": "Java",
      "topic": "Concurrency",
      "concept": "Locks vs Volatile Visibility",
      "severity": "moderate",
      "evidence": "Omitted memory barrier nuances in multi-core CPU caches.",
      "score": 6.4,
      "recommendation": "Practice writing lock-free algorithms using Atomic references and ReentrantLocks."
    }}
  ],
  "dailyRoadmap": [
    {{
      "day": 1,
      "title": "Mastering Database Indexing & Query Execution Plans",
      "focusArea": "DBMS & Storage Engines",
      "concepts": ["B+ Trees", "Clustered vs Secondary Indexes", "EXPLAIN Cost Optimizer", "Composite Indexes"],
      "practiceQuestions": [
        "How does a B+ tree minimize disk I/O compared to a standard Binary Search Tree?",
        "Why does a query with WHERE colB = 1 fail to use an index on (colA, colB)?"
      ],
      "resources": ["PostgreSQL/MySQL Indexing Docs", "Use The Index, Luke! Guide"]
    }},
    {{
      "day": 2,
      "title": "Concurrency, Memory Barriers & Lock-Free Data Structures",
      "focusArea": "Multithreading & Concurrency",
      "concepts": ["Volatile vs Synchronized", "CAS (Compare-And-Swap)", "Deadlock Prevention", "Thread Pools"],
      "practiceQuestions": [
        "Explain how the CPU L1/L2 cache coherency protocol interacts with volatile variables.",
        "Implement a thread-safe bounded buffer using Locks and Conditions."
      ],
      "resources": ["Java Concurrency in Practice", "Operating Systems: Three Easy Pieces"]
    }},
    {{
      "day": 3,
      "title": "Distributed Caching & High-Throughput System Design",
      "focusArea": "System Design",
      "concepts": ["Redis Eviction Policies", "Cache Stampede Mitigation", "Consistent Hashing", "Rate Limiting"],
      "practiceQuestions": [
        "Design a sliding window rate limiter using Redis sorted sets.",
        "How do virtual nodes prevent hot-spots in consistent hashing rings?"
      ],
      "resources": ["Designing Data-Intensive Applications (Martin Kleppmann)"]
    }},
    {{
      "day": 4,
      "title": "Data Structures & Algorithmic Optimization",
      "focusArea": "DSA Problem Solving",
      "concepts": ["Hash Table Collision Resolution", "Red-Black Tree Rebalancing", "Dynamic Programming Memoization"],
      "practiceQuestions": [
        "Explain the step-by-step resizing and treeification of Java 8 HashMap.",
        "Solve the Longest Increasing Subsequence in O(N log N) using binary search."
      ],
      "resources": ["LeetCode Top Interview Questions", "MIT OpenCourseWare 6.006"]
    }},
    {{
      "day": 5,
      "title": "Managerial Communication & Mock Interview Simulation",
      "focusArea": "Behavioral & Final Reassessment",
      "concepts": ["STAR Method", "Production Outage Post-mortems", "Architecture Trade-offs"],
      "practiceQuestions": [
        "Rehearse explaining your resume architecture project focusing on trade-offs and metrics.",
        "Structure a 2-minute answer on resolving a high-stakes technical dispute with a tech lead."
      ],
      "resources": ["NexHire AI Voice Mock Interview Drills"]
    }}
  ],
  "nextInterviewStrategy": "Focus on opening with high-level architecture before diving into code, and actively mention trade-offs and time/space complexities upfront.",
  "recommendedTopics": ["B+ Trees", "Redis Caching", "Java Concurrency", "HashMap Internals"]
}}
"""

    learning_plan_data = None
    llm_result = await call_llm(
        prompt=prompt,
        agent_name="CareerCoachAgent",
        interview_id=interview_id,
        candidate_id=candidate_id,
        temperature=0.3
    )

    if llm_result.get("text"):
        parsed = parse_ai_json(llm_result["text"], None)
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
            print(f"[CareerCoach] LearningPlan save note: {save_err}")

    return {
        "learningPlan": plan_doc or learning_plan_data,
        **learning_plan_data
    }

generate_career_roadmap = generate_learning_roadmap
generate_candidate_learning_roadmap = generate_learning_roadmap

__all__ = ["generate_learning_roadmap", "generate_career_roadmap", "generate_candidate_learning_roadmap"]

