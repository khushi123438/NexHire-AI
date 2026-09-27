import { Sparkles } from "lucide-react";

export default function AIStatus({ pulse = true, label = "AI Active" }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-mono">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
      </span>
      <span className="text-[11px] font-semibold text-yellow-300 tracking-wide">{label}</span>
    </div>
  );
}
