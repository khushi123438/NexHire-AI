import { motion } from "framer-motion";
import {
  User,
  BadgeCheck,
  FileDown,
  CheckCircle2,
  Clock3,
  XCircle,
  Sparkles,
} from "lucide-react";

export default function RecruiterDecision() {
  return (
    <section
      id="decision"
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
          <span className="uppercase tracking-[5px] text-yellow-400">
            Recruiter Decision
          </span>

          <h2 className="mt-4 text-5xl font-bold text-white">
            AI Powered
            <span className="block text-yellow-400">
              Hiring Recommendation
            </span>
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
            After evaluating interview performance, NexHire AI provides
            a recruiter-friendly recommendation with complete insights.
          </p>
        </motion.div>

        <div className="mt-20 grid lg:grid-cols-2 gap-10">

          {/* Candidate */}

          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-yellow-500/20 bg-white/[0.04] backdrop-blur-xl p-8"
          >
            <div className="flex items-center gap-5">

              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center">
                <User size={40} className="text-black"/>
              </div>

              <div>

                <h3 className="text-2xl font-bold text-white">
                  Rahul Sharma
                </h3>

                <p className="text-gray-400">
                  Java Full Stack Developer
                </p>

              </div>

            </div>

            <div className="mt-10 space-y-5">

              <div className="flex justify-between">
                <span className="text-gray-400">Interview Score</span>
                <span className="text-yellow-400 font-semibold">
                  91%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Communication</span>
                <span>Excellent</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Technical Skills</span>
                <span>Advanced</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Problem Solving</span>
                <span>Strong</span>
              </div>

            </div>

            <button
              className="
              mt-10
              w-full
              rounded-xl
              bg-gradient-to-r
              from-yellow-300
              to-yellow-600
              py-4
              font-semibold
              text-black
              flex
              justify-center
              items-center
              gap-3
              hover:scale-[1.02]
              transition
              "
            >
              <FileDown size={20}/>
              Download Interview Report
            </button>

          </motion.div>

          {/* Decision */}

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-yellow-500/20 bg-white/[0.04] backdrop-blur-xl p-8"
          >

            <div className="flex items-center gap-3">

              <Sparkles className="text-yellow-400"/>

              <h3 className="text-2xl font-bold">
                AI Recommendation
              </h3>

            </div>

            <motion.div
              animate={{
                scale:[1,1.04,1]
              }}
              transition={{
                repeat:Infinity,
                duration:3
              }}
              className="
              mt-10
              rounded-3xl
              bg-gradient-to-br
              from-yellow-400/20
              to-yellow-600/10
              border
              border-yellow-500/20
              p-8
              text-center
              "
            >

              <BadgeCheck
                size={70}
                className="mx-auto text-yellow-400"
              />

              <h2 className="mt-6 text-5xl font-black text-yellow-400">
                HIRE
              </h2>

              <p className="mt-5 text-gray-300 leading-8">
                Candidate demonstrated strong technical knowledge,
                excellent communication skills and consistent confidence
                throughout the interview.
              </p>

            </motion.div>

            <div className="grid grid-cols-3 gap-4 mt-10">

              <button className="rounded-xl bg-green-500/20 border border-green-500 py-4 hover:scale-105 transition">
                <CheckCircle2 className="mx-auto mb-2 text-green-400"/>
                Hire
              </button>

              <button className="rounded-xl bg-yellow-500/20 border border-yellow-500 py-4 hover:scale-105 transition">
                <Clock3 className="mx-auto mb-2 text-yellow-400"/>
                Hold
              </button>

              <button className="rounded-xl bg-red-500/20 border border-red-500 py-4 hover:scale-105 transition">
                <XCircle className="mx-auto mb-2 text-red-400"/>
                Reject
              </button>

            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
}