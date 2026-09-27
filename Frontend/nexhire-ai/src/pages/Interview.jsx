import InterviewWorkspace from "../components/interview/InterviewWorkspace";
import ConversationHistory from "../components/dashboard/ConversationHistory";
import EvaluationPanel from "../components/dashboard/EvaluationPanel";
import { useInterview } from "../context/InterviewContext";
import { useState } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";

export default function Interview() {
  const { session, currentRole, handleSessionUpdate } = useInterview();
  const [showHistory, setShowHistory] = useState(false);

  const handleConversationCleared = (updatedInterview) => {
    if (updatedInterview && handleSessionUpdate) {
      handleSessionUpdate(updatedInterview);
    }
  };

  const handleMessageDeleted = (updatedInterview) => {
    if (updatedInterview && handleSessionUpdate) {
      handleSessionUpdate(updatedInterview);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Main Interview Workspace Engine */}
      <InterviewWorkspace />

      {/* Real-time Evaluation & Conversation History Accordion */}
      {session && session.status !== "NOT_STARTED" && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="text-yellow-400" size={18} />
              <h3 className="text-sm font-bold text-white">
                Live Turn Telemetry & Conversation History
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold flex items-center gap-1 transition"
            >
              <span>{showHistory ? "Collapse" : "Expand History & Rubric"}</span>
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showHistory && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch animate-in fade-in duration-200">
              <ConversationHistory
                conversationHistory={session?.conversationHistory || []}
                interviewId={session?.interviewId || "INT12345"}
                targetRole={session?.targetRole || currentRole}
                sessionId={session?._id || session?.interviewId}
                onConversationCleared={handleConversationCleared}
                onMessageDeleted={handleMessageDeleted}
              />
              <EvaluationPanel
                latestEvaluation={
                  session?.evaluations?.length > 0
                    ? session.evaluations[session.evaluations.length - 1]
                    : null
                }
                evaluations={session?.evaluations || []}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
