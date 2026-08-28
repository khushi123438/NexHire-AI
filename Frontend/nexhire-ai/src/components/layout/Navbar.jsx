import { Sparkles, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "Workflow", href: "#workflow" },
  { name: "AI Interview", href: "#ai-interview" },
  { name: "Evaluation", href: "#evaluation" },
  { name: "Recruiter Decision", href: "#decision" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full flex justify-center"
    >
      <div
        className={`w-[92%] max-w-6xl h-[72px] px-8 rounded-full flex items-center justify-between transition-all duration-500 ${
          scrolled
            ? "bg-black/35 backdrop-blur-3xl border border-yellow-500/20 shadow-[0_8px_40px_rgba(0,0,0,.45)]"
            : "bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(255,255,255,.03)]"
        }`}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-yellow-400 blur-2xl opacity-60 animate-pulse"></div>

            <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex items-center justify-center shadow-[0_0_25px_rgba(255,215,0,.5)]">
              <Sparkles size={18} className="text-black" />
            </div>
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">
              NexHire AI
            </h1>

            <p className="text-xs text-yellow-400">
              AI Interview Coach
            </p>
          </div>
        </div>

        {/* CENTER */}

        <div className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="group relative px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-yellow-300 hover:bg-yellow-500/10 transition-all duration-300"
            >
              {item.name}

              <span className="absolute left-4 right-4 bottom-1 h-[2px] bg-gradient-to-r from-yellow-300 to-yellow-500 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
            </a>
          ))}
        </div>

        {/* RIGHT */}
        <div className="lg:hidden">
  <button
    onClick={() => setMobileOpen(!mobileOpen)}
    className="h-11 w-11 rounded-full border border-yellow-500/20 bg-white/5 flex items-center justify-center text-white hover:bg-yellow-500/10 transition"
  >
    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
  </button>
</div>

      
      </div>

      {/* MOBILE MENU */}

      {mobileOpen && (
        <div className="absolute top-20 w-[92%] max-w-6xl rounded-3xl border border-yellow-500/20 bg-black/70 backdrop-blur-3xl p-4 lg:hidden">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="block rounded-xl px-4 py-3 text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-300"
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </motion.nav>
  );
}