"""
LLM Prompt Templates for NexHire AI
Contains structured prompt templates for Resume Analysis, Interview Planning,
Question Generation, LLM-as-a-Judge Evaluation, Round Summaries, Recruiter Decisions, and Career Guidance.
"""

def build_resume_analysis_prompt(resume_text: str, target_role: str = "") -> str:
    role_ctx = f'Target Role context: "{target_role}"' if target_role else "Target Role: Engineering candidate across SDE, Frontend, Backend, Full Stack, AI/Data Science, DevOps"
    return f"""
You are an expert Technical Recruiter and Resume Intelligence engine for NexHire AI.
Analyze the following candidate resume text.
{role_ctx}

Perform structured extraction of:
1. "skills": List of objects with:
   - "name": Normalized canonical technology/tool/concept name (e.g., Python, React, FastAPI, Docker, MongoDB, REST APIs, Scikit-learn, AWS).
   - "level": Proficiency level ("beginner" | "intermediate" | "advanced" | "expert").
   - "confidence": Float score (0.75 to 0.98).
   - "yearsOfExperience": Estimated years (float or int).
2. "projects": List of objects with:
   - "name": Project title.
   - "technologies": List of technology names used in this project.
   - "description": Concise 1-2 sentence summary of what was engineered.
   - "impact": Architecture achievement, performance improvement, or accuracy metric.
3. "certifications": List of certification titles or course completions.
4. "experienceSummary": Summary of candidate's professional work, internships, or engineering tenure.
5. "educationSummary": Degree, institution, and major/field of study.
6. "weakAreas": Potential unmentioned or shallow technical areas relative to their target domain.
7. "strongAreas": Core strengths demonstrated with concrete project/experience evidence.
8. "overallReadinessScore": Estimated technical readiness percentage (0 to 100).

Resume Content:
{resume_text[:7000]}

Return ONLY valid JSON in this exact structure:
{{
  "skills": [
    {{ "name": "Python", "level": "advanced", "confidence": 0.94, "yearsOfExperience": 2 }},
    {{ "name": "Scikit-learn", "level": "intermediate", "confidence": 0.88, "yearsOfExperience": 1 }},
    {{ "name": "Pandas", "level": "advanced", "confidence": 0.90, "yearsOfExperience": 2 }},
    {{ "name": "React", "level": "intermediate", "confidence": 0.82, "yearsOfExperience": 1 }}
  ],
  "projects": [
    {{
      "name": "Predictive Diagnostic System",
      "technologies": ["Python", "Scikit-learn", "Pandas", "Random Forest"],
      "description": "Engineered predictive ML classification pipeline with cross-validation and feature scaling.",
      "impact": "Achieved 91% ROC-AUC accuracy on unseen clinical validation data."
    }}
  ],
  "certifications": ["AWS Certified Cloud Practitioner"],
  "experienceSummary": "1+ years experience developing software applications and data workflows",
  "educationSummary": "Bachelor of Technology in Computer Science & Engineering",
  "weakAreas": ["Distributed System Design", "Query Optimization"],
  "strongAreas": ["Python", "Machine Learning", "Data Preprocessing"],
  "overallReadinessScore": 84
}}
"""

