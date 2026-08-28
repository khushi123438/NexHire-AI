import { motion } from "framer-motion";
import {
  Upload,
  BrainCircuit,
  Mic,
  BarChart3,
  BadgeCheck,
} from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Resume",
    desc: "Candidate uploads the resume in PDF format.",
  },
  {
    icon: BrainCircuit,
    title: "AI Resume Analysis",
    desc: "AI extracts skills, projects, experience and generates interview questions.",
  },
  {
    icon: Mic,
    title: "AI Voice Interview",
    desc: "The candidate answers dynamic HR and technical questions.",
  },
  {
    icon: BarChart3,
    title: "Performance Evaluation",
    desc: "AI evaluates communication, confidence and technical knowledge.",
  },
  {
    icon: BadgeCheck,
    title: "Recruiter Decision",
    desc: "A final hiring recommendation and detailed report are generated.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="workflow"
      className="relative py-32 px-6"
    >
      <div className="max-w-6xl mx-auto">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-yellow-400 uppercase tracking-[4px]">
            Workflow
          </p>

          <h2 className="mt-4 text-5xl font-bold text-white">
            How NexHire AI Works
          </h2>

          <p className="mt-6 text-gray-400 max-w-2xl mx-auto">
            From resume upload to recruiter recommendation,
            every stage is automated using Artificial Intelligence.
          </p>
        </motion.div>

        {/* Timeline */}

        <div className="relative mt-24">

          {/* Center Line */}

          <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-400 hidden md:block"></div>

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  x: index % 2 === 0 ? -100 : 100,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.7,
                }}
                viewport={{ once: true }}
                className={`relative mb-20 flex items-center ${
                  index % 2 === 0
                    ? "md:flex-row"
                    : "md:flex-row-reverse"
                }`}
              >
                {/* Card */}

                <div className="w-full md:w-1/2 px-5">

                  <div
                    className="
                    group
                    rounded-3xl
                    border
                    border-yellow-500/20
                    bg-white/5
                    backdrop-blur-xl
                    p-8
                    hover:border-yellow-400
                    transition
                    duration-300
                    hover:shadow-[0_0_35px_rgba(255,215,0,.18)]
                    "
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center">
                      <Icon className="text-black" size={30} />
                    </div>

                    <h3 className="mt-6 text-2xl font-bold text-white">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-gray-400 leading-7">
                      {step.desc}
                    </p>
                  </div>

                </div>

                {/* Circle */}

                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_25px_rgba(255,215,0,.7)] border-4 border-black z-10"></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}