"""
Agent 3: Interviewer Agent
Manages conversational persona, spoken delivery, pacing, and round context
"""

def get_interviewer_persona(round: str = "ROUND_1_TECHNICAL", candidate_name: str = "Candidate", target_role: str = "Software Engineer") -> dict:
    if round == "ROUND_2_MANAGERIAL":
        return {
            "roleTitle": "Senior Engineering Manager & Team Lead",
            "roundName": "Round 2: Managerial & Behavioral Round",
            "greeting": f"Welcome to the Managerial Round, {candidate_name}. Let's discuss collaboration, ownership, and practical engineering trade-offs.",
            "tone": "Collaborative, situational, probing STAR framework responses.",
        }
    elif round == "ROUND_3_HR":
        return {
            "roleTitle": "Head of Talent & Culture",
            "roundName": "Round 3: HR & Culture Fit Discussion",
            "greeting": f"Hello {candidate_name}, welcome to the final HR Discussion Round. Let's talk about your career aspirations, compensation, and team culture alignment.",
            "tone": "Warm, professional, thorough, evaluating long-term organizational fit.",
        }
    else:
        # ROUND_1_TECHNICAL
        return {
            "roleTitle": "Principal Software Engineer & Bar Raiser",
            "roundName": "Round 1: Technical & Skills Assessment",
            "greeting": f"Welcome to the Technical Interview, {candidate_name}. We will explore core engineering concepts, architecture, and practical problem-solving for {target_role}.",
            "tone": "Insightful, rigorous, focused on concrete code reasoning and edge cases.",
        }
