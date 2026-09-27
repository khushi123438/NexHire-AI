import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Sparkles,
  Loader2,
  Award,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Briefcase,
  Lock,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../Api";
import { useInterview } from "../../context/InterviewContext";
import RoundProgress, { ROUNDS_CONFIG } from "./RoundProgress";
import QuestionPanel from "./QuestionPanel";
import VoiceControls from "./VoiceControls";

export default function InterviewWorkspace() {
  const navigate = useNavigate();
  const {
    session,
    currentRole,
    confirmedSkills,
    handleSessionUpdate,
    isMuted,
    setIsMuted,
  } = useInterview();

  const [interview, setInterview] = useState(session || null);
  const [selectedRoundKey, setSelectedRoundKey] = useState("ROUND_1_TECHNICAL");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [candidateSpeechText, setCandidateSpeechText] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(90);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    setInterview(session);
    if (session?.currentRound) {
      setSelectedRoundKey(session.currentRound);
    }
  }, [session]);

  // Handle Question Countdown Timer
  useEffect(() => {
    if (
      interview &&
      interview.status === "IN_PROGRESS" &&
      interview.roundStatus !== "ROUND_COMPLETED"
    ) {
      setQuestionTimeLeft(90);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = setInterval(() => {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [interview?.currentQuestionIndex, interview?.status, interview?.roundStatus]);

  // Handle Text-to-Speech (TTS)
  const speakAIQuestion = (text) => {
    if (isMuted || !text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Natural") ||
            v.name.includes("Samantha") ||
            v.name.includes("Alex"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setIsSpeakingAI(true);
    utterance.onend = () => setIsSpeakingAI(false);
    utterance.onerror = () => setIsSpeakingAI(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (
      interview &&
      interview.status === "IN_PROGRESS" &&
      interview.roundStatus !== "ROUND_COMPLETED" &&
      interview.currentQuestionText
    ) {
      speakAIQuestion(interview.currentQuestionText);
    }
  }, [interview?.currentQuestionText, interview?.roundStatus]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        setCandidateSpeechText(transcript.trim());
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition warning:", event.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // 1. START INTERVIEW FOR SELECTED ROUND
  const handleStartRound = async (roundKey) => {
    try {
      setIsLoading(true);
      const res = await API.post("/interview/start", {
        skills: confirmedSkills,
        targetRole: currentRole,
        round: roundKey,
      });

      setInterview(res.data.interview);
      setSelectedRoundKey(roundKey);
      if (handleSessionUpdate) handleSessionUpdate(res.data.interview);

      const roundConfig = ROUNDS_CONFIG.find((r) => r.key === roundKey);
      toast.success(`Started ${roundConfig?.name || "Interview"} with AI Orchestrator 🚀`);
    } catch (err) {
      console.error("Start interview error:", err);
      toast.error(err.response?.data?.message || "Failed to start round");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. SWITCH ROUND
  const handleSwitchRound = async (roundKey) => {
    setSelectedRoundKey(roundKey);
    if (!interview) return;

    try {
      setIsLoading(true);
      const res = await API.post("/interview/switch-round", {
        interviewId: interview.interviewId,
        round: roundKey,
        targetRole: currentRole,
        skills: confirmedSkills,
      });

      setInterview(res.data.interview);
      if (handleSessionUpdate) handleSessionUpdate(res.data.interview);
      toast(`Switched to ${ROUNDS_CONFIG.find((r) => r.key === roundKey)?.name} 🎯`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to switch round");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. PROCEED TO NEXT ROUND
  const handleProceedToNextRound = async () => {
    if (!interview) return;
    try {
      setIsLoading(true);
      const res = await API.post("/interview/proceed-round", {
        interviewId: interview.interviewId,
      });

      setInterview(res.data.interview);
      if (res.data.interview.currentRound) {
        setSelectedRoundKey(res.data.interview.currentRound);
      }
      if (handleSessionUpdate) handleSessionUpdate(res.data.interview);
      toast.success(res.data.message || "Proceeded to next round 🚀");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to proceed to next round");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. START RECORDING AUDIO
  const handleStartRecording = async () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeakingAI(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setCandidateSpeechText("");
      setRecordingSeconds(0);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone access denied. You can still type your answer.");
    }
  };

  // 5. STOP RECORDING & SUBMIT ANSWER
  const handleStopAndSubmit = () => {
    if (!isRecording) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        submitCandidateAnswer(audioBlob, candidateSpeechText, recordingSeconds);
        mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      };
    } else {
      submitCandidateAnswer(null, candidateSpeechText, recordingSeconds);
    }

    setIsRecording(false);
  };

  const submitCandidateAnswer = async (audioBlob, textAnswer, durationSec) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("interviewId", interview.interviewId);
      formData.append("text", textAnswer || "I have implemented these architecture principles in production.");
      formData.append("duration", durationSec || 15);

      if (audioBlob) {
        formData.append("audio", audioBlob, `answer_${Date.now()}.webm`);
      }

      const res = await API.post("/interview/answer", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInterview(res.data.interview);
      if (handleSessionUpdate) handleSessionUpdate(res.data.interview);
      setCandidateSpeechText("");

      if (res.data.isRoundCompleted) {
        toast.success(`Round completed! Review your assessment and next strategy below 🏆`, {
          duration: 4000,
        });
      } else {
        const diffAction = res.data.difficultyAction;
        if (diffAction === "increase") {
          toast.success("Strong response! Difficulty dynamically scaled up 📈");
        } else if (diffAction === "remediate") {
          toast("Adaptive follow-up question generated for concept practice 🔄", { icon: "💡" });
        } else {
          toast.success("Answer evaluated! Next question loaded 💡");
        }
      }
    } catch (err) {
      console.error("Submit answer error:", err);
      toast.error(err.response?.data?.message || "Failed to submit answer");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. PAUSE / RESUME INTERVIEW
  const handleTogglePause = async () => {
    if (!interview) return;
    try {
      if (interview.status === "PAUSED") {
        const res = await API.post("/interview/resume", {
          interviewId: interview.interviewId,
        });
        setInterview(res.data.interview);
        if (handleSessionUpdate) handleSessionUpdate(res.data.interview);
        toast.success("Interview resumed ▶️");
      } else {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsSpeakingAI(false);
        const res = await API.post("/interview/pause", {
          interviewId: interview.interviewId,
        });
        setInterview(res.data.interview);
        if (handleSessionUpdate) handleSessionUpdate(res.data.interview);
        toast("Interview paused ⏸️");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update interview state");
    }
  };

  // 7. SKIP QUESTION
  const handleSkipQuestion = async () => {
    if (!interview) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    try {
      setIsLoading(true);
      const res = await API.post("/interview/skip", {
        interviewId: interview.interviewId,
      });
      setInterview(res.data.interview);
      if (handleSessionUpdate) handleSessionUpdate(res.data.interview);
      toast("Question skipped ⏩");
    } catch (err) {
      console.error(err);
      toast.error("Failed to skip question");
    } finally {
      setIsLoading(false);
    }
  };

  // 8. MARK FOR REVIEW
  const handleMarkReview = async () => {
    if (!interview) return;
    try {
      await API.post("/interview/mark-review", {
        interviewId: interview.interviewId,
      });
      toast.success("Question flagged for review 🚩");
    } catch (err) {
      console.error(err);
    }
  };

  // 9. END INTERVIEW
  const handleEndInterview = async () => {
    if (!interview) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (!window.confirm("Finalize interview and generate full hiring report?")) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await API.post("/interview/end", {
        interviewId: interview.interviewId,
      });
      setInterview(res.data.interview);
      if (handleSessionUpdate) handleSessionUpdate(res.data.interview);
      toast.success("Interview finalized! Review your report 🎯");
      navigate("/interview/report");
    } catch (err) {
      console.error(err);
      toast.error("Failed to end interview");
    } finally {
      setIsLoading(false);
    }
  };

  const hasSkills = confirmedSkills && confirmedSkills.length > 0;
  const activeRoleDisplay = interview?.targetRole || currentRole;
  const activeRoundKey = interview?.currentRound || selectedRoundKey;
  const activeRoundConfig =
    ROUNDS_CONFIG.find((r) => r.key === activeRoundKey) || ROUNDS_CONFIG[0];
  const activeDifficulty = interview?.difficultyLevel || "medium";

  const currentQObj = interview?.questions?.[interview?.currentQuestionIndex] || null;
  const currentAiReasoning =
    currentQObj?.aiReasoning ||
    interview?.agentReasoning?.[interview?.currentQuestionIndex]?.reason ||
    "";

  const currentRoundRecommendation = (interview?.roundRecommendations || []).find(
    (r) => r.round === activeRoundKey
  );
  const isCurrentRoundCompleted =
    interview?.roundStatus === "ROUND_COMPLETED" ||
    (currentRoundRecommendation &&
      interview?.currentQuestionIndex >= activeRoundConfig.maxQuestions);

  // VIEW 1: NOT STARTED / IDLE STATE
  if (!interview || interview.status === "NOT_STARTED") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Round Overview */}
        <div className="lg:col-span-1 bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
          <RoundProgress
            activeRoundKey={selectedRoundKey}
            onSwitchRound={(key) => setSelectedRoundKey(key)}
            roundRecommendations={[]}
            currentQuestionIndex={0}
          />
        </div>

        {/* Right: Round Launch Stage */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-400">
                  <Mic size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {ROUNDS_CONFIG.find((r) => r.key === selectedRoundKey)?.name}
                  </h2>
                  <p className="text-xs text-yellow-400/90 font-medium">
                    Target Role: {activeRoleDisplay}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  hasSkills
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    : "bg-white/[0.04] text-gray-400 border-white/10"
                }`}
              >
                {hasSkills ? "Ready to Launch" : "Upload Resume First"}
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 text-center flex flex-col items-center justify-center min-h-[220px]">
              <div className="h-14 w-14 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                {hasSkills ? <Sparkles size={24} /> : <Lock size={22} />}
              </div>

              <h3 className="text-base font-bold text-white">
                {hasSkills
                  ? `Launch AI Session: ${ROUNDS_CONFIG.find((r) => r.key === selectedRoundKey)?.shortName}`
                  : "Upload Resume to Unlock Role-Specific Rounds"}
              </h3>

              <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                {hasSkills
                  ? "The AI Interview Supervisor will retrieve role-tailored technical questions from the RAG store, evaluate your answers using the 5-factor rubric, and dynamically adjust difficulty."
                  : `Please confirm skills for "${activeRoleDisplay}" in the Resumes section to begin.`}
              </p>

              {!hasSkills && (
                <button
                  type="button"
                  onClick={() => navigate("/resumes")}
                  className="mt-2 px-4 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-bold text-xs hover:bg-yellow-500/25 transition flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={14} />
                  <span>Go to Resume Manager</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleStartRound(selectedRoundKey)}
            disabled={!hasSkills || isLoading}
            className={`w-full py-4 rounded-2xl font-extrabold text-sm md:text-base transition flex items-center justify-center gap-3 ${
              !hasSkills
                ? "bg-white/[0.04] border border-white/10 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black hover:scale-[1.01] shadow-[0_0_30px_rgba(255,215,0,0.35)]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Orchestrating Round...</span>
              </>
            ) : !hasSkills ? (
              <>
                <Lock size={18} />
                <span>Upload Resume to Unlock</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span>Start {ROUNDS_CONFIG.find((r) => r.key === selectedRoundKey)?.shortName}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // VIEW 2: ACTIVE SESSION
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left: Round progress navigation */}
      <div className="lg:col-span-1 bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
        <RoundProgress
          activeRoundKey={activeRoundKey}
          onSwitchRound={handleSwitchRound}
          roundRecommendations={interview.roundRecommendations || []}
          currentQuestionIndex={interview.currentQuestionIndex || 0}
        />

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
          <p className="text-gray-400">
            Session ID: <strong className="text-gray-200 font-mono">{interview.interviewId}</strong>
          </p>
          <p className="text-gray-400">
            Role: <strong className="text-yellow-400">{activeRoleDisplay}</strong>
          </p>
        </div>
      </div>

      {/* Right: Question, Voice Controls OR Round Completion Card */}
      <div className="lg:col-span-2 space-y-6">
        {isCurrentRoundCompleted && currentRoundRecommendation ? (
          /* Round Completed Summary Card */
          <div className="bg-[#0A0A0A] border border-yellow-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center">
                  <Award size={26} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {currentRoundRecommendation.title}
                  </h3>
                  <p className="text-xs text-green-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={14} />
                    {currentRoundRecommendation.passed
                      ? "Recommended to Proceed to Next Round"
                      : "Round Completed"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-black text-yellow-400 font-mono">
                  {currentRoundRecommendation.score}/10
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-mono">Round Score</p>
              </div>
            </div>

            {/* AI Round Feedback */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed italic">
                "{currentRoundRecommendation.keyFeedback}"
              </p>

              {currentRoundRecommendation.strengths && (
                <div className="flex items-start gap-2 text-xs text-green-400">
                  <TrendingUp size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Strengths: </strong>
                    {currentRoundRecommendation.strengths}
                  </span>
                </div>
              )}

              {currentRoundRecommendation.areasToImprove && (
                <div className="flex items-start gap-2 text-xs text-orange-400">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Areas to Polish: </strong>
                    {currentRoundRecommendation.areasToImprove}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {activeRoundKey !== "ROUND_3_HR" ? (
                <button
                  type="button"
                  onClick={handleProceedToNextRound}
                  disabled={isLoading}
                  className="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-extrabold text-xs md:text-sm hover:scale-[1.01] transition flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,215,0,0.3)]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <span>
                        Proceed to {activeRoundKey === "ROUND_1_TECHNICAL" ? "Round 2: Managerial" : "Round 3: HR Discussion"}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/interview/report")}
                  disabled={isLoading}
                  className="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-600 text-black font-extrabold text-xs md:text-sm hover:scale-[1.01] transition flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                >
                  <Award size={16} />
                  <span>View Official Hiring Report & Decision</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleStartRound(activeRoundKey)}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#141414] border border-white/10 text-gray-300 hover:text-white hover:border-yellow-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw size={14} />
                <span>Retake Round</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Question & Voice Controls */
          <>
            <QuestionPanel
              questionText={interview.currentQuestionText}
              questionIndex={interview.currentQuestionIndex || 0}
              maxQuestions={activeRoundConfig.maxQuestions}
              roundName={activeRoundConfig.name}
              difficulty={activeDifficulty}
              isSpeakingAI={isSpeakingAI}
              isRecording={isRecording}
              status={interview.status}
              timeLeft={questionTimeLeft}
              aiReasoning={currentAiReasoning}
              onReplayVoice={() => speakAIQuestion(interview.currentQuestionText)}
            />

            <VoiceControls
              isRecording={isRecording}
              isLoading={isLoading}
              status={interview.status}
              recordingSeconds={recordingSeconds}
              speechTranscript={candidateSpeechText}
              isMuted={isMuted}
              onStartRecording={handleStartRecording}
              onStopAndSubmit={handleStopAndSubmit}
              onTogglePause={handleTogglePause}
              onSkipQuestion={handleSkipQuestion}
              onMarkReview={handleMarkReview}
              onEndInterview={handleEndInterview}
              onToggleMute={() => {
                setIsMuted(!isMuted);
                if (!isMuted && window.speechSynthesis) window.speechSynthesis.cancel();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
