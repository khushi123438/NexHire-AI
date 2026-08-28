import { motion } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import {
  Sparkles,
  Mail,
  ArrowUp,
  Phone,
} from "lucide-react";

const quickLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "Workflow", href: "#workflow" },
  { name: "AI Interview", href: "#ai-interview" },
  { name: "Evaluation", href: "#evaluation" },
  { name: "Recruiter Decision", href: "#decision" },
];

const features = [
  "Resume Analysis",
  "AI Voice Interview",
  "Performance Evaluation",
  "Hiring Recommendation",
];

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-yellow-500/10 bg-black/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid md:grid-cols-4 gap-10">

          {/* Brand */}

          <div>
            <div className="flex items-center gap-3">

              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,.4)]">
                <Sparkles className="text-black" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  NexHire AI
                </h2>

                <p className="text-yellow-400 text-sm">
                  AI Interview Coach
                </p>
              </div>
            </div>

            <p className="mt-6 text-gray-400 leading-7">
              Transforming recruitment with AI-powered resume analysis,
              intelligent voice interviews, automated evaluation, and
              recruiter-friendly hiring recommendations.
            </p>
          </div>

          {/* Quick Links */}

          <div>
            <h3 className="text-white font-semibold text-lg mb-5">
              Quick Links
            </h3>

            <div className="space-y-3">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-gray-400 hover:text-yellow-400 transition"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Features */}

          <div>
            <h3 className="text-white font-semibold text-lg mb-5">
              Platform
            </h3>

            <div className="space-y-3">
              {features.map((item) => (
                <p
                  key={item}
                 className="block text-gray-400 hover:text-yellow-400 transition"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>

          {/* Contact */}

          <div>
            <h3 className="text-white font-semibold text-lg mb-5">
              Contact
            </h3>

            <div className="space-y-4">

              <div className="flex items-center gap-3 text-gray-400 hover:text-yellow-400 transition">
                <Mail size={18} />
                <span>team@nexhireai.com</span>

               
              </div>

              <div className="flex items-center gap-3 text-gray-400 hover:text-yellow-400 transition">
                <Phone size={18} />
                <span>+91 98765 43210</span>
              </div>
              
            </div>
          </div>

        </div>

        {/* Divider */}

        <div className="mt-14 border-t border-yellow-500/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} NexHire AI. All rights reserved.
          </p>

          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 text-black flex items-center justify-center hover:scale-110 transition"
          >
            <ArrowUp size={20} />
          </button>

        </div>

      </div>
    </footer>
  );
}