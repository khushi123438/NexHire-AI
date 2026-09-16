import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.services.llm_service import call_llm, parse_ai_json

async def extract_resume_data(resume_text: str) -> Dict[str, Any]:
    """1. Extract Resume Data (Skills, Education, Experience) with regex fallback"""
    prompt = f"""
You are an expert AI Technical Recruiter and Resume Parser.
Analyze the following resume text and extract the candidate's core technical and professional skills.

Return ONLY a valid JSON object in this exact schema:
{{
  "skills": ["JavaScript", "React", "Node.js", "DSA", "Operating Systems", "DBMS", "MongoDB", "SQL"],
  "education": "B.Tech Computer Science",
  "experience": "Fresher / 1+ Year"
}}

Resume Text:
{resume_text[:5000]}
"""

    try:
        llm_result = await call_llm(prompt=prompt, agent_name="ResumeExtractor", temperature=0.2)
        if llm_result.get("text"):
            parsed = parse_ai_json(llm_result["text"], None)
            if parsed and isinstance(parsed.get("skills"), list) and len(parsed["skills"]) > 0:
                return parsed
    except Exception as err:
        print(f"[Gemini] extract_resume_data note: {err}")

    # Fallback extraction using regex heuristics
    common_keywords = [
        "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Ruby", "PHP",
        "React", "React.js", "Next.js", "Angular", "Vue", "HTML", "CSS", "Tailwind CSS", "Bootstrap",
        "Node.js", "Express", "Express.js", "FastAPI", "Django", "Spring Boot",
        "MongoDB", "MySQL", "PostgreSQL", "SQL", "Redis", "Firebase", "DynamoDB",
        "DSA", "Data Structures", "Algorithms", "Operating Systems", "OS", "DBMS", "Computer Networks", "CN", "OOPs",
        "Git", "GitHub", "Docker", "Kubernetes", "AWS", "CI/CD", "REST API", "GraphQL", "Machine Learning", "AI"
    ]

    found_skills = []
    text_lower = resume_text.lower()
    for keyword in common_keywords:
        pattern = re.compile(r'\b' + re.escape(keyword.lower()) + r'\b', re.I)
        if pattern.search(text_lower) and keyword not in found_skills:
            found_skills.append(keyword)

    return {
        "skills": found_skills if found_skills else ["DSA", "Operating Systems", "DBMS", "Computer Networks", "JavaScript", "React.js"],
        "education": "B.Tech / Computer Science",
        "experience": "Entry-Level / Software Engineering"
    }

