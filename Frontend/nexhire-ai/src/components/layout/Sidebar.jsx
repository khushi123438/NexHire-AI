import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Mic,
  History,
  FileText,
  Brain,
  Layers,
  Activity,
  Compass,
  Map,
  Target,
  FileSpreadsheet,
  UserCheck,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "OVERVIEW",
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "INTERVIEW",
    items: [
      { name: "New Interview", href: "/interview", icon: Mic },
      { name: "Interview History", href: "/interview/history", icon: History },
      { name: "Reports", href: "/interview/report", icon: FileText },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { name: "AI Insights", href: "/intelligence", icon: Brain },
      { name: "Skill Intelligence", href: "/intelligence/skills", icon: Layers },
      { name: "Weakness Memory", href: "/intelligence/memory", icon: Activity },
    ],
  },
  {
    title: "CAREER",
    items: [
      { name: "Career Coach", href: "/career", icon: Compass },
      { name: "Roadmap", href: "/career/roadmap", icon: Map },
      { name: "Skill Gaps", href: "/career/skills", icon: Target },
    ],
  },
  {
    title: "PROFILE",
    items: [
      { name: "Resumes & Roles", href: "/resumes", icon: FileSpreadsheet },
      { name: "Candidate Profile", href: "/profile", icon: UserCheck },
    ],
  },
  {
    title: "SYSTEM",
    items: [{ name: "Settings", href: "/settings", icon: Settings }],
  },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();

  const handleLinkClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col justify-between bg-[#080808] border-r border-yellow-500/15 transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-white/5">
            <NavLink
              to="/dashboard"
              onClick={handleLinkClick}
              className="flex items-center gap-3 group overflow-hidden"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                <Sparkles size={18} className="text-black" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm tracking-wider text-white">NEXHIRE</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-400 font-bold">
                      AI
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 tracking-tight">Interview Intelligence</span>
                </div>
              )}
            </NavLink>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav Items List */}
          <div className="px-3 py-4 space-y-5 overflow-y-auto max-h-[calc(100vh-170px)] scrollbar-thin">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-mono font-bold tracking-wider text-gray-300 mb-1.5">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  // Handle active highlight for exact match or nested routes
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={handleLinkClick}
                      title={collapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? "bg-yellow-500/15 border border-yellow-400/40 text-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                          : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={`flex-shrink-0 transition-colors ${
                          isActive ? "text-yellow-400" : "text-gray-400 group-hover:text-yellow-300"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom AI Status & Collapse Toggle */}
        <div className="p-3 border-t border-white/5 bg-[#050505] space-y-2">
          {!collapsed ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  AI COACH
                </span>
                <span className="text-[10px] font-mono text-yellow-400">Active</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">Personalization & RAG enabled</p>
            </div>
          ) : (
            <div className="flex justify-center" title="AI Coach Active">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full py-1.5 items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-xs transition"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}
