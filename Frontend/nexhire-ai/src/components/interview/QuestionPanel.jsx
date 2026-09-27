import { useState } from "react";
import {
  Sparkles,
  Volume2,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Bot,
  Brain,
  MessageSquare,
} from "lucide-react";

const DIFFICULTY_STYLES = {
  beginner: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  advanced: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  hard: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function QuestionPanel({
  questionText,
  questionIndex = 0,
  maxQuestions = 4,
  roundName = "Round 1: Technical",
  difficulty = "medium",
  isSpeakingAI = false,
  isRecording = false,
  status = "IN_PROGRESS",
  timeLeft = 90,
  aiReasoning = "",
  onReplayVoice,
}) {
  const [showAiInsight, setShowAiInsight] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden space-y-4">
      {/* Top Bar: Live AI status + Timer + Difficulty */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
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
            className={`text-xs md:text-sm font-semibold ${
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
              ? "Listening to Candidate..."
              : status === "PAUSED"
              ? "Interview Paused"
              : "AI Interviewer Ready"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Difficulty Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold capitalize border flex items-center gap-1 ${
              DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.medium
            }`}
          >
            <Zap size={11} />
            {difficulty}
          </span>

          {/* Question countdown timer */}
          <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/[0.04] border border-yellow-500/20 text-yellow-300">
            <Clock size={13} className="text-yellow-400" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Round & Question Index Tag */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="font-semibold text-yellow-400/90">{roundName}</span>
        <span className="font-mono">
          Question {questionIndex + 1} of {maxQuestions}
        </span>
      </div>

      {/* Question Text */}
      <div className="py-2">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white leading-relaxed tracking-tight">
          "{questionText || "Tell me about yourself and your technical background in software engineering."}"
        </h2>
      </div>

      {/* AI Reasoning / Rationale Accordion */}
      {aiReasoning && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAiInsight(!showAiInsight)}
            className="text-[11px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 font-medium transition"
          >
            <Sparkles size={12} />
            <span>Why this question? (AI Rationale)</span>
            {showAiInsight ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showAiInsight && (
            <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-yellow-500/15 text-xs text-gray-300 leading-relaxed font-sans">
              {aiReasoning}
            </div>
          )}
        </div>
      )}

      {/* Replay Audio Voice Button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onReplayVoice}
          className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 font-semibold transition"
        >
          <Volume2 size={14} />
          <span>Replay AI Voice</span>
        </button>

        <span className="text-[11px] text-gray-500 font-mono">
          RAG-Grounded Technical Context
        </span>
      </div>
    </div>
  );
}