async def generate_recruiter_question(
    candidate_name: str = "Candidate",
    skills: List[str] = None,
    target_role: str = "Software Development Engineer (SDE)",
    round: str = "ROUND_1_TECHNICAL",
    current_question_index: int = 0,
    previous_conversations: List[Dict[str, Any]] = None,
    resume_text: str = ""
) -> Dict[str, Any]:
    """2. Generate Next Interview Question (3-Round Realistic Architecture)"""
    if skills is None or len(skills) == 0:
        skills = ["DSA", "React.js", "Node.js", "DBMS"]
    if previous_conversations is None:
        previous_conversations = []

    stage = "TECHNICAL"
    target_skill = skills[0] if skills else "Core Fundamentals"
    is_follow_up = False

    if round == "ROUND_2_MANAGERIAL":
        stage = "MANAGERIAL"
        managerial_topics = [
            "Teamwork & Conflict Resolution",
            "Handling Tight Deadlines & Production Incidents",
            "Project Ownership & Trade-offs",
            "Leadership & Mentorship",
        ]
        target_skill = managerial_topics[current_question_index % len(managerial_topics)]
        is_follow_up = current_question_index > 0 and current_question_index % 2 == 1
    elif round == "ROUND_3_HR":
        stage = "HR"
        hr_topics = [
            "Career Goals & Company Culture Fit",
            "Salary Expectations & Work Preferences",
            "Work Ethics, Notice Period & Joining",
            "Candidate Questions for the Organization",
        ]
        target_skill = hr_topics[current_question_index % len(hr_topics)]
        is_follow_up = current_question_index > 0 and current_question_index % 2 == 1
    else:
        stage = "TECHNICAL"
        tech_skills = skills if skills else ["DSA", "System Architecture", "DBMS", "Coding Logic"]
        target_skill = tech_skills[current_question_index % len(tech_skills)]
        is_follow_up = current_question_index > 0 and current_question_index % 2 == 1

    try:
        history_context = "\n".join([f"{msg.get('speaker', 'USER')}: {msg.get('text', '')}" for msg in previous_conversations[-6:]])

        if round == "ROUND_2_MANAGERIAL":
            role_persona = f"""
You are the Senior Engineering Manager and Team Lead conducting "Round 2: Managerial & Behavioral Round" for "{candidate_name}" applying for "{target_role}".
Focus on:
- How they collaborate across engineering, product, and QA teams.
- Situational questions using the STAR framework (Situation, Task, Action, Result).
- How they resolve disagreements with peers, handle scope creep, or manage production outages under pressure.
"""
        elif round == "ROUND_3_HR":
            role_persona = f"""
You are the Head of Human Resources conducting "Round 3: HR Discussion Round" for "{candidate_name}" for "{target_role}".
Focus on:
- Career aspirations, motivation for choosing this company, and long-term vision.
- Salary expectations, relocation preferences, work culture alignment, and notice period.
- Maintain a warm, encouraging, yet professional and thorough HR tone.
"""
        else:
            role_persona = f"""
You are a Principal Software Engineer & Bar Raiser conducting "Round 1: Technical & Skill-Based Interview" for "{candidate_name}" for "{target_role}".
Focus on:
- Deep dive into core subjects (DSA, OS, DBMS, Networks, Concurrency, System Design, REST APIs).
- Practical code reasoning, debugging scenarios, algorithmic complexity, memory bottlenecks, and architectural trade-offs.
"""

        prompt = f"""
{role_persona}

Candidate confirmed skills: {', '.join(skills)}.
Current Round: {round}
Question Number in this Round: {current_question_index + 1}
Target Area / Skill: {target_skill}
Is Follow-up Probe: {'YES' if is_follow_up else 'NO'}

Recent Conversation in this Round:
{history_context or "No previous interactions in this round. This is the opening question."}

Instructions:
- Frame a realistic, high-impact spoken interview question suited for {round}.
- Make sure questions are varied, insightful, and directly test practical competency.
- Keep the recruiter question concise and natural to be spoken by Text-to-Speech (1 to 2 sentences max).

Return ONLY valid JSON:
{{
  "questionText": "Realistic spoken question text here...",
  "stage": "{stage}",
  "targetSkill": "{target_skill}",
  "isFollowUp": {'true' if is_follow_up else 'false'}
}}
"""
        llm_result = await call_llm(prompt=prompt, agent_name="QuestionGenerator", temperature=0.35)
        if llm_result.get("text"):
            parsed = parse_ai_json(llm_result["text"], None)
            if parsed and parsed.get("questionText"):
                return {
                    "questionText": parsed["questionText"].strip(),
                    "stage": parsed.get("stage", stage),
                    "targetSkill": parsed.get("targetSkill", target_skill),
                    "isFollowUp": parsed.get("isFollowUp", is_follow_up),
                }
    except Exception as err:
        print(f"[Gemini] generate_recruiter_question note: {err}")

    # Fallbacks by round
    if round == "ROUND_2_MANAGERIAL":
        managerial_fallbacks = [
            {
                "stage": "MANAGERIAL",
                "targetSkill": "Teamwork & Conflict Resolution",
                "questionText": f"Welcome to the Managerial Round, {candidate_name}. Can you describe a situation where you had a strong disagreement with a team member or tech lead on an implementation, and how you reached a resolution?",
                "isFollowUp": False,
            },
            {
                "stage": "MANAGERIAL",
                "targetSkill": "Handling Production Incidents",
                "questionText": "Tell me about a time when a critical bug or outage occurred in a system you worked on close to a deadline. How did you diagnose and prioritize the fix?",
                "isFollowUp": True,
            },
            {
                "stage": "MANAGERIAL",
                "targetSkill": "Project Ownership & Trade-offs",
                "questionText": "How do you manage trade-offs between delivering features quickly for business needs versus maintaining clean architecture and code quality?",
                "isFollowUp": False,
            },
        ]
        return managerial_fallbacks[current_question_index % len(managerial_fallbacks)]
    elif round == "ROUND_3_HR":
        hr_fallbacks = [
            {
                "stage": "HR",
                "targetSkill": "Introduction & Culture Fit",
                "questionText": f"Hello {candidate_name}, welcome to the HR Discussion Round. What attracted you to our organization, and where do you see your career growing over the next 2 to 3 years?",
                "isFollowUp": False,
            },
            {
                "stage": "HR",
                "targetSkill": "Salary & Work Preferences",
                "questionText": "What are your salary expectations for this role, and what are your preferences regarding work environment and joining availability?",
                "isFollowUp": False,
            },
            {
                "stage": "HR",
                "targetSkill": "Workplace Values",
                "questionText": "What type of team culture enables you to do your best work, and do you have any questions for our HR leadership team?",
                "isFollowUp": True,
            },
        ]
        return hr_fallbacks[current_question_index % len(hr_fallbacks)]
    else:
        tech_skill1 = skills[0] if len(skills) > 0 else "Data Structures"
        tech_skill2 = skills[1] if len(skills) > 1 else "Databases & System Architecture"
        tech_fallbacks = [
            {
                "stage": "TECHNICAL",
                "targetSkill": tech_skill1,
                "questionText": f"Welcome to Round 1: Technical Interview, {candidate_name}. Let's dive into {tech_skill1}. How do you choose the right data structures to optimize both time complexity and memory usage in high-throughput applications?",
                "isFollowUp": False,
            },
            {
                "stage": "TECHNICAL",
                "targetSkill": tech_skill1,
                "questionText": f"Building on that, can you walk me through an edge-case or performance bottleneck you encountered with {tech_skill1} in a real project and how you solved it?",
                "isFollowUp": True,
            },
            {
                "stage": "TECHNICAL",
                "targetSkill": tech_skill2,
                "questionText": f"Let's discuss {tech_skill2}. How do you handle concurrency, indexing, and data consistency when designing scalable backend services?",
                "isFollowUp": False,
            },
            {
                "stage": "TECHNICAL",
                "targetSkill": "System Design & Architecture",
                "questionText": "If you had to design an API with rate limiting and caching to prevent server overload, what architecture and strategies would you choose?",
                "isFollowUp": True,
            },
        ]
        return tech_fallbacks[current_question_index % len(tech_fallbacks)]

