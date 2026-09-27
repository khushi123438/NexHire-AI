import random
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import UploadFile, HTTPException, status
from app.config.db import get_db
from app.utils.helpers import to_object_id, serialize_doc
from app.services.interview_service import (
    initialize_interview_session,
    execute_interview_turn,
    QUESTIONS_PER_ROUND
)
from app.services.genai_service import (
    generate_recruiter_hiring_decision,
    generate_round_summary_recommendation,
    generate_candidate_learning_roadmap
)
from app.services.memory_service import get_candidate_weaknesses
from app.middleware.upload import save_audio_file

# 1. Start a New Interview Session
async def start_interview_handler(data: dict, user: dict) -> dict:
    try:
        user_id = user["id"]
        u_id = to_object_id(user_id)
        db = get_db()

        skills = data.get("skills")
        target_role = (data.get("targetRole") or "").strip()
        resume_id = data.get("resumeId")
        round_name = data.get("round") or "ROUND_1_TECHNICAL"

        # Resolve targetRole dynamically if not explicitly given
        if not target_role:
            if resume_id and to_object_id(resume_id):
                target_resume = await db.resumes.find_one({"_id": to_object_id(resume_id), "user": u_id})
                if target_resume and target_resume.get("targetRole"):
                    target_role = target_resume["targetRole"]
            if not target_role:
                latest_res = await db.resumes.find_one({"user": u_id}, sort=[("uploadedAt", -1)])
                if latest_res and latest_res.get("targetRole"):
                    target_role = latest_res["targetRole"]
            if not target_role:
                cand_prof = await db.candidateprofiles.find_one({"userId": u_id})
                if cand_prof and cand_prof.get("targetRole"):
                    target_role = cand_prof["targetRole"]
                elif cand_prof and cand_prof.get("targetRoles"):
                    target_role = cand_prof["targetRoles"][0]
        if not target_role:
            target_role = "Software Development Engineer (SDE)"

        # Resolve skills from request, resumes, or profile if missing
        if not skills or not isinstance(skills, list) or len(skills) == 0:
            if resume_id and to_object_id(resume_id):
                target_resume = await db.resumes.find_one({"_id": to_object_id(resume_id), "user": u_id})
                if target_resume and target_resume.get("skills"):
                    skills = target_resume["skills"]

            if not skills:
                latest_resume = await db.resumes.find_one({"user": u_id, "targetRole": target_role})
                if latest_resume and latest_resume.get("skills"):
                    skills = latest_resume["skills"]
                else:
                    any_resume = await db.resumes.find_one({"user": u_id}, sort=[("uploadedAt", -1)])
                    if any_resume and any_resume.get("skills"):
                        skills = any_resume["skills"]
                    elif user.get("skills"):
                        skills = user["skills"]

        if not skills:
            skills = ["Problem Solving", "Architecture", "Engineering Best Practices"]

        candidate_name = user.get("name") or "Candidate"
        interview_id = f"INT{random.randint(10000, 99999)}"

        session_init = await initialize_interview_session(
            user_id=user_id,
            candidate_name=candidate_name,
            target_role=target_role,
            round_name=round_name,
            skills=skills
        )

        first_q = session_init["firstQuestion"]

        initial_conversation = {
            "speaker": "AI_RECRUITER",
            "text": first_q["questionText"],
            "audioUrl": "",
            "timestamp": datetime.utcnow(),
            "duration": 12.0,
            "questionIndex": 0,
            "round": round_name,
            "stage": first_q.get("stage", "TECHNICAL"),
            "aiInsight": first_q.get("aiReasoning", "Opening assessment question."),
        }

        new_interview = {
            "interviewId": interview_id,
            "candidate": u_id,
            "candidateName": candidate_name,
            "skills": skills,
            "targetRole": target_role,
            "currentRound": round_name,
            "difficultyLevel": session_init.get("initialDifficulty", "medium"),
            "roundStatus": "IN_PROGRESS",
            "status": "IN_PROGRESS",
            "currentQuestionIndex": 0,
            "currentStage": first_q.get("stage", "TECHNICAL"),
            "currentQuestionText": first_q["questionText"],
            "interviewPlan": session_init.get("interviewPlan", {}),
            "agentReasoning": [
                {
                    "questionIndex": 0,
                    "reason": first_q.get("aiReasoning", ""),
                    "retrievedMemory": "Initial evaluation based on candidate profile",
                    "ragSource": first_q.get("ragSource", "Knowledge Corpus"),
                    "difficultyShift": "initial",
                }
            ],
            "questions": [
                {
                    "questionIndex": 0,
                    "round": round_name,
                    "stage": first_q.get("stage", "TECHNICAL"),
                    "targetSkill": first_q.get("topic", ""),
                    "questionText": first_q["questionText"],
                    "difficulty": session_init.get("initialDifficulty", "medium"),
                    "aiReasoning": first_q.get("aiReasoning", ""),
                    "expectedConcepts": first_q.get("expectedConcepts", []),
                    "isFollowUp": False,
                    "isSkipped": False,
                    "isReviewed": False,
                    "duration": 12.0,
                }
            ],
            "conversationHistory": [initial_conversation],
            "evaluations": [],
            "roundRecommendations": [],
            "startTime": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        res = await db.interviews.insert_one(new_interview)
        new_interview["_id"] = res.inserted_id

        # Persist to standalone Conversation collection
        await db.conversations.insert_one({
            "interviewId": interview_id,
            "targetRole": target_role,
            "user": u_id,
            "speaker": "AI_RECRUITER",
            "text": first_q["questionText"],
            "audioUrl": "",
            "timestamp": datetime.utcnow(),
            "duration": 12.0,
            "stage": first_q.get("stage", "TECHNICAL"),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        })

        return {
            "success": True,
            "message": f'Interview started for "{target_role}" [{round_name}] 🚀',
            "interview": serialize_doc(new_interview),
            "interviewPlan": session_init.get("interviewPlan"),
            "firstQuestion": first_q,
        }
    except Exception as e:
        print(f"[Start Interview Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

# 2. Get Current / Active Interview Session
async def get_current_session_handler(role: Optional[str], interview_id: Optional[str], user: dict) -> dict:
    try:
        user_id = user["id"]
        u_id = to_object_id(user_id)
        db = get_db()

        query: Dict[str, Any] = {"candidate": u_id}
        if interview_id:
            query["interviewId"] = interview_id
        elif role:
            query["targetRole"] = role

        interview = await db.interviews.find_one(
            {**query, "status": {"$in": ["IN_PROGRESS", "PAUSED"]}},
            sort=[("updatedAt", -1)]
        )

        if not interview:
            interview = await db.interviews.find_one(query, sort=[("updatedAt", -1)])

        if not interview:
            return {
                "success": True,
                "hasActiveSession": False,
                "interview": None
            }

        is_active = interview.get("status") in ["IN_PROGRESS", "PAUSED"]
        return {
            "success": True,
            "hasActiveSession": is_active,
            "interview": serialize_doc(interview)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

# 3. Get Specific Interview Session by ID
async def get_session_by_id_handler(session_id: str, user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        db = get_db()

        obj_id = to_object_id(session_id)
        conds = [{"interviewId": session_id}]
        if obj_id:
            conds.append({"_id": obj_id})

        interview = await db.interviews.find_one({"$or": conds, "candidate": u_id})
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Interview session not found"}
            )

        return {
            "success": True,
            "interview": serialize_doc(interview)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

# 4. Switch to a specific Round
async def switch_round_handler(data: dict, user: dict) -> dict:
    try:
        user_id = user["id"]
        u_id = to_object_id(user_id)
        db = get_db()

        interview_id = data.get("interviewId")
        target_round = data.get("round") or "ROUND_1_TECHNICAL"
        target_role = (data.get("targetRole") or "Software Development Engineer (SDE)").strip()
        skills = data.get("skills")

        interview = None
        if interview_id:
            conds = [{"interviewId": interview_id}]
            if to_object_id(interview_id):
                conds.append({"_id": to_object_id(interview_id)})
            interview = await db.interviews.find_one({"$or": conds, "candidate": u_id})

        if not interview:
            interview = await db.interviews.find_one({"candidate": u_id, "targetRole": target_role}, sort=[("updatedAt", -1)])

        active_skills = skills or (interview.get("skills") if interview else user.get("skills", ["DSA", "System Architecture", "DBMS"]))
        candidate_name = user.get("name") or (interview.get("candidateName") if interview else "Candidate")

        session_init = await initialize_interview_session(
            user_id=user_id,
            candidate_name=candidate_name,
            target_role=target_role,
            round_name=target_round,
            skills=active_skills
        )

        first_q = session_init["firstQuestion"]

        ai_msg = {
            "speaker": "AI_RECRUITER",
            "text": first_q["questionText"],
            "audioUrl": "",
            "timestamp": datetime.utcnow(),
            "duration": 12.0,
            "questionIndex": 0,
            "round": target_round,
            "stage": first_q.get("stage", "TECHNICAL"),
            "aiInsight": first_q.get("aiReasoning", ""),
        }

        if interview:
            questions = list(interview.get("questions", []))
            questions.append({
                "questionIndex": 0,
                "round": target_round,
                "stage": first_q.get("stage", "TECHNICAL"),
                "targetSkill": first_q.get("topic", ""),
                "questionText": first_q["questionText"],
                "difficulty": session_init.get("initialDifficulty", "medium"),
                "aiReasoning": first_q.get("aiReasoning", ""),
                "expectedConcepts": first_q.get("expectedConcepts", []),
                "isFollowUp": False,
                "duration": 12.0,
            })

            conv_history = list(interview.get("conversationHistory", []))
            conv_history.append(ai_msg)

            update_data = {
                "currentRound": target_round,
                "roundStatus": "IN_PROGRESS",
                "status": "IN_PROGRESS",
                "difficultyLevel": session_init.get("initialDifficulty", "medium"),
                "currentQuestionIndex": 0,
                "currentStage": first_q.get("stage", "TECHNICAL"),
                "currentQuestionText": first_q["questionText"],
                "questions": questions,
                "conversationHistory": conv_history,
                "updatedAt": datetime.utcnow()
            }
            await db.interviews.update_one({"_id": interview["_id"]}, {"$set": update_data})
            interview = await db.interviews.find_one({"_id": interview["_id"]})

        return {
            "success": True,
            "message": f"Switched to {target_round}",
            "interview": serialize_doc(interview)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

# 5. Proceed to Next Round
async def proceed_to_next_round_handler(data: dict, user: dict) -> dict:
    try:
        user_id = user["id"]
        u_id = to_object_id(user_id)
        db = get_db()
        interview_id = data.get("interviewId")

        conds = [{"interviewId": interview_id}]
        if to_object_id(interview_id):
            conds.append({"_id": to_object_id(interview_id)})

        interview = await db.interviews.find_one({"$or": conds, "candidate": u_id})
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Interview session not found"}
            )

        current_round = interview.get("currentRound", "ROUND_1_TECHNICAL")
        next_round = "ROUND_2_MANAGERIAL" if current_round == "ROUND_1_TECHNICAL" else "ROUND_3_HR"

        session_init = await initialize_interview_session(
            user_id=user_id,
            candidate_name=interview.get("candidateName", "Candidate"),
            target_role=interview.get("targetRole", "Software Development Engineer (SDE)"),
            round_name=next_round,
            skills=interview.get("skills", [])
        )

        first_q = session_init["firstQuestion"]

        questions = list(interview.get("questions", []))
        questions.append({
            "questionIndex": 0,
            "round": next_round,
            "stage": first_q.get("stage", "TECHNICAL"),
            "targetSkill": first_q.get("topic", ""),
            "questionText": first_q["questionText"],
            "difficulty": session_init.get("initialDifficulty", "medium"),
            "aiReasoning": first_q.get("aiReasoning", ""),
            "expectedConcepts": first_q.get("expectedConcepts", []),
            "isFollowUp": False,
            "duration": 12.0,
        })

        ai_msg = {
            "speaker": "AI_RECRUITER",
            "text": first_q["questionText"],
            "audioUrl": "",
            "timestamp": datetime.utcnow(),
            "duration": 12.0,
            "questionIndex": 0,
            "round": next_round,
            "stage": first_q.get("stage", "TECHNICAL"),
            "aiInsight": first_q.get("aiReasoning", ""),
        }

        conv_history = list(interview.get("conversationHistory", []))
        conv_history.append(ai_msg)

        update_data = {
            "currentRound": next_round,
            "roundStatus": "IN_PROGRESS",
            "status": "IN_PROGRESS",
            "currentQuestionIndex": 0,
            "difficultyLevel": session_init.get("initialDifficulty", "medium"),
            "currentStage": first_q.get("stage", "TECHNICAL"),
            "currentQuestionText": first_q["questionText"],
            "questions": questions,
            "conversationHistory": conv_history,
            "updatedAt": datetime.utcnow()
        }

        await db.interviews.update_one({"_id": interview["_id"]}, {"$set": update_data})
        updated_interview = await db.interviews.find_one({"_id": interview["_id"]})

        await db.conversations.insert_one({
            "interviewId": updated_interview["interviewId"],
            "targetRole": updated_interview.get("targetRole", ""),
            "user": u_id,
            "speaker": "AI_RECRUITER",
            "text": first_q["questionText"],
            "audioUrl": "",
            "timestamp": datetime.utcnow(),
            "duration": 12.0,
            "stage": first_q.get("stage", "TECHNICAL"),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        })

        return {
            "success": True,
            "message": f"Proceeded to {next_round} successfully 🚀",
            "interview": serialize_doc(updated_interview)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

# 6. Submit Candidate Answer — Core Closed-Loop Turn Execution
async def submit_answer_handler(
    interview_id: str,
    text: Optional[str],
    duration: Optional[float],
    audio_file: Optional[UploadFile],
    user: dict
) -> dict:
    try:
        user_id = user["id"]
        u_id = to_object_id(user_id)
        db = get_db()

        interview = await db.interviews.find_one({"interviewId": interview_id, "candidate": u_id})
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Interview session not found"}
            )

        audio_url = ""
        if audio_file:
            saved_audio = await save_audio_file(audio_file)
            audio_url = saved_audio["url"]

        answer_text = text or "I have worked on these concepts in my projects."
        answer_duration = float(duration) if duration is not None else (25.0 if audio_url else 15.0)
        q_index = interview.get("currentQuestionIndex", 0)
        active_round = interview.get("currentRound", "ROUND_1_TECHNICAL")

        candidate_msg = {
            "speaker": "CANDIDATE",
            "text": answer_text,
            "audioUrl": audio_url,
            "timestamp": datetime.utcnow(),
            "duration": answer_duration,
            "questionIndex": q_index,
            "round": active_round,
            "stage": interview.get("currentStage", "TECHNICAL"),
        }

        # Save in standalone Conversation collection
        await db.conversations.insert_one({
            "interviewId": interview_id,
            "targetRole": interview.get("targetRole", ""),
            "user": u_id,
            "speaker": "CANDIDATE",
            "text": answer_text,
            "audioUrl": audio_url,
            "timestamp": datetime.utcnow(),
            "duration": answer_duration,
            "stage": interview.get("currentStage", "TECHNICAL"),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        })

        # Run Turn Execution in Interview Service
        turn_result = await execute_interview_turn(
            interview=interview,
            user_id=user_id,
            answer_text=answer_text,
            duration=answer_duration,
            audio_url=audio_url
        )

        eval_record = {
            "questionIndex": q_index,
            "round": active_round,
            "questionText": interview.get("currentQuestionText", ""),
            "candidateAnswer": answer_text,
            **turn_result["evaluation"],
            "difficultyAdjusted": turn_result.get("diffAction", "maintain"),
            "evaluatedAt": datetime.utcnow()
        }

        evaluations = list(interview.get("evaluations", []))
        evaluations.append(eval_record)

        conv_history = list(interview.get("conversationHistory", []))
        conv_history.append(candidate_msg)

        questions = list(interview.get("questions", []))
        agent_reasoning = list(interview.get("agentReasoning", []))
        round_recommendations = list(interview.get("roundRecommendations", []))

        round_recommendation = None
        final_decision = interview.get("decision")
        learning_plan_id = interview.get("learningPlan")
        status_val = interview.get("status", "IN_PROGRESS")
        round_status_val = interview.get("roundStatus", "IN_PROGRESS")
        curr_q_index = q_index
        curr_stage = interview.get("currentStage", "TECHNICAL")
        curr_q_text = interview.get("currentQuestionText", "")
        end_time = interview.get("endTime")
        duration_seconds = interview.get("durationSeconds", 0)

        if turn_result.get("isRoundCompleted"):
            round_status_val = "ROUND_COMPLETED"
            round_evals = [e for e in evaluations if e.get("round") == active_round]

            round_recommendation = await generate_round_summary_recommendation(
                candidate_name=interview.get("candidateName", "Candidate"),
                target_role=interview.get("targetRole", "Software Development Engineer (SDE)"),
                round_name=active_round,
                evaluations=round_evals,
                conversation_history=conv_history
            )

            existing_idx = next((i for i, r in enumerate(round_recommendations) if r.get("round") == active_round), -1)
            if existing_idx >= 0:
                round_recommendations[existing_idx] = round_recommendation
            else:
                round_recommendations.append(round_recommendation)

            # Check if final round completed
            if active_round == "ROUND_3_HR":
                status_val = "COMPLETED"
                round_status_val = "ALL_COMPLETED"
                end_time = datetime.utcnow()
                start_time = interview.get("startTime") or datetime.utcnow()
                if isinstance(start_time, str):
                    try:
                        start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                    except Exception:
                        start_time = datetime.utcnow()
                duration_seconds = max(0, round((end_time - start_time.replace(tzinfo=None)).total_seconds()))

                final_decision = await generate_recruiter_hiring_decision(
                    candidate_name=interview.get("candidateName", "Candidate"),
                    skills=interview.get("skills", []),
                    target_role=interview.get("targetRole", "Software Development Engineer (SDE)"),
                    conversation_history=conv_history,
                    evaluations=evaluations,
                    round_recommendations=round_recommendations
                )
                final_decision["decidedAt"] = datetime.utcnow()

                if turn_result.get("learningPlan"):
                    lp = turn_result["learningPlan"]
                    learning_plan_id = to_object_id(lp.get("_id") or lp.get("id"))

        elif turn_result.get("nextQuestion"):
            next_q = turn_result["nextQuestion"]
            next_q_index = q_index + 1
            curr_q_index = next_q_index
            curr_stage = next_q.get("stage", "TECHNICAL")
            curr_q_text = next_q["questionText"]

            questions.append({
                "questionIndex": next_q_index,
                "round": active_round,
                "stage": curr_stage,
                "targetSkill": next_q.get("topic", ""),
                "questionText": next_q["questionText"],
                "difficulty": next_q.get("difficulty", "medium"),
                "aiReasoning": next_q.get("aiReasoning", ""),
                "expectedConcepts": next_q.get("expectedConcepts", []),
                "isFollowUp": bool(next_q.get("isFollowUp", False)),
                "duration": 12.0,
            })

            agent_reasoning.append({
                "questionIndex": next_q_index,
                "reason": next_q.get("aiReasoning", ""),
                "retrievedMemory": f"Evaluated previous answer score: {turn_result['evaluation'].get('overall', 7)}",
                "ragSource": next_q.get("ragSource") or next_q.get("topic", ""),
                "difficultyShift": turn_result.get("diffAction", "maintain"),
            })

            next_ai_msg = {
                "speaker": "AI_RECRUITER",
                "text": next_q["questionText"],
                "audioUrl": "",
                "timestamp": datetime.utcnow(),
                "duration": 12.0,
                "questionIndex": next_q_index,
                "round": active_round,
                "stage": curr_stage,
                "aiInsight": next_q.get("aiReasoning", ""),
            }
            conv_history.append(next_ai_msg)

            await db.conversations.insert_one({
                "interviewId": interview_id,
                "targetRole": interview.get("targetRole", ""),
                "user": u_id,
                "speaker": "AI_RECRUITER",
                "text": next_q["questionText"],
                "audioUrl": "",
                "timestamp": datetime.utcnow(),
                "duration": 12.0,
                "stage": curr_stage,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            })

        update_payload = {
            "conversationHistory": conv_history,
            "evaluations": evaluations,
            "questions": questions,
            "agentReasoning": agent_reasoning,
            "roundRecommendations": round_recommendations,
            "difficultyLevel": turn_result.get("nextDifficulty", interview.get("difficultyLevel", "medium")),
            "status": status_val,
            "roundStatus": round_status_val,
            "currentQuestionIndex": curr_q_index,
            "currentStage": curr_stage,
            "currentQuestionText": curr_q_text,
            "decision": final_decision,
            "learningPlan": learning_plan_id,
            "endTime": end_time,
            "durationSeconds": duration_seconds,
            "updatedAt": datetime.utcnow()
        }

        await db.interviews.update_one({"_id": interview["_id"]}, {"$set": update_payload})
        updated_doc = await db.interviews.find_one({"_id": interview["_id"]})

        return {
            "success": True,
            "interview": serialize_doc(updated_doc),
            "latestEvaluation": serialize_doc(eval_record),
            "nextQuestion": turn_result.get("nextQuestion"),
            "difficultyLevel": updated_doc.get("difficultyLevel"),
            "difficultyAction": turn_result.get("diffAction"),
            "roundRecommendation": round_recommendation,
            "isRoundCompleted": round_status_val in ["ROUND_COMPLETED", "ALL_COMPLETED"],
            "isCompleted": status_val == "COMPLETED",
            "decision": final_decision,
            "learningPlan": turn_result.get("learningPlan"),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Submit Answer Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": str(e)}
        )

# 7. Pause Interview
async def pause_interview_handler(data: dict, user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        interview_id = data.get("interviewId")
        db = get_db()

        interview = await db.interviews.find_one({"interviewId": interview_id, "candidate": u_id})
        if not interview:
            raise HTTPException(status_code=404, detail={"success": False, "message": "Interview not found"})

        await db.interviews.update_one({"_id": interview["_id"]}, {"$set": {"status": "PAUSED", "updatedAt": datetime.utcnow()}})
        updated = await db.interviews.find_one({"_id": interview["_id"]})

        return {"success": True, "message": "Interview paused", "interview": serialize_doc(updated)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 8. Resume Interview
async def resume_interview_handler(data: dict, user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        interview_id = data.get("interviewId")
        db = get_db()

        interview = await db.interviews.find_one({"interviewId": interview_id, "candidate": u_id})
        if not interview:
            raise HTTPException(status_code=404, detail={"success": False, "message": "Interview not found"})

        await db.interviews.update_one({"_id": interview["_id"]}, {"$set": {"status": "IN_PROGRESS", "updatedAt": datetime.utcnow()}})
        updated = await db.interviews.find_one({"_id": interview["_id"]})

        return {"success": True, "message": "Interview resumed", "interview": serialize_doc(updated)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 9. Skip Current Question
async def skip_question_handler(data: dict, user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        interview_id = data.get("interviewId")
        db = get_db()

        interview = await db.interviews.find_one({"interviewId": interview_id, "candidate": u_id})
        if not interview:
            raise HTTPException(status_code=404, detail={"success": False, "message": "Interview not found"})

        curr_idx = interview.get("currentQuestionIndex", 0)
        questions = list(interview.get("questions", []))
        if curr_idx < len(questions):
            questions[curr_idx]["isSkipped"] = True

        next_q_index = curr_idx + 1
        active_round = interview.get("currentRound", "ROUND_1_TECHNICAL")
        max_q = QUESTIONS_PER_ROUND.get(active_round, 4)

        round_status = interview.get("roundStatus", "IN_PROGRESS")
        if next_q_index >= max_q:
            round_status = "ROUND_COMPLETED"
        else:
            curr_idx = next_q_index

        await db.interviews.update_one(
            {"_id": interview["_id"]},
            {"$set": {
                "questions": questions,
                "currentQuestionIndex": curr_idx,
                "roundStatus": round_status,
                "updatedAt": datetime.utcnow()
            }}
        )
        updated = await db.interviews.find_one({"_id": interview["_id"]})

        return {"success": True, "message": "Question skipped", "interview": serialize_doc(updated)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 10. Mark Question for Review
async def mark_for_review_handler(data: dict, user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        interview_id = data.get("interviewId")
        db = get_db()

        interview = await db.interviews.find_one({"interviewId": interview_id, "candidate": u_id})
        if not interview:
            raise HTTPException(status_code=404, detail={"success": False, "message": "Interview not found"})

        curr_idx = interview.get("currentQuestionIndex", 0)
        questions = list(interview.get("questions", []))
        if curr_idx < len(questions):
            questions[curr_idx]["isReviewed"] = True

        await db.interviews.update_one(
            {"_id": interview["_id"]},
            {"$set": {"questions": questions, "updatedAt": datetime.utcnow()}}
        )
        updated = await db.interviews.find_one({"_id": interview["_id"]})

        return {"success": True, "message": "Question marked for review", "interview": serialize_doc(updated)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 11. End / Finalize Interview
async def end_interview_handler(data: dict, user: dict) -> dict:
    try:
        user_id = user["id"]
        u_id = to_object_id(user_id)
        interview_id = data.get("interviewId")
        db = get_db()

        interview = await db.interviews.find_one({"interviewId": interview_id, "candidate": u_id})
        if not interview:
            raise HTTPException(status_code=404, detail={"success": False, "message": "Interview not found"})

        end_time = datetime.utcnow()
        start_time = interview.get("startTime") or datetime.utcnow()
        if isinstance(start_time, str):
            try:
                start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            except Exception:
                start_time = datetime.utcnow()
        duration_seconds = max(0, round((end_time - start_time.replace(tzinfo=None)).total_seconds()))

        decision = await generate_recruiter_hiring_decision(
            candidate_name=interview.get("candidateName", "Candidate"),
            skills=interview.get("skills", []),
            target_role=interview.get("targetRole", "Software Development Engineer (SDE)"),
            conversation_history=interview.get("conversationHistory", []),
            evaluations=interview.get("evaluations", []),
            round_recommendations=interview.get("roundRecommendations", [])
        )
        decision["decidedAt"] = datetime.utcnow()

        # Run Career Guidance & Learning Roadmap
        weaknesses = await get_candidate_weaknesses(user_id, 10)
        coaching_result = await generate_candidate_learning_roadmap(
            candidate_id=user_id,
            interview_id=interview.get("interviewId", ""),
            target_role=interview.get("targetRole", "Software Development Engineer (SDE)"),
            evaluations=interview.get("evaluations", []),
            candidate_memories=weaknesses
        )

        lp_id = None
        if coaching_result.get("learningPlan"):
            lp = coaching_result["learningPlan"]
            lp_id = to_object_id(lp.get("_id") or lp.get("id"))

        await db.interviews.update_one(
            {"_id": interview["_id"]},
            {"$set": {
                "status": "COMPLETED",
                "endTime": end_time,
                "durationSeconds": duration_seconds,
                "decision": decision,
                "learningPlan": lp_id,
                "updatedAt": datetime.utcnow()
            }}
        )
        updated = await db.interviews.find_one({"_id": interview["_id"]})

        return {
            "success": True,
            "message": "Interview ended successfully 🎉",
            "interview": serialize_doc(updated),
            "decision": decision,
            "learningPlan": coaching_result.get("learningPlan")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 12. Get Interview History
async def get_interview_history_handler(user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        db = get_db()

        cursor = db.interviews.find({"candidate": u_id}).sort("createdAt", -1)
        interviews = [serialize_doc(i) async for i in cursor]

        # Populate learningPlan docs if present
        for doc in interviews:
            if doc.get("learningPlan") and to_object_id(doc["learningPlan"]):
                lp_doc = await db.learningplans.find_one({"_id": to_object_id(doc["learningPlan"])})
                doc["learningPlan"] = serialize_doc(lp_doc)

        return {
            "success": True,
            "interviews": interviews
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 13. Delete an Interview Session
async def delete_interview_handler(session_id: str, user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        db = get_db()

        obj_id = to_object_id(session_id)
        conds = [{"interviewId": session_id}]
        if obj_id:
            conds.append({"_id": obj_id})

        interview = await db.interviews.find_one({"$or": conds, "candidate": u_id})
        if interview:
            await db.conversations.delete_many({"interviewId": interview.get("interviewId")})
            await db.interviews.delete_one({"_id": interview["_id"]})

        remaining_cursor = db.interviews.find({"candidate": u_id}).sort("createdAt", -1)
        remaining = [serialize_doc(i) async for i in remaining_cursor]

        return {
            "success": True,
            "message": "Interview deleted successfully",
            "interviews": remaining
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 14. Clear Conversation History
async def clear_interview_conversation_handler(session_id: str, user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        db = get_db()

        obj_id = to_object_id(session_id)
        conds = [{"interviewId": session_id}, {"targetRole": session_id, "candidate": u_id}]
        if obj_id:
            conds.append({"_id": obj_id})

        interview = await db.interviews.find_one({"$or": conds, "candidate": u_id})
        if not interview:
            raise HTTPException(status_code=404, detail={"success": False, "message": "Interview not found"})

        await db.conversations.delete_many({"interviewId": interview.get("interviewId")})

        status_reset = "NOT_STARTED" if interview.get("status") == "COMPLETED" else interview.get("status")
        decision_reset = {} if interview.get("status") == "COMPLETED" else interview.get("decision", {})

        await db.interviews.update_one(
            {"_id": interview["_id"]},
            {"$set": {
                "conversationHistory": [],
                "evaluations": [],
                "agentReasoning": [],
                "currentQuestionIndex": 0,
                "status": status_reset,
                "decision": decision_reset,
                "updatedAt": datetime.utcnow()
            }}
        )
        updated = await db.interviews.find_one({"_id": interview["_id"]})

        return {
            "success": True,
            "message": "Conversation history cleared successfully",
            "interview": serialize_doc(updated)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 15. Delete Single Message
async def delete_conversation_message_handler(session_id: str, message_index: int, user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        db = get_db()

        obj_id = to_object_id(session_id)
        conds = [{"interviewId": session_id}]
        if obj_id:
            conds.append({"_id": obj_id})

        interview = await db.interviews.find_one({"$or": conds, "candidate": u_id})
        if not interview:
            raise HTTPException(status_code=400, detail={"success": False, "message": "Interview session not found"})

        conv_history = list(interview.get("conversationHistory", []))
        if message_index < 0 or message_index >= len(conv_history):
            raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid message index"})

        removed_msg = conv_history.pop(message_index)

        if removed_msg:
            await db.conversations.delete_one({
                "interviewId": interview.get("interviewId"),
                "speaker": removed_msg.get("speaker"),
                "text": removed_msg.get("text")
            })

        await db.interviews.update_one(
            {"_id": interview["_id"]},
            {"$set": {"conversationHistory": conv_history, "updatedAt": datetime.utcnow()}}
        )
        updated = await db.interviews.find_one({"_id": interview["_id"]})

        return {
            "success": True,
            "message": "Conversation message deleted successfully",
            "interview": serialize_doc(updated)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})

# 16. Get Dashboard Stats
async def get_stats_handler(user: dict) -> dict:
    try:
        u_id = to_object_id(user["id"])
        db = get_db()

        resumes_count = await db.resumes.count_documents({"user": u_id})
        completed_cursor = db.interviews.find({"candidate": u_id, "status": "COMPLETED"})
        completed_interviews = [i async for i in completed_cursor]

        total_completed = len(completed_interviews)
        avg_score = "--"
        hiring_status = "Not Started"

        if total_completed > 0:
            valid_scores = [
                i.get("decision", {}).get("overallScore")
                for i in completed_interviews
                if isinstance(i.get("decision", {}).get("overallScore"), (int, float)) and i.get("decision", {}).get("overallScore") > 0
            ]
            if valid_scores:
                avg = round(sum(valid_scores) / len(valid_scores), 1)
                avg_score = f"{avg}/10"
                hiring_status = "Strong Fit" if avg >= 8.0 else ("Moderate Fit" if avg >= 6.5 else "Needs Review")

        return {
            "success": True,
            "stats": {
                "resumes": resumes_count,
                "interviews": total_completed,
                "aiScore": avg_score,
                "hiring": hiring_status
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": str(e)})
