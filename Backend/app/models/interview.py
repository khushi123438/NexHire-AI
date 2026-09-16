from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

class ConversationMessage(BaseModel):
    speaker: str # "AI_RECRUITER", "CANDIDATE"
    text: str
    audioUrl: str = ""
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    duration: float = 0.0
    questionIndex: int = 0
    round: str = "ROUND_1_TECHNICAL"
    stage: str = "TECHNICAL"
    aiInsight: str = ""

class Evaluation(BaseModel):
    questionIndex: Optional[int] = 0
    round: str = "ROUND_1_TECHNICAL"
    questionText: Optional[str] = ""
    candidateAnswer: Optional[str] = ""
    # 5-Factor Rubric
    correctness: float = 8.0
    technicalDepth: float = 7.5
    relevance: float = 8.0
    clarity: float = 8.0
    completeness: float = 7.0
    overall: float = 8.0
    missingConcepts: List[str] = []
    # Backward compatibility
    technicalAccuracy: float = 8.0
    communication: float = 8.0
    confidence: float = 8.0
    examplesUsed: float = 7.5
    strengths: str = ""
    areasToImprove: str = ""
    feedback: str = ""
    difficultyAdjusted: str = "maintain"
    evaluatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

class RoundRecommendation(BaseModel):
    round: str
    title: str = "Round Assessment"
    passed: bool = True
    proceedToNext: bool = True
    score: float = 8.0
    keyFeedback: str = ""
    strengths: str = ""
    areasToImprove: str = ""
    recommendedNextRound: str = "ROUND_2_MANAGERIAL"
    evaluatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

class QuestionItem(BaseModel):
    questionIndex: int = 0
    round: str = "ROUND_1_TECHNICAL"
    stage: Optional[str] = "TECHNICAL"
    targetSkill: Optional[str] = ""
    questionText: str
    difficulty: str = "medium"
    aiReasoning: str = ""
    expectedConcepts: List[str] = []
    isFollowUp: bool = False
    isSkipped: bool = False
    isReviewed: bool = False
    aiAudioUrl: Optional[str] = None
    duration: Optional[float] = 12.0

class AgentReasoningItem(BaseModel):
    questionIndex: Optional[int] = 0
    reason: Optional[str] = ""
    retrievedMemory: Optional[str] = ""
    ragSource: Optional[str] = ""
    difficultyShift: Optional[str] = ""

class InterviewPlan(BaseModel):
    topics: List[str] = []
    distribution: Dict[str, Any] = {}
    strategy: str = "Balanced adaptive assessment based on candidate profile and weak areas."
    expectedQuestionCount: int = 10

class InterviewDecision(BaseModel):
    recommendation: str = ""
    fitBadge: str = "Strong Fit"
    technicalFit: float = 0.0
    communicationFit: float = 0.0
    culturalFit: float = 0.0
    overallHiringConfidence: float = 0.0
    overallScore: float = 0.0
    recruiterRemarks: Optional[str] = ""
    remarks: Optional[str] = ""
    weaknessHighlights: List[str] = []
    strengthsHighlights: List[str] = []
    decidedAt: Optional[datetime] = None

class Interview(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    interviewId: str
    candidate: Any # ObjectId or str
    candidateName: str = "Candidate"
    skills: List[str] = []
    targetRole: str = "Software Engineer / SDE"
    currentRound: str = "ROUND_1_TECHNICAL"
    difficultyLevel: str = "medium"
    roundStatus: str = "NOT_STARTED"
    status: str = "NOT_STARTED"
    currentQuestionIndex: int = 0
    currentStage: str = "TECHNICAL"
    currentQuestionText: str = ""
    interviewPlan: Optional[InterviewPlan] = Field(default_factory=InterviewPlan)
    agentReasoning: List[AgentReasoningItem] = []
    questions: List[QuestionItem] = []
    conversationHistory: List[ConversationMessage] = []
    evaluations: List[Evaluation] = []
    roundRecommendations: List[RoundRecommendation] = []
    learningPlan: Optional[Any] = None # ObjectId ref LearningPlan
    decision: Optional[InterviewDecision] = Field(default_factory=InterviewDecision)
    startTime: Optional[datetime] = Field(default_factory=datetime.utcnow)
    endTime: Optional[datetime] = None
    durationSeconds: float = 0.0
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
