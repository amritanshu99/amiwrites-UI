import React from "react";
import { Bot, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function AITools() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-gradient-to-br from-[#080e24] via-[#1a103d] to-[#24082e] dark:from-[#020510] dark:via-[#0c0824] dark:to-[#1a0930] text-white transition-colors duration-700">
      {/* Futuristic neon glows */}
      <div className="absolute top-[-120px] left-[-100px] w-[300px] h-[300px] bg-[#00f0ff] rounded-full blur-[120px] opacity-20 pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[-100px] right-[-80px] w-[280px] h-[280px] bg-[#ff00e0] rounded-full blur-[120px] opacity-20 pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7c3aed] rounded-full blur-[180px] opacity-10 pointer-events-none -z-10" />

      {/* Main Content */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.3,
            },
          },
        }}
        className="text-center max-w-3xl z-10"
      >
        {/* Badge */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: -20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="inline-flex items-center gap-2 bg-indigo-600/80 dark:bg-indigo-500/70 px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-widest text-white shadow-xl backdrop-blur-md backdrop-saturate-150"
        >
          <motion.span
            className="animate-[pulse_2s_ease-in-out_infinite]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Bot className="w-4 h-4" />
          </motion.span>
          AI Tools
        </motion.div>

        {/* Title with glitch */}
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 1 }}
          className={clsx(
            "mt-8 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-white relative",
            "before:content-['AI_Era_Has_Begun.'] before:absolute before:top-0 before:left-0 before:w-full before:text-white before:opacity-50",
            "before:animate-glitch"
          )}
        >
          AI Era Has Begun.
        </motion.h1>

        {/* Subtitle with flicker */}
        <motion.p
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-4 text-base sm:text-lg md:text-xl text-gray-300 dark:text-gray-400 font-medium animate-flicker"
        >
          Stay tuned —{" "}
          <span className="text-indigo-400 font-semibold">
            the machines are thinking.
          </span>
        </motion.p>

        {/* Sparkles */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ delay: 1.6 }}
          className="flex justify-center mt-10"
        >
          <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
        </motion.div>
      </motion.section>
    </main>
  );
}
