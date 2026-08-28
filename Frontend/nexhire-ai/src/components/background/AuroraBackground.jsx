import { motion } from "framer-motion";

export default function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* Left */}

      <motion.div
        animate={{
          x: [0, 120, 0],
          y: [0, -80, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
        }}
        className="
        absolute
        -top-40
        -left-40
        w-[700px]
        h-[700px]
        rounded-full
        bg-yellow-400/20
        blur-[170px]
        "
      />

      {/* Right */}

      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 90, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
        }}
        className="
        absolute
        top-20
        -right-52
        w-[650px]
        h-[650px]
        rounded-full
        bg-amber-500/20
        blur-[180px]
        "
      />

      {/* Bottom */}

      <motion.div
        animate={{
          y: [0, -100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
        }}
        className="
        absolute
        bottom-[-300px]
        left-1/2
        -translate-x-1/2
        w-[900px]
        h-[900px]
        rounded-full
        bg-yellow-600/20
        blur-[220px]
        "
      />

    </div>
  );
}