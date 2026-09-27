import { useState } from "react";
import { Volume2, Mic, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useInterview } from "../context/InterviewContext";
import API from "../Api";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const { isMuted, setIsMuted, userName } = useInterview();
  const [speechRate, setSpeechRate] = useState(0.95);
  const [micTesting, setMicTesting] = useState(false);
  const [testTranscript, setTestTranscript] = useState("");

  const handleTestTTS = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Welcome to NexHire AI. Your voice synthesizer is calibrated and active.");
      utterance.rate = speechRate;
      window.speechSynthesis.speak(utterance);
      toast.success("Playing sample AI voice 🎙️");
    }
  };

  const handleTestMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Web Speech API not supported in this browser.");
      return;
    }

    if (micTesting) {
      setMicTesting(false);
      setTestTranscript("");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTestTranscript(transcript);
      };

      recognition.onend = () => {
        setMicTesting(false);
        toast.success("Microphone test completed!");
      };

      recognition.start();
      setMicTesting(true);
      toast("Speak now into your microphone...", { icon: "🎙️" });
    } catch (err) {
      setMicTesting(false);
      toast.error("Microphone access error.");
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {}
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success("Logged out successfully 👋");
    navigate("/auth");
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <span>Platform Settings</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-mono border border-yellow-500/20">
            Preferences
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Configure speech synthesizer parameters, audio input devices, and candidate memory settings.
        </p>
      </div>

      {/* Audio & Voice Synthesizer Card */}
      <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center">
            <Volume2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI Voice & Synthesizer Settings</h2>
            <p className="text-xs text-gray-400">Configure how the AI Senior Interviewer speaks questions</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {/* Mute Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-xs font-bold text-white">AI Voice Playback</p>
              <p className="text-[11px] text-gray-400">Automatically speak questions via Text-to-Speech</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
                !isMuted
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {!isMuted ? "Voice Enabled" : "Muted"}
            </button>
          </div>

          {/* Speech Rate Slider */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Speech Rate / Speed</span>
              <span className="text-xs font-mono text-yellow-400 font-bold">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>0.7x (Deliberate)</span>
              <span>1.0x (Standard)</span>
              <span>1.3x (Fast)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestTTS}
            className="px-4 py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-bold text-xs hover:bg-yellow-500/25 transition flex items-center gap-2"
          >
            <Volume2 size={15} />
            <span>Test AI Voice Synthesizer</span>
          </button>
        </div>
      </div>

      {/* Microphone Hardware Calibration Card */}
      <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center">
            <Mic size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Microphone Input Calibration</h2>
            <p className="text-xs text-gray-400">Test your speech-to-text accuracy before starting a real round</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <button
            type="button"
            onClick={handleTestMic}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              micTesting
                ? "bg-red-500 text-white animate-pulse"
                : "bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30"
            }`}
          >
            <Mic size={15} />
            <span>{micTesting ? "Listening... (Click to Stop)" : "Test Microphone Speech-to-Text"}</span>
          </button>

          {testTranscript && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-gray-200">
              <span className="text-yellow-400 font-bold block mb-1">Detected Speech:</span>
              "{testTranscript}"
            </div>
          )}
        </div>
      </div>

      {/* Account & Session Management */}
      <div className="bg-[#0A0A0A] border border-red-500/20 rounded-3xl p-6 backdrop-blur-xl flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Session Security</h3>
          <p className="text-xs text-gray-400 mt-0.5">Logout from your NexHire AI session</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 font-bold text-xs flex items-center gap-2 transition"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
