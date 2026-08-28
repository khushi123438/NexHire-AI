import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Compass
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/Navbar";


export default function Hero() {
  const navigate = useNavigate();
  return (
    <section
      id="home"
      className="relative min-h-screen pt-16"
    >
      {/* Navbar */}
      <Navbar />

      {/* Hero Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 pt-32 pb-16">
        <div className="mx-auto max-w-6xl text-center">

          {/* Badge */}

          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-5 py-2 backdrop-blur-xl"
          >
            <Sparkles
              size={16}
              className="text-yellow-400"
            />

           <span className="text-yellow-400 uppercase tracking-[4px] text-sm">
    AI Interview Coach
  </span>
          </motion.div>

          {/* Heading */}

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
            }}
            className="
              mt-8
              text-5xl
              md:text-7xl
              lg:text-8xl
              font-black
              leading-tight
            "
          >
           <span className="text-white">
  Master Your
</span>

<br />

<span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
  Dream Interview
</span>

<br />

<span className="text-white">
  with AI
</span>
          </motion.h1>

          {/* Description */}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.5,
            }}
            className="
              mx-auto
              mt-8
              max-w-3xl
              text-lg
              leading-8
              text-gray-400
            "
          >
           Practice realistic HR and technical interviews with an AI interviewer.
Receive personalized questions, instant performance analysis, detailed
feedback, and expert guidance to improve your confidence and crack your
dream job interview.
          </motion.p>

          {/* Buttons */}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.7,
            }}
            className="
              mt-12
              flex
              flex-wrap
              items-center
              justify-center
              gap-5
            "
          >
            <button
              onClick={() => navigate("/auth")}
              className="
                flex
                items-center
                gap-3
                rounded-xl
                bg-gradient-to-r
                from-yellow-300
                via-yellow-400
                to-yellow-600
                px-8
                py-4
                font-semibold
                text-black
                shadow-[0_0_40px_rgba(255,215,0,.35)]
                transition
                duration-300
                hover:scale-105
              "
            >
             Get Started
<ArrowRight size={20} />
            </button>

            <button
             onClick={() =>
    document
      .getElementById("features")
      ?.scrollIntoView({ behavior: "smooth" })
  }
              className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-yellow-500/20
                bg-white/5
                px-8
                py-4
                font-medium
                text-white
                backdrop-blur-xl
                transition
                duration-300
                hover:border-yellow-400
                hover:bg-yellow-500/10
              "
            >
              <Sparkles size={18} />
Explore NexHire
            </button>
          </motion.div>


        </div>
      </div>
    </section>
  );
}