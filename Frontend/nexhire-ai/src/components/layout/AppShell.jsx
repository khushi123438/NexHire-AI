import { useState, useEffect } from "react";
import { Outlet, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CommandPalette from "./CommandPalette";
import AuroraBackground from "../background/AuroraBackground";
import AnimatedGrid from "../background/GridBackground";
import FloatingParticles from "../background/Floating";

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle Google OAuth Redirects cleanly
  useEffect(() => {
    const loginStatus = searchParams.get("login");
    const signupStatus = searchParams.get("signup");

    if (loginStatus === "success") {
      toast.success("Welcome back to NexHire AI 👋", { id: "auth-toast" });
      navigate("/dashboard", { replace: true });
    } else if (signupStatus === "success") {
      toast.success("Account created successfully 🎉", { id: "auth-toast" });
      navigate("/dashboard", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-white flex">
      {/* Background Ambience */}
      <AuroraBackground />
      <AnimatedGrid />
      <FloatingParticles />

      {/* Persistent Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <Topbar
          setMobileOpen={setMobileOpen}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <main className="relative z-10 flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        setIsOpen={setCommandPaletteOpen}
      />
    </div>
  );
}
