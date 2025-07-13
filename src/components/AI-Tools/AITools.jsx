import React, { useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
const toolLinks = [
  {
    path: "/ai-chat",
    label: "🤖 AI Chat for Productivity",
    color: "from-cyan-400 via-cyan-500 to-cyan-600",
  },
  {
    path: "/spam-check",
    label: "📬 AI Spam Detector",
    color: "from-pink-400 via-pink-500 to-pink-600",
  },
  {
    path: "/movie-recommender",
    label: "🎥 AI Movie Recommender",
    color: "from-yellow-400 via-orange-500 to-red-500",
  },
  {
    path: "/emotion-analyzer",
    label: "😊 Emotion Analyzer",
    color: "from-purple-500 via-purple-600 to-purple-700",
  },
];

export default function AITools() {
  const { pathname } = useLocation();
  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden font-sans text-white transition-colors duration-700
      bg-gradient-to-br from-[#1a2238] via-[#273c52] to-[#1b1f2a] dark:from-[#0a0a0a] dark:via-[#111111] dark:to-[#000000]"
    >
      {/* Neon Glows */}
      <div className="absolute top-[-120px] left-[-100px] w-[280px] h-[280px] bg-[#00ffe0] rounded-full blur-[120px] opacity-30 pointer-events-none -z-10 animate-ping dark:opacity-20" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[300px] h-[300px] bg-[#ff00cc] rounded-full blur-[140px] opacity-30 pointer-events-none -z-10 animate-ping dark:opacity-20" />
      <div className="absolute inset-0 m-auto w-[800px] h-[800px] bg-[#9b59b6] rounded-full blur-[200px] opacity-10 pointer-events-none -z-10" />

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
        className="text-center max-w-3xl z-10 w-full"
      >
        {/* Badge */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: -20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="inline-flex items-center gap-2 bg-indigo-600/80 dark:bg-indigo-500/70 px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-widest text-white shadow-xl backdrop-blur-md backdrop-saturate-150"
        >
          <motion.span className="animate-[pulse_2s_ease-in-out_infinite]">
            <Bot className="w-4 h-4" />
          </motion.span>
          AI Tools
        </motion.div>

        {/* Glitch Title */}
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 1 }}
          className={clsx(
            "mt-8 pb-4 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.2] tracking-tight relative",
            "text-transparent bg-clip-text bg-gradient-to-r from-[#00ffe0] via-[#a855f7] to-[#ff00cc]",
            "before:content-['AI_Era_Has_Begun.'] before:absolute before:top-0 before:left-0 before:w-full",
            "before:text-transparent before:bg-clip-text before:bg-gradient-to-r before:from-[#00ffe0] before:via-[#a855f7] before:to-[#ff00cc]",
            "before:opacity-50 before:animate-glitch"
          )}
        >
          AI Era Has Begun.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-4 text-base sm:text-lg md:text-xl text-gray-300 dark:text-gray-400 font-medium"
        >
          Stay tuned —{" "}
          <span className="text-indigo-400 font-semibold">
            the machines are thinking.
          </span>
        </motion.p>

        {/* Tool Buttons */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ delay: 1.2 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mx-auto"
        >
          {toolLinks.map((tool, index) => (
            <Link
              key={index}
              to={tool.path}
              className={clsx(
                "group block rounded-xl px-5 py-4 font-semibold text-base text-white bg-gradient-to-br shadow-xl transition-transform transform hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 dark:focus:ring-cyan-400",
                tool.color
              )}
            >
              <span className="block text-center transition-all group-hover:tracking-wide">
                {tool.label}
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Sparkles */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ delay: 1.6 }}
          className="flex justify-center mt-12"
        >
          <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
        </motion.div>
      </motion.section>
    </main>
  );
}
