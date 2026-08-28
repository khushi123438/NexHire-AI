import { motion } from "framer-motion";
import {
  FileText,
  Mic,
  BrainCircuit,
  BarChart3,
  History,
  BadgeCheck,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Real AI Interviewer",
    desc: "Practice interviews with an AI interviewer that asks questions naturally, just like a real HR or technical interviewer.",
  },
  {
    icon: BrainCircuit,
    title: "Personalized Questions",
    desc: "Questions are generated based on your resume, selected role, experience level, and technical skills.",
  },
  {
    icon: FileText,
    title: "Resume Based Interview",
    desc: "Upload your resume and let the AI create interview questions tailored specifically to your profile.",
  },
  {
    icon: BarChart3,
    title: "Instant Performance Report",
    desc: "Receive detailed feedback on confidence, communication, technical knowledge, fluency, and overall interview performance.",
  },
  {
    icon: History,
    title: "Interview History",
    desc: "Access previous interview sessions, answers, scores, and progress reports to track your improvement over time.",
  },
  {
    icon: BadgeCheck,
    title: "AI Interview Coach",
    desc: "Get personalized suggestions, identify weak areas, and receive tips to improve before your next real interview.",
  },
];


export default function Features() {
  return (
    <section
      id="features"
      className="relative py-28 px-6"
    >
      <div className="max-w-7xl mx-auto">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: .7 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="text-yellow-400 uppercase tracking-[4px] text-sm">
            Features
          </span>

          <h2 className="mt-4 text-5xl font-bold text-white">
            Everything Needed For
            <span className="block text-yellow-400">
              Intelligent Recruitment
            </span>
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
            NexHire AI automates every stage of recruitment—from resume
            screening to AI interviews, candidate evaluation and hiring
            recommendations.
          </p>
        </motion.div>

        {/* Cards */}

        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: .5,
                  delay: index * .1,
                }}
                viewport={{ once: true }}
                whileHover={{
                  y: -8,
                }}
                className="
                group
                relative
                overflow-hidden
                rounded-3xl
                border
                border-yellow-500/15
                bg-white/[0.04]
                backdrop-blur-xl
                p-8
                transition-all
                duration-300
                hover:border-yellow-400/40
                hover:shadow-[0_0_40px_rgba(255,215,0,.15)]
                "
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>

                <div
                  className="
                  relative
                  w-16
                  h-16
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-gradient-to-br
                  from-yellow-300
                  via-yellow-500
                  to-yellow-700
                  shadow-[0_0_30px_rgba(255,215,0,.35)]
                "
                >
                  <Icon size={30} className="text-black" />
                </div>

                <h3 className="relative mt-7 text-2xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="relative mt-4 text-gray-400 leading-7">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}