async def evaluate_answer(
    question_text: str,
    candidate_answer: str,
    target_skill: str = "Technical Skills",
    stage: str = "TECHNICAL",
    candidate_name: str = "Candidate"
) -> Dict[str, Any]:
    """3. AI Answer Evaluation (4-dimension scoring + strengths + areas to improve)"""
    try:
        if candidate_answer and len(candidate_answer.strip()) > 5:
            prompt = f"""
You are NexHire AI, an expert technical and managerial interviewer evaluating an interview answer.

Question Asked: "{question_text}"
Stage: "{stage}" ({target_skill})
Candidate Spoken Answer: "{candidate_answer}"

Evaluate the candidate's answer across these dimensions:
1. technicalAccuracy (Score out of 10, e.g. 8.5)
2. communication (Score out of 10, e.g. 7.8)
3. confidence (Score out of 10, e.g. 8.0)
4. examplesUsed (Score out of 10, e.g. 6.5)
5. strengths: Brief sentence on what was good
6. areasToImprove: Brief constructive suggestion
7. feedback: Concise recruiter summary feedback

Return ONLY valid JSON:
{{
  "technicalAccuracy": 8.5,
  "communication": 7.8,
  "confidence": 8.0,
  "examplesUsed": 6.5,
  "strengths": "Clear explanation of core concept",
  "areasToImprove": "Add practical examples and mention time complexity",
  "feedback": "Strong communication and confidence. Improve technical depth for a stronger recommendation."
}}
"""
            llm_result = await call_llm(prompt=prompt, agent_name="AnswerEvaluator", temperature=0.2)
            if llm_result.get("text"):
                parsed = parse_ai_json(llm_result["text"], None)
                if parsed and isinstance(parsed.get("technicalAccuracy"), (int, float)):
                    return {
                        "technicalAccuracy": min(10.0, max(1.0, round(float(parsed["technicalAccuracy"]), 1))),
                        "communication": min(10.0, max(1.0, round(float(parsed.get("communication", 8.0)), 1))),
                        "confidence": min(10.0, max(1.0, round(float(parsed.get("confidence", 8.0)), 1))),
                        "examplesUsed": min(10.0, max(1.0, round(float(parsed.get("examplesUsed", 7.0)), 1))),
                        "strengths": parsed.get("strengths", "Clear explanation of core concept"),
                        "areasToImprove": parsed.get("areasToImprove", "Add practical examples and mention trade-offs"),
                        "feedback": parsed.get("feedback", "Good conceptual clarity and structured delivery.")
                    }
    except Exception as err:
        print(f"[Gemini] evaluate_answer note: {err}")

    words = [w for w in (candidate_answer or "").strip().split() if w]
    base_score = 8.5 if len(words) > 25 else (7.5 if len(words) > 10 else 6.0)

    return {
        "technicalAccuracy": round(base_score, 1),
        "communication": round(base_score - 0.7, 1),
        "confidence": round(base_score - 0.5, 1),
        "examplesUsed": round(base_score - 1.2, 1),
        "strengths": "Clear explanation of core concept and structured thought process",
        "areasToImprove": "Add practical code examples and mention real-world trade-offs",
        "feedback": "Demonstrated solid understanding of the fundamentals with articulate communication."
    }

