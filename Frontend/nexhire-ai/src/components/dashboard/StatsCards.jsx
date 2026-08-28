import { FileText, Mic, Brain, CheckCircle2 } from "lucide-react";

export default function StatsCards({ stats = null }) {
  const data = [
    {
      title: "Resumes Uploaded",
      value: stats?.resumes !== undefined ? String(stats.resumes) : "0",
      icon: FileText,
      tag: stats?.resumes > 0 ? "Uploaded" : "Pending",
    },
    {
      title: "Interviews Taken",
      value: stats?.interviews !== undefined ? String(stats.interviews) : "0",
      icon: Mic,
      tag: stats?.interviews > 0 ? "Completed" : "Not Started",
    },
    {
      title: "Average AI Score",
      value: stats?.aiScore || "--",
      icon: Brain,
      tag: stats?.aiScore && stats?.aiScore !== "--" ? "Evaluated" : "Pending",
    },
    {
      title: "Hiring Recommendation",
      value: stats?.hiring || "Not Started",
      icon: CheckCircle2,
      tag: stats?.hiring && stats?.hiring !== "Not Started" ? "Decided" : "Awaiting",
    },
  ];

  return (
    <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map((stat, index) => (
        <div
          key={index}
          className="bg-[#141414] border border-yellow-500/20 rounded-2xl p-5 backdrop-blur-xl hover:border-yellow-400 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,215,0,.15)]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <stat.icon className="text-yellow-400" size={20} />
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-yellow-500/20 text-yellow-300/80 font-mono">
              {stat.tag}
            </span>
          </div>

          <h3 className="text-2xl font-black text-white font-mono">{stat.value}</h3>
          <p className="text-gray-400 text-xs mt-1">{stat.title}</p>
        </div>
      ))}
    </div>
  );
}