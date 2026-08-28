import { motion } from "framer-motion";
import {
  BarChart3,
  BadgeCheck,
  BrainCircuit,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const scores = [
  { title: "Communication", value: 92 },
  { title: "Technical Skills", value: 94 },
  { title: "Problem Solving", value: 89 },
  { title: "Confidence", value: 91 },
];

const strengths = [
  "Strong Java & DSA knowledge",
  "Excellent communication",
  "Confident problem-solving approach",
];

const improvements = [
  "Improve system design concepts",
  "Explain projects in more depth",
];

export default function Evaluation() {
  return (
    <section
      id="evaluation"
      className="relative py-32 px-6"
    >
      <div className="max-w-7xl mx-auto">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="uppercase tracking-[5px] text-yellow-400">
            Evaluation
          </p>

          <h2 className="mt-4 text-5xl font-bold text-white">
            AI Powered
            <span className="block text-yellow-400">
              Candidate Assessment
            </span>
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
            Every interview is analyzed using Artificial Intelligence to
            generate performance scores, strengths, improvement areas and a
            hiring recommendation.
          </p>
        </motion.div>

        <div className="mt-24 grid lg:grid-cols-2 gap-10">

          {/* Left Card */}

          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-yellow-500/20 bg-white/[0.04] backdrop-blur-xl p-8"
          >
            <div className="flex items-center gap-3">
              <BrainCircuit className="text-yellow-400" size={32} />
              <h3 className="text-2xl font-semibold text-white">
                Performance Scores
              </h3>
            </div>

            <div className="space-y-8 mt-10">
              {scores.map((item) => (
                <div key={item.title}>
                  <div className="flex justify-between mb-2">
                    <span>{item.title}</span>
                    <span className="text-yellow-400 font-semibold">
                      {item.value}%
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.value}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-yellow-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">
                    Overall Performance
                  </p>

                  <h2 className="text-5xl font-black text-yellow-400 mt-2">
                    91%
                  </h2>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Card */}

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-yellow-500/20 bg-white/[0.04] backdrop-blur-xl p-8"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="text-yellow-400" />
              <h3 className="text-2xl font-semibold text-white">
                AI Analysis Report
              </h3>
            </div>

            {/* Strengths */}

            <div className="mt-10">
              <h4 className="text-green-400 font-semibold text-lg mb-5">
                Strengths
              </h4>

              <div className="space-y-4">
                {strengths.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="text-green-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvements */}

            <div className="mt-10">
              <h4 className="text-orange-400 font-semibold text-lg mb-5">
                Improvements
              </h4>

              <div className="space-y-4">
                {improvements.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <AlertTriangle className="text-orange-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="mt-12 rounded-2xl bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 p-6"
            >
              <div className="flex items-center gap-4">
                <BadgeCheck
                  className="text-yellow-400"
                  size={40}
                />

                <div>
                  <p className="text-gray-400">
                    AI Recommendation
                  </p>

                  <h2 className="text-3xl font-bold text-yellow-400">
                    Hire Candidate
                  </h2>
                </div>
              </div>
            </motion.div>

          </motion.div>

        </div>

      </div>
    </section>
  );
}