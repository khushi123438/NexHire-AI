import { useState } from "react";
import {
  MessageSquare,
  Play,
  Pause,
  Bot,
  User,
  CheckCircle2,
  Briefcase,
  Trash2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../Api";

export default function ConversationHistory({
  conversationHistory = [],
  interviewId = "INT12345",
  targetRole = "Software Development Engineer (SDE)",
  sessionId = null,
  onConversationCleared,
  onMessageDeleted,
}) {
  const [playingIndex, setPlayingIndex] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const items = Array.isArray(conversationHistory) ? conversationHistory : [];

  const handlePlayAudio = (item, index) => {
    if (playingIndex === index) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setPlayingIndex(null);
      return;
    }

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPlayingIndex(index);

    if (item.audioUrl) {
      const audio = new Audio(`http://localhost:5000${item.audioUrl}`);
      audio.onended = () => setPlayingIndex(null);
      audio.onerror = () => {
        synthesizeSpeech(item.text, item.speaker === "AI_RECRUITER");
      };
      audio.play().catch(() => {
        synthesizeSpeech(item.text, item.speaker === "AI_RECRUITER");
      });
    } else {
      synthesizeSpeech(item.text, item.speaker === "AI_RECRUITER");
    }
  };

  const synthesizeSpeech = (text, isAI) => {
    if (!("speechSynthesis" in window)) {
      setPlayingIndex(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = isAI ? 0.95 : 1.05;
    utterance.pitch = isAI ? 1.0 : 1.1;

    utterance.onend = () => setPlayingIndex(null);
    utterance.onerror = () => setPlayingIndex(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearAllHistory = async () => {
    const id = sessionId || interviewId;
    if (!id || id === "INT12345") {
      toast.error("No active interview session to clear");
      return;
    }

    if (!window.confirm(`Are you sure you want to clear all conversation history for "${targetRole}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setPlayingIndex(null);

      const res = await API.delete(`/interview/${id}/conversation`);
      toast.success(`Conversation history for "${targetRole}" cleared 🗑️`);
      if (onConversationCleared) {
        onConversationCleared(res.data?.interview);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to clear conversation history");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingleMessage = async (index, e) => {
    if (e) e.stopPropagation();
    const id = sessionId || interviewId;
    if (!id || id === "INT12345") return;

    if (!window.confirm("Delete this interaction from conversation history?")) return;

    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setPlayingIndex(null);

      const res = await API.delete(`/interview/${id}/conversation/${index}`);
      toast.success("Message deleted 🗑️");
      if (onMessageDeleted) {
        onMessageDeleted(res.data?.interview);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete message");
    }
  };

  const formatTimestamp = (dateValue) => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (seconds = 12) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <MessageSquare className="text-yellow-400" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Conversation History</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                  <Briefcase size={12} /> {targetRole}
                </span>
                {items.length > 0 && (
                  <span className="text-xs text-gray-400 font-mono">
                    • {interviewId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/[0.05] border border-yellow-500/20 text-gray-300">
              {items.length} Interactions
            </span>

            {/* Clear Entire Role History Button */}
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllHistory}
                disabled={isDeleting}
                title={`Clear conversation history for ${targetRole}`}
                className="px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="bg-[#0A0A0A] rounded-2xl p-8 border border-yellow-500/10 text-center flex flex-col items-center justify-center min-h-[260px]">
            <div className="h-14 w-14 rounded-full bg-white/[0.03] border border-yellow-500/10 flex items-center justify-center mb-3">
              <MessageSquare className="text-yellow-400/40" size={24} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No Conversation History for {targetRole}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Start your voice interview above. Spoken AI questions and candidate responses with audio replays will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
            {items.map((item, index) => {
              const isAI = item.speaker === "AI_RECRUITER" || item.ai;
              const isPlaying = playingIndex === index;

              return (
                <div
                  key={index}
                  className="bg-[#0A0A0A] rounded-2xl p-4 border border-yellow-500/10 hover:border-yellow-500/30 transition-all duration-300 relative group"
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isAI
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        {isAI ? <Bot size={16} /> : <User size={16} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-white text-xs md:text-sm">
                            {isAI ? "AI Recruiter" : "Candidate"}
                          </p>
                          <CheckCircle2 size={13} className="text-green-400" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {formatTimestamp(item.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Single Message Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingleMessage(index, e)}
                      title="Delete this message"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-70 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Play Audio Button */}
                  <div className="mb-2.5">
                    <button
                      onClick={() => handlePlayAudio(item, index)}
                      className={`w-full py-2 px-3 rounded-xl flex items-center justify-between text-xs font-semibold transition border ${
                        isPlaying
                          ? "bg-yellow-500/20 border-yellow-400 text-yellow-300"
                          : "bg-[#141414] border-yellow-500/20 text-gray-300 hover:border-yellow-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isPlaying ? (
                          <Pause size={14} className="text-yellow-400 animate-pulse" />
                        ) : (
                          <Play size={14} className="text-yellow-400" />
                        )}
                        <span>
                          {isPlaying
                            ? "Playing Audio..."
                            : isAI
                            ? "Play AI Recruiter Voice"
                            : "Play Candidate Voice"}
                        </span>
                      </div>
                      <span className="font-mono text-gray-400">
                        {formatDuration(item.duration)}
                      </span>
                    </button>
                  </div>

                  {/* Transcript text display */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-[11px] font-semibold text-gray-400 mb-1">
                      Transcript:
                    </p>
                    <p className="text-xs text-gray-200 leading-relaxed font-sans">
                      "{item.text}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}