async def generate_round_recommendation(
    candidate_name: str = "Candidate",
    target_role: str = "Software Development Engineer (SDE)",
    round: str = "ROUND_1_TECHNICAL",
    evaluations: List[Dict[str, Any]] = None,
    conversation_history: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """4. Generate Personalized Round Recommendation & Progression Decision"""
    if evaluations is None:
        evaluations = []

    round_names = {
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

    current_info = round_names.get(round, round_names["ROUND_1_TECHNICAL"])

    try:
        summary_evals = "\n".join([
            f"Q{idx + 1}: [Accuracy: {e.get('technicalAccuracy', e.get('correctness', 8))}/10, Comm: {e.get('communication', e.get('clarity', 8))}/10] Strengths: '{e.get('strengths', '')}', Areas to Polish: '{e.get('areasToImprove', '')}'"
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
  "round": "{round}",
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
        llm_result = await call_llm(prompt=prompt, agent_name="RoundEvaluator", temperature=0.25)
        if llm_result.get("text"):
            parsed = parse_ai_json(llm_result["text"], None)
            if parsed and isinstance(parsed.get("score"), (int, float)):
                return {
                    "round": round,
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
    except Exception as err:
        print(f"[Gemini] generate_round_recommendation note: {err}")

    avg_score = 8.0
    if evaluations:
        total = sum(e.get("technicalAccuracy", e.get("correctness", 8.0)) + e.get("communication", e.get("clarity", 8.0)) for e in evaluations)
        avg_score = round(total / (len(evaluations) * 2), 1)

    passed = avg_score >= 6.5

    return {
        "round": round,
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

async def generate_recruiter_decision(
    candidate_name: str = "Candidate",
    skills: List[str] = None,
    target_role: str = "Software Engineer / SDE",
    conversation_history: List[Dict[str, Any]] = None,
    evaluations: List[Dict[str, Any]] = None,
    round_recommendations: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """5. AI Recruiter Final Decision (Aggregating all 3 rounds)"""
    if skills is None:
        skills = []
    if evaluations is None:
        evaluations = []
    if round_recommendations is None:
        round_recommendations = []

    try:
        summary_evals = "\n".join([
            f"Q{idx + 1}: [Acc: {e.get('technicalAccuracy', e.get('correctness', 8))}/10, Comm: {e.get('communication', e.get('clarity', 8))}/10] Strengths: '{e.get('strengths', '')}'"
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
        llm_result = await call_llm(prompt=prompt, agent_name="RecruiterDecision", temperature=0.25)
        if llm_result.get("text"):
            parsed = parse_ai_json(llm_result["text"], None)
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
    except Exception as err:
        print(f"[Gemini] generate_recruiter_decision note: {err}")

    # Fallback calculation
    avg_acc, avg_comm, avg_conf, avg_ex = 8.4, 8.2, 8.5, 8.0
    if evaluations:
        avg_acc = sum(e.get("technicalAccuracy", e.get("correctness", 8.0)) for e in evaluations) / len(evaluations)
        avg_comm = sum(e.get("communication", e.get("clarity", 8.0)) for e in evaluations) / len(evaluations)
        avg_conf = sum(e.get("confidence", e.get("relevance", 8.0)) for e in evaluations) / len(evaluations)
        avg_ex = sum(e.get("examplesUsed", e.get("technicalDepth", 7.5)) for e in evaluations) / len(evaluations)

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
