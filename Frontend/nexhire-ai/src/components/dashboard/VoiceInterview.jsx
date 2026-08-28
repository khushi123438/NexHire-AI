import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Pause,
  Play,
  SkipForward,
  Square,
  Clock,
  Volume2,
  VolumeX,
  Bookmark,
  Sparkles,
  Loader2,
  Send,
  Lock,
  Briefcase,
  Plus,
  Code,
  Users,
  Award,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../Api";

const ROUNDS_CONFIG = [
  {
    key: "ROUND_1_TECHNICAL",
    name: "Round 1: Technical & Skill-Based",
    shortName: "Round 1: Technical",
    icon: Code,
    description: "Deep dive into core subjects, programming, architecture & resume projects.",
    badgeColor: "from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-300",
    activeColor: "bg-cyan-500/20 border-cyan-400 text-cyan-300",
    maxQuestions: 4,
  },
  {
    key: "ROUND_2_MANAGERIAL",
    name: "Round 2: Managerial & Behavioral",
    shortName: "Round 2: Managerial",
    icon: Users,
    description: "STAR method behavioral questions on teamwork, production outages & ownership.",
    badgeColor: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300",
    activeColor: "bg-purple-500/20 border-purple-400 text-purple-300",
    maxQuestions: 3,
  },
  {
    key: "ROUND_3_HR",
    name: "Round 3: HR Discussion",
    shortName: "Round 3: HR Round",
    icon: Briefcase,
    description: "Salary expectations, culture fit check, company policies & career roadmap.",
    badgeColor: "from-green-500/20 to-emerald-500/20 border-emerald-500/30 text-emerald-300",
    activeColor: "bg-emerald-500/20 border-emerald-400 text-emerald-300",
    maxQuestions: 3,
  },
];

