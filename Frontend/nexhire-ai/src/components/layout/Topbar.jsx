import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { useInterview } from "../../context/InterviewContext";
import API from "../../Api";
import toast from "react-hot-toast";

export default function Topbar({ setMobileOpen }) {
  const navigate = useNavigate();
  const { userName, currentRole } = useInterview();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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
    <header className="sticky top-0 z-30 h-16 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 flex items-center justify-between">

      {/* Left: Mobile Menu + Target Role */}
      <div className="flex items-center gap-3">

        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Target Role */}
        {currentRole && (
          <div className="flex items-center gap-2">
            <Briefcase
              size={15}
              className="text-yellow-400"
            />

            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              Target Role
            </span>

            <span className="text-sm font-semibold text-white">
              {currentRole}
            </span>
          </div>
        )}
      </div>

      {/* Right: Profile */}
      <div className="flex items-center">
        <div className="relative">
          <button
            onClick={() =>
              setProfileDropdownOpen(!profileDropdownOpen)
            }
            className="flex items-center gap-2 p-1.5 md:px-2.5 md:py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-yellow-500/30 text-white transition"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-black text-xs font-mono">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <span className="hidden md:inline text-xs font-semibold text-gray-200 truncate max-w-[100px]">
              {userName}
            </span>

            <ChevronDown
              size={14}
              className="text-gray-400 hidden md:inline"
            />
          </button>

          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0d0d0d] border border-yellow-500/20 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-xs font-bold text-white truncate">
                  {userName}
                </p>

                <p className="text-[10px] text-gray-400 truncate">
                  {currentRole || "Candidate"}
                </p>
              </div>

              <button
                onClick={() => navigate("/profile")}
                className="w-full px-3 py-2 rounded-xl text-left text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
              >
                <User size={14} className="text-yellow-400" />
                <span>Candidate Profile</span>
              </button>

              <button
                onClick={() => navigate("/settings")}
                className="w-full px-3 py-2 rounded-xl text-left text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
              >
                <Settings size={14} className="text-yellow-400" />
                <span>Settings & Audio</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-xl text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}