def build_interview_planning_prompt(
    target_role: str,
    round_name: str,
    skills_list: list,
    projects_list: list,
    weakness_list: list,
    role_topics: list
) -> str:
    return f"""
You are the Interview Planning Engine for NexHire AI.
Formulate a personalized, strictly NON-CODING interview plan for a candidate applying for "{target_role}" in round "{round_name}".

Candidate Profile Skills: {', '.join(skills_list)}
Candidate Resume Projects: {', '.join(projects_list) if projects_list else 'Standard industry projects'}
Identified Weaknesses from Previous Interviews: {', '.join(weakness_list) if weakness_list else 'None recorded'}
Role Domain Areas: {', '.join(role_topics)}

Requirements:
- Proactively incorporate previously failed/weak topics for reassessment if present.
- Define a realistic topic distribution across 4 questions for Round 1 (or 3 questions for Round 2 / Round 3).
- Choose initial difficulty level: "beginner", "medium", "advanced", or "hard".
- Outline clear strategy for the interviewer.
- Strictly NON-CODING: Focus on conceptual understanding, system architecture, performance optimization, real-world project debugging, trade-offs, and design decisions.

Return ONLY valid JSON:
{{
  "topics": ["{role_topics[0]}", "{role_topics[1]}", "{role_topics[2] if len(role_topics) > 2 else role_topics[0]}", "{role_topics[3] if len(role_topics) > 3 else role_topics[0]}"],
  "distribution": {{
    "Technical Fundamentals": 1,
    "Core Domain & Reassessment": 2,
    "Architecture & Trade-offs": 1
  }},
  "initialDifficulty": "medium",
  "strategy": "Evaluate candidate on domain concepts, project architecture, and trade-offs tailored to {target_role}.",
  "priorityFocus": ["{role_topics[0]}", "{role_topics[1]}"]
}}
"""

def build_question_generation_prompt(
    target_role: str,
    skills_str: str,
    projects_str: str,
    candidate_experience: str,
    current_domain: str,
    current_topic: str,
    difficulty: str,
    recommended_type: str,
    previous_questions_str: str,
    eval_snippet: str,
    weak_areas_str: str,
    candidate_memory_summary: str,
    rag_context: str,
    is_follow_up: bool
) -> str:
    return f"""
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

def build_answer_evaluation_prompt(
    question_text: str,
    candidate_answer: str,
    expected_concepts: list,
    target_skill: str,
    stage: str
) -> str:
    return f"""
You are the Senior Evaluation Engine & LLM-as-a-Judge for NexHire AI.
Evaluate the candidate's interview answer objectively using our strict 5-factor evaluation rubric.

Interview Question: "{question_text}"
Stage / Focus: "{stage}" ({target_skill})
Expected Key Concepts: {', '.join(expected_concepts) if expected_concepts else 'Core principles'}
Candidate Answer: "{candidate_answer[:1500] if candidate_answer else 'No answer provided'}"

Rubric Dimensions (Scores from 1.0 to 10.0):
1. correctness (30% weight): Technical factual accuracy and correctness.
2. technicalDepth (25% weight): Depth of knowledge, internal mechanics, edge-case awareness.
3. relevance (20% weight): Directness of answer to what was asked.
4. clarity (15% weight): Structure, articulation, precision of language.
5. completeness (10% weight): Thoroughness across required concepts.

Overall Score formula:
overall = (correctness * 0.30) + (technicalDepth * 0.25) + (relevance * 0.20) + (clarity * 0.15) + (completeness * 0.10)

Also identify:
- missingConcepts: List of essential concepts or keywords the candidate omitted.
- strengths: Concise sentence on strong points.
- areasToImprove: Specific actionable advice to reach 10/10.
- feedback: Recruiter summary commentary.

Return ONLY valid JSON:
{{
  "correctness": 8.5,
  "technicalDepth": 7.5,
  "relevance": 9.0,
  "clarity": 8.0,
  "completeness": 7.0,
  "overall": 8.1,
  "missingConcepts": ["Time Complexity", "Rebalancing"],
  "strengths": "Accurate explanation of fundamental bucket structures.",
  "areasToImprove": "Mention how treeify threshold is triggered in high collisions.",
  "feedback": "Strong conceptual clarity. Deepening performance specifics will make the response outstanding."
}}
"""

def build_career_roadmap_prompt(
    target_role: str,
    eval_summary: str,
    mem_summary: str
) -> str:
    return f"""
You are the Career Guidance & Recommendation Engine for NexHire AI.
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
        "Explain how CPU L1/L2 cache coherency interacts with volatile variables.",
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
      "resources": ["Designing Data-Intensive Applications"]
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
      "resources": ["LeetCode Top Interview Questions"]
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
  "nextInterviewStrategy": "Focus on opening with high-level architecture before diving into code, and actively mention trade-offs upfront.",
  "recommendedTopics": ["B+ Trees", "Redis Caching", "Concurrency", "HashMap Internals"]
}}
"""