export default function VoiceInterview({
  session,
  confirmedSkills = [],
  targetRole = "Software Development Engineer (SDE)",
  onSessionUpdate,
  onStartNewRole,
}) {
  const [interview, setInterview] = useState(session || null);
  const [selectedRoundKey, setSelectedRoundKey] = useState("ROUND_1_TECHNICAL");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [candidateSpeechText, setCandidateSpeechText] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(90);
  const [isMuted, setIsMuted] = useState(false);

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

  // Handle Question Timer
  useEffect(() => {
    if (interview && interview.status === "IN_PROGRESS" && interview.roundStatus !== "ROUND_COMPLETED") {
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

  // Handle Text-to-Speech
  const speakAIQuestion = (text) => {
    if (isMuted || !text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
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
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCandidateSpeechText(transcript);
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition notice:", err);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 1. START INTERVIEW FOR SELECTED ROUND
  const handleStartRound = async (roundKey = selectedRoundKey) => {
    if (!confirmedSkills || confirmedSkills.length === 0) {
      toast.error("Please upload your resume and confirm skills for this role first!");
      return;
    }

    try {
      setIsLoading(true);
      const res = await API.post("/interview/start", {
        skills: confirmedSkills,
        targetRole,
        round: roundKey,
      });

      setInterview(res.data.interview);
      setSelectedRoundKey(roundKey);
      if (onSessionUpdate) onSessionUpdate(res.data.interview);
      toast.success(`${roundKey === "ROUND_1_TECHNICAL" ? "Round 1: Technical Interview" : roundKey === "ROUND_2_MANAGERIAL" ? "Round 2: Managerial Round" : "Round 3: HR Discussion"} started! 🎙️`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to start interview round");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. SWITCH OR DIRECTLY JUMP TO A SPECIFIC ROUND
  const handleSwitchRound = async (roundKey) => {
    setSelectedRoundKey(roundKey);
    if (!interview) {
      handleStartRound(roundKey);
      return;
    }

    try {
      setIsLoading(true);
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      const res = await API.post("/interview/switch-round", {
        interviewId: interview.interviewId || interview._id,
        round: roundKey,
        targetRole,
        skills: confirmedSkills,
      });

      setInterview(res.data.interview);
      if (onSessionUpdate) onSessionUpdate(res.data.interview);
      toast.success(`Switched to ${roundKey.replace(/_/g, " ")} 🎯`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to switch round");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. PROCEED TO NEXT ROUND (GATED TRANSITION)
  const handleProceedToNextRound = async () => {
    if (!interview) return;
    try {
      setIsLoading(true);
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      const res = await API.post("/interview/proceed-round", {
        interviewId: interview.interviewId || interview._id,
      });

      setInterview(res.data.interview);
      if (res.data.interview.currentRound) {
        setSelectedRoundKey(res.data.interview.currentRound);
      }
      if (onSessionUpdate) onSessionUpdate(res.data.interview);
      toast.success(`Promoted to ${res.data.interview.currentRound}! Welcome 🚀`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to proceed to next round");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. TOGGLE RECORDING
  const handleStartRecording = async () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeakingAI(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      setRecordingSeconds(0);
      setCandidateSpeechText("");

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      toast("Recording your answer... Speak clearly 🎙️", { icon: "🎤" });
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone access denied. Please allow microphone in browser.");
      setIsRecording(true);
    }
  };

  // 5. STOP RECORDING & SUBMIT ANSWER
  const handleStopAndSubmit = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    const recordedDuration = recordingSeconds || 15;
    const finalTranscript =
      candidateSpeechText.trim() ||
      "I have worked on this during my technical projects and understand the core architecture.";

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("interviewId", interview.interviewId);
      formData.append("text", finalTranscript);
      formData.append("duration", recordedDuration);

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        formData.append("audio", audioBlob, `candidate-answer-${Date.now()}.webm`);
      }

      const res = await API.post("/interview/answer", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInterview(res.data.interview);
      if (onSessionUpdate) onSessionUpdate(res.data.interview);
      setCandidateSpeechText("");

      if (res.data.isRoundCompleted) {
        toast.success(`Round assessment generated! Check your recommendation below 🏆`, { duration: 4000 });
      } else {
        toast.success("Answer evaluated by AI! Next question loaded 💡");
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
        if (onSessionUpdate) onSessionUpdate(res.data.interview);
        toast.success("Interview resumed ▶️");
      } else {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsSpeakingAI(false);
        const res = await API.post("/interview/pause", {
          interviewId: interview.interviewId,
        });
        setInterview(res.data.interview);
        if (onSessionUpdate) onSessionUpdate(res.data.interview);
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
      if (onSessionUpdate) onSessionUpdate(res.data.interview);
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
    if (!window.confirm("Are you sure you want to finalize the interview and generate your complete AI Recruiter Decision?")) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await API.post("/interview/end", {
        interviewId: interview.interviewId,
      });
      setInterview(res.data.interview);
      if (onSessionUpdate) onSessionUpdate(res.data.interview);
      toast.success("Interview completed! Recruiter Decision generated 🎯");
    } catch (err) {
      console.error(err);
      toast.error("Failed to end interview");
    } finally {
      setIsLoading(false);
    }
  };

  const hasSkills = confirmedSkills && confirmedSkills.length > 0;
  const activeRoleDisplay = interview?.targetRole || targetRole;
  const activeRoundKey = interview?.currentRound || selectedRoundKey;
  const activeRoundConfig = ROUNDS_CONFIG.find((r) => r.key === activeRoundKey) || ROUNDS_CONFIG[0];

  // Check if current round has a completed recommendation
  const currentRoundRecommendation = (interview?.roundRecommendations || []).find(
    (r) => r.round === activeRoundKey
  );
  const isCurrentRoundCompleted = interview?.roundStatus === "ROUND_COMPLETED" || (currentRoundRecommendation && interview?.currentQuestionIndex >= activeRoundConfig.maxQuestions);

  // Render NOT STARTED view
  if (!interview || interview.status === "NOT_STARTED") {
    return (
      <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Mic className="text-yellow-400" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Realistic 3-Round AI Interview</h2>
                <p className="text-xs text-yellow-400/80 font-semibold flex items-center gap-1">
                  <Briefcase size={12} /> Target Role: {activeRoleDisplay}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                hasSkills
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-white/[0.05] text-gray-400 border-white/10"
              }`}
            >
              {hasSkills ? "Ready for Rounds" : "Locked (Upload Resume)"}
            </span>
          </div>

          {/* 3-Round Selection Stepper Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-5">
            {ROUNDS_CONFIG.map((r, idx) => {
              const isSelected = selectedRoundKey === r.key;
              const Icon = r.icon;
              return (
                <div
                  key={r.key}
                  onClick={() => setSelectedRoundKey(r.key)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? "bg-yellow-500/15 border-yellow-400 text-white shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                      : "bg-[#0A0A0A] border-yellow-500/10 text-gray-400 hover:border-yellow-500/30 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Icon size={15} className={isSelected ? "text-yellow-400" : "text-gray-500"} />
                      <span>{r.shortName}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5">
                      R{idx + 1}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-yellow-500/10 text-center flex flex-col items-center justify-center min-h-[190px]">
            <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3 border border-yellow-500/30 shadow-[0_0_25px_rgba(255,215,0,0.15)]">
              {hasSkills ? (
                <Sparkles className="text-yellow-400" size={28} />
              ) : (
                <Lock className="text-gray-400" size={24} />
              )}
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {hasSkills
                ? `Ready for ${ROUNDS_CONFIG.find((r) => r.key === selectedRoundKey)?.name}?`
                : "Upload Resume to Unlock Realistic Rounds"}
            </h3>
            <p className="text-gray-400 text-xs max-w-md mb-2 leading-relaxed">
              {hasSkills
                ? `AI Senior Interviewer will conduct a realistic, high-impact ${selectedRoundKey.replace(/_/g, " ")} tailored to your skills (${confirmedSkills.slice(0, 4).join(", ")}) and provide personalized promotion recommendations.`
                : `Please select or upload your resume for "${activeRoleDisplay}" in the Resume panel on the left to begin.`}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={() => handleStartRound(selectedRoundKey)}
            disabled={!hasSkills || isLoading}
            className={`w-full py-4 rounded-xl font-extrabold text-sm md:text-base transition flex items-center justify-center gap-3 ${
              !hasSkills
                ? "bg-white/[0.05] border border-white/10 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(255,215,0,0.35)]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Starting Round...
              </>
            ) : !hasSkills ? (
              <>
                <Lock size={18} /> Upload Resume to Unlock
              </>
            ) : (
              <>
                <Mic size={20} /> Start {ROUNDS_CONFIG.find((r) => r.key === selectedRoundKey)?.name}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Active or Completed Interview View
  return (
    <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Mic className="text-yellow-400" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{activeRoleDisplay}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-mono">
                  {interview.interviewId}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {activeRoundConfig.name} • Question {Math.min(interview.currentQuestionIndex + 1, activeRoundConfig.maxQuestions)} of {activeRoundConfig.maxQuestions}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted && window.speechSynthesis) window.speechSynthesis.cancel();
              }}
              title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              className="p-2 rounded-xl bg-white/[0.05] border border-yellow-500/20 text-gray-300 hover:text-yellow-400"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                interview.status === "COMPLETED" || interview.roundStatus === "ALL_COMPLETED"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : interview.roundStatus === "ROUND_COMPLETED"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : interview.status === "PAUSED"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse"
              }`}
            >
              {interview.status === "COMPLETED" || interview.roundStatus === "ALL_COMPLETED"
                ? "Offer Stage"
                : interview.roundStatus === "ROUND_COMPLETED"
                ? "Round Done"
                : interview.status === "PAUSED"
                ? "Paused"
                : "Live"}
            </span>
          </div>
        </div>

        {/* 3-Round Interactive Switcher Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {ROUNDS_CONFIG.map((r, idx) => {
            const isCurrentActive = activeRoundKey === r.key;
            const roundRec = (interview.roundRecommendations || []).find((rec) => rec.round === r.key);
            const isCompleted = !!roundRec;
            const Icon = r.icon;

            return (
              <div
                key={r.key}
                onClick={() => handleSwitchRound(r.key)}
                className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isCurrentActive
                    ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                    : isCompleted
                    ? "bg-green-500/10 border-green-500/30 text-green-300"
                    : "bg-[#0A0A0A] border-yellow-500/10 text-gray-400 hover:border-yellow-500/30 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Icon size={13} className={isCurrentActive ? "text-yellow-400" : isCompleted ? "text-green-400" : "text-gray-500"} />
                    <span className="truncate">{r.shortName}</span>
                  </div>
                  {isCompleted && <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />}
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400">R{idx + 1}</span>
                  {roundRec ? (
                    <span className="font-bold text-green-400 font-mono">
                      {roundRec.score}/10
                    </span>
                  ) : (
                    <span className={isCurrentActive ? "text-yellow-400 font-semibold" : "text-gray-500"}>
                      {isCurrentActive ? "Active" : "Practice"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* IF CURRENT ROUND IS COMPLETED: DISPLAY PERSONALIZED ROUND RECOMMENDATION CARD */}
        {isCurrentRoundCompleted && currentRoundRecommendation ? (
          <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-yellow-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-white">
                    {currentRoundRecommendation.title}
                  </h3>
                  <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    {currentRoundRecommendation.passed ? "Recommended to Proceed to Next Round" : "Needs Further Practice"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-yellow-400 font-mono">
                  {currentRoundRecommendation.score}/10
                </p>
                <p className="text-[10px] text-gray-400">Round Score</p>
              </div>
            </div>

            {/* AI Round Feedback */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <p className="text-xs text-gray-200 leading-relaxed">
                "{currentRoundRecommendation.keyFeedback}"
              </p>

              {currentRoundRecommendation.strengths && (
                <div className="flex items-start gap-1.5 text-xs text-green-400">
                  <TrendingUp size={14} className="flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Strengths:</strong> {currentRoundRecommendation.strengths}</span>
                </div>
              )}

              {currentRoundRecommendation.areasToImprove && (
                <div className="flex items-start gap-1.5 text-xs text-orange-400">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Areas to Polish:</strong> {currentRoundRecommendation.areasToImprove}</span>
                </div>
              )}
            </div>

            {/* Next Step Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              {activeRoundKey !== "ROUND_3_HR" ? (
                <button
                  onClick={handleProceedToNextRound}
                  disabled={isLoading}
                  className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-extrabold text-xs md:text-sm hover:scale-[1.02] transition flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,215,0,0.3)]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <span>Proceed to {activeRoundKey === "ROUND_1_TECHNICAL" ? "Round 2: Managerial" : "Round 3: HR Discussion"}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleEndInterview}
                  disabled={isLoading}
                  className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 text-black font-extrabold text-xs md:text-sm hover:scale-[1.02] transition flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                >
                  <Award size={16} />
                  <span>View Final Hiring Offer & Decision</span>
                </button>
              )}

              <button
                onClick={() => handleStartRound(activeRoundKey)}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#141414] border border-yellow-500/20 text-gray-300 hover:text-white hover:border-yellow-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw size={14} />
                <span>Retake Round</span>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE QUESTION & VOICE ENGINE CONTAINER */
          <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-yellow-500/10 relative overflow-hidden">
            {/* Status Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isSpeakingAI
                      ? "bg-green-400 animate-ping"
                      : isRecording
                      ? "bg-red-500 animate-pulse"
                      : "bg-yellow-400"
                  }`}
                />
                <span
                  className={`font-semibold text-xs md:text-sm ${
                    isSpeakingAI
                      ? "text-green-400"
                      : isRecording
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {isSpeakingAI
                    ? "AI Senior Interviewer Speaking..."
                    : isRecording
                    ? `Recording Answer (${formatTime(recordingSeconds)})`
                    : interview.status === "PAUSED"
                    ? "Interview Paused"
                    : "Listening / Ready"}
                </span>
              </div>

              {/* Live Question Timer */}
              <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/[0.05] border border-yellow-500/20 text-yellow-300">
                <Clock size={13} className="text-yellow-400" />
                <span>{formatTime(questionTimeLeft)}</span>
              </div>
            </div>

            {/* Current Question Text */}
            <div className="mb-3.5">
              <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
                {interview.currentQuestionText ||
                  "Tell me about yourself and your technical experience."}
              </h3>
            </div>

            {/* Replay AI Voice */}
            <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-white/5">
              <button
                onClick={() => speakAIQuestion(interview.currentQuestionText)}
                className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 transition"
              >
                <Volume2 size={13} /> Replay AI Voice
              </button>
              <span className="text-xs text-gray-500 font-medium">
                {activeRoundConfig.shortName}
              </span>
            </div>

            {/* Live Transcript / Spoken Preview */}
            {isRecording && (
              <div className="mb-5 p-3.5 rounded-xl bg-yellow-500/[0.04] border border-yellow-500/20">
                <p className="text-xs text-yellow-400 mb-1 font-semibold flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Live Speech Transcript:
                </p>
                <p className="text-xs text-gray-200 italic">
                  {candidateSpeechText || "Speak now into your microphone..."}
                </p>
              </div>
            )}

            {/* Center Voice Controls (Mic Button) */}
            <div className="flex justify-center items-center gap-4 mb-5">
              <button
                onClick={handleTogglePause}
                disabled={interview.status === "COMPLETED"}
                title={interview.status === "PAUSED" ? "Resume" : "Pause"}
                className="h-11 w-11 rounded-full bg-[#141414] border border-yellow-500/20 flex items-center justify-center hover:border-yellow-400 transition text-white disabled:opacity-30"
              >
                {interview.status === "PAUSED" ? <Play size={18} /> : <Pause size={18} />}
              </button>

              {/* Mic Record / Submit Toggle Button */}
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={isLoading || interview.status === "COMPLETED" || interview.status === "PAUSED"}
                  className="h-18 w-18 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_35px_rgba(255,215,0,0.45)] hover:scale-105 transition disabled:opacity-40 group"
                >
                  <Mic className="text-black group-hover:scale-110 transition" size={28} />
                </button>
              ) : (
                <button
                  onClick={handleStopAndSubmit}
                  disabled={isLoading}
                  className="h-18 w-18 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_35px_rgba(239,68,68,0.45)] hover:scale-105 transition animate-pulse"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-white" size={28} />
                  ) : (
                    <Send className="text-white" size={26} />
                  )}
                </button>
              )}

              <button
                onClick={handleSkipQuestion}
                disabled={isLoading || interview.status === "COMPLETED"}
                title="Skip Question"
                className="h-11 w-11 rounded-full bg-[#141414] border border-yellow-500/20 flex items-center justify-center hover:border-yellow-400 transition text-white disabled:opacity-30"
              >
                <SkipForward size={18} />
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mb-4 font-medium">
              {isRecording
                ? "Click the red button to Stop & Submit Answer"
                : "Click the yellow mic button to Speak your answer"}
            </p>

            {/* Quick Controls Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <button
                onClick={handleTogglePause}
                disabled={interview.status === "COMPLETED"}
                className="py-2.5 rounded-xl bg-[#141414] border border-yellow-500/20 text-white text-xs font-semibold hover:border-yellow-400 transition flex items-center justify-center gap-1.5 disabled:opacity-30"
              >
                {interview.status === "PAUSED" ? <Play size={15} /> : <Pause size={15} />}
                {interview.status === "PAUSED" ? "Resume" : "Pause"}
              </button>

              <button
                onClick={handleMarkReview}
                disabled={interview.status === "COMPLETED"}
                className="py-2.5 rounded-xl bg-[#141414] border border-yellow-500/20 text-white text-xs font-semibold hover:border-yellow-400 transition flex items-center justify-center gap-1.5 disabled:opacity-30"
              >
                <Bookmark size={15} />
                Flag Review
              </button>
            </div>

            {/* End Interview Action */}
            {interview.status !== "COMPLETED" && (
              <button
                onClick={handleEndInterview}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition flex items-center justify-center gap-1.5"
              >
                <Square size={15} />
                End All Rounds & View Hiring Offer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}