import {
  Mic,
  Send,
  Pause,
  Play,
  SkipForward,
  Bookmark,
  Square,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function VoiceControls({
  isRecording = false,
  isLoading = false,
  status = "IN_PROGRESS",
  recordingSeconds = 0,
  speechTranscript = "",
  isMuted = false,
  onStartRecording,
  onStopAndSubmit,
  onTogglePause,
  onSkipQuestion,
  onMarkReview,
  onEndInterview,
  onToggleMute,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
      {/* Live Speech Transcript Box */}
      {isRecording && (
        <div className="p-3.5 rounded-2xl bg-yellow-500/[0.04] border border-yellow-500/20 space-y-1 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-yellow-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              Live Speech Transcript ({formatTime(recordingSeconds)})
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Web Speech API</span>
          </div>
          <p className="text-xs text-gray-200 italic leading-relaxed">
            {speechTranscript || "Speak clearly into your microphone..."}
          </p>
        </div>
      )}

      {/* Main Voice Action Buttons */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="flex items-center justify-center gap-5">
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={onTogglePause}
            disabled={status === "COMPLETED"}
            title={status === "PAUSED" ? "Resume Interview" : "Pause Interview"}
            className="h-12 w-12 rounded-2xl bg-[#141414] border border-yellow-500/20 flex items-center justify-center hover:border-yellow-400 text-gray-300 hover:text-white transition disabled:opacity-30"
          >
            {status === "PAUSED" ? <Play size={18} /> : <Pause size={18} />}
          </button>

          {/* Primary Microphone / Submit Answer Button */}
          {!isRecording ? (
            <button
              type="button"
              onClick={onStartRecording}
              disabled={isLoading || status === "COMPLETED" || status === "PAUSED"}
              className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_35px_rgba(255,215,0,0.4)] hover:scale-105 transition disabled:opacity-40 group cursor-pointer"
              title="Click to start speaking your answer"
            >
              <Mic className="text-black group-hover:scale-110 transition" size={32} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopAndSubmit}
              disabled={isLoading}
              className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_35px_rgba(239,68,68,0.45)] hover:scale-105 transition animate-pulse cursor-pointer"
              title="Click to stop and submit answer to AI"
            >
              {isLoading ? (
                <Loader2 className="animate-spin text-white" size={30} />
              ) : (
                <Send className="text-white" size={28} />
              )}
            </button>
          )}

          {/* Skip Question Button */}
          <button
            type="button"
            onClick={onSkipQuestion}
            disabled={isLoading || status === "COMPLETED"}
            title="Skip this question"
            className="h-12 w-12 rounded-2xl bg-[#141414] border border-yellow-500/20 flex items-center justify-center hover:border-yellow-400 text-gray-300 hover:text-white transition disabled:opacity-30"
          >
            <SkipForward size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-400 font-medium text-center mt-3">
          {isRecording
            ? "Click the red button to Stop & Submit your response"
            : "Click the yellow mic button to Speak your answer"}
        </p>
      </div>

      {/* Auxiliary Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        <button
          type="button"
          onClick={onTogglePause}
          disabled={status === "COMPLETED"}
          className="py-2.5 px-3 rounded-xl bg-[#141414] border border-white/10 hover:border-yellow-500/30 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-30"
        >
          {status === "PAUSED" ? <Play size={13} /> : <Pause size={13} />}
          <span>{status === "PAUSED" ? "Resume" : "Pause"}</span>
        </button>

        <button
          type="button"
          onClick={onMarkReview}
          disabled={status === "COMPLETED"}
          className="py-2.5 px-3 rounded-xl bg-[#141414] border border-white/10 hover:border-yellow-500/30 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-30"
        >
          <Bookmark size={13} />
          <span>Flag Review</span>
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          className="py-2.5 px-3 rounded-xl bg-[#141414] border border-white/10 hover:border-yellow-500/30 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          <span>{isMuted ? "Unmute AI" : "Mute AI"}</span>
        </button>

        <button
          type="button"
          onClick={onEndInterview}
          disabled={isLoading || status === "COMPLETED"}
          className="py-2.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-30"
        >
          <Square size={13} />
          <span>End Session</span>
        </button>
      </div>
    </div>
  );
}
