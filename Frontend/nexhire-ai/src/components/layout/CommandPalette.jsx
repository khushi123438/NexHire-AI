import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Mic,
  History,
  FileText,
  Brain,
  Layers,
  Compass,
  FileSpreadsheet,
  Settings,
  X,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { useInterview, STANDARD_ROLES } from "../../context/InterviewContext";

export default function CommandPalette({ isOpen, setIsOpen }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { handleRoleSelect, currentRole } = useInterview();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsOpen]);

  if (!isOpen) return null;

  const NAVIGATION_ITEMS = [
    { name: "Dashboard Overview", category: "Navigation", href: "/dashboard", icon: LayoutDashboard },
    { name: "Start New AI Interview", category: "Interview", href: "/interview", icon: Mic },
    { name: "View Past Interview History", category: "Interview", href: "/interview/history", icon: History },
    { name: "Performance Reports", category: "Interview", href: "/interview/report", icon: FileText },
    { name: "AI Insights & Analytics", category: "Intelligence", href: "/intelligence", icon: Brain },
    { name: "Skill Intelligence Matrix", category: "Intelligence", href: "/intelligence/skills", icon: Layers },
    { name: "Weakness Memory Telemetry", category: "Intelligence", href: "/intelligence/memory", icon: Brain },
    { name: "Personalized Career Coach", category: "Career", href: "/career", icon: Compass },
    { name: "5-Day Study Roadmap", category: "Career", href: "/career/roadmap", icon: Compass },
    { name: "Resume & Role Manager", category: "Profile", href: "/resumes", icon: FileSpreadsheet },
    { name: "Platform Settings & Audio", category: "System", href: "/settings", icon: Settings },
  ];

  const filteredNav = NAVIGATION_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRoles = STANDARD_ROLES.filter((role) =>
    role.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectNav = (href) => {
    setIsOpen(false);
    setQuery("");
    navigate(href);
  };

  const handleSelectRole = (role) => {
    handleRoleSelect(role);
    setIsOpen(false);
    setQuery("");
    navigate("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-xl rounded-2xl bg-[#0d0d0d] border border-yellow-500/30 shadow-[0_0_50px_rgba(255,215,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-white/10">
          <Search size={18} className="text-yellow-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Type a command, page name, or target role..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full h-14 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 scrollbar-thin">
          {/* Target Roles Quick Switch */}
          {filteredRoles.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-mono font-bold text-gray-500 uppercase">
                Switch Target Role
              </p>
              <div className="space-y-1">
                {filteredRoles.map((role) => {
                  const isCurrent = currentRole.toLowerCase() === role.toLowerCase();
                  return (
                    <button
                      key={role}
                      onClick={() => handleSelectRole(role)}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition ${
                        isCurrent
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/40"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className={isCurrent ? "text-yellow-400" : "text-gray-400"} />
                        <span>{role}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-400">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Navigation Pages */}
          <div>
            <p className="px-3 py-1 text-[10px] font-mono font-bold text-gray-500 uppercase">
              Commands & Navigation
            </p>
            <div className="space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleSelectNav(item.href)}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 flex items-center justify-between group transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className="text-gray-400 group-hover:text-yellow-400" />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 group-hover:text-yellow-400">
                      <span className="text-[10px] font-mono">{item.category}</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="p-2.5 px-4 bg-[#050505] border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <span>Navigate with ⌘K</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
