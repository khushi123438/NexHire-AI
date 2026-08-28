import { motion } from "framer-motion";
import {
  Mic,
  BrainCircuit,
  Activity,
  Volume2,
} from "lucide-react";

export default function AIInterview() {
  return (
    <section
      id="ai-interview"
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
            AI Interview
          </p>

          <h2 className="mt-4 text-5xl font-bold text-white">
            Experience a Real-Time
            <span className="block text-yellow-400">
              AI Voice Interview
            </span>
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
            NexHire AI interacts naturally with candidates,
            asks intelligent questions, listens carefully,
            and evaluates responses instantly.
          </p>
        </motion.div>

        {/* Cards */}

        <div className="mt-24 grid lg:grid-cols-2 gap-10">

          {/* Left */}

          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-yellow-500/20 bg-white/[0.04] backdrop-blur-xl p-8"
          >

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center">
                <BrainCircuit className="text-black"/>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white">
                  AI Recruiter
                </h3>

                <p className="text-gray-400 text-sm">
                  Live Interview Session
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-black/30 border border-yellow-500/10 p-6">

              <p className="text-gray-300 leading-8">
                "Tell me about yourself and explain one
                challenging project you have worked on.
                What technologies did you use?"
              </p>

            </div>

            <div className="mt-10 flex items-center gap-4">

              <motion.div
                animate={{
                  scale:[1,1.15,1],
                }}
                transition={{
                  repeat:Infinity,
                  duration:1.5
                }}
                className="h-14 w-14 rounded-full bg-red-500 flex items-center justify-center"
              >
                <Mic />
              </motion.div>

              <div>

                <p className="text-white font-semibold">
                  Recording...
                </p>

                <p className="text-gray-400 text-sm">
                  Listening to Candidate
                </p>

              </div>

            </div>

          </motion.div>

          {/* Right */}

          <motion.div
            initial={{ opacity:0,x:80 }}
            whileInView={{ opacity:1,x:0 }}
            viewport={{ once:true }}
            className="rounded-3xl border border-yellow-500/20 bg-white/[0.04] backdrop-blur-xl p-8"
          >

            <h3 className="text-2xl font-semibold text-white">
              Live Evaluation
            </h3>

            <div className="space-y-8 mt-10">

              {[
                ["Confidence",92],
                ["Communication",89],
                ["Technical Knowledge",94],
                ["Problem Solving",91],
              ].map(([title,value])=>(
                <div key={title}>

                  <div className="flex justify-between text-sm mb-2">
                    <span>{title}</span>
                    <span>{value}%</span>
                  </div>

                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">

                    <motion.div
                      initial={{width:0}}
                      whileInView={{width:`${value}%`}}
                      transition={{duration:1}}
                      className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-yellow-600"
                    />

                  </div>

                </div>
              ))}

            </div>

            <div className="mt-12 flex justify-center">

              <motion.div
                animate={{
                  rotate:360
                }}
                transition={{
                  repeat:Infinity,
                  duration:10,
                  ease:"linear"
                }}
                className="h-24 w-24 rounded-full border border-yellow-500 flex items-center justify-center"
              >
                <Volume2 className="text-yellow-400"/>
              </motion.div>

            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
}