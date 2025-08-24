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
  {
    path: "/amibot",
    label: "AmiBot, know more about Amritanshu Mishra",
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
      className={clsx(
        "relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden font-sans text-white transition-colors duration-700",
        "bg-gradient-to-br from-[#0a0f1f] via-[#121a2b] to-[#070a12] dark:from-[#05060a] dark:via-[#0b0e18] dark:to-[#000000]"
      )}
    >
      {/* --- Ambient gradient mesh --- */}
      <div className="pointer-events-none absolute -z-20 inset-0 opacity-80">
        <div
          className="absolute -top-24 -left-24 h-[38rem] w-[38rem] rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(35%_35% at 50% 50%, rgba(0,255,224,0.25) 0%, rgba(0,255,224,0) 70%)",
          }}
        />
        <div
          className="absolute -bottom-24 -right-24 h-[40rem] w-[40rem] rounded-full blur-[140px]"
          style={{
            background:
              "radial-gradient(35%_35% at 50% 50%, rgba(255,0,204,0.22) 0%, rgba(255,0,204,0) 70%)",
          }}
        />
        <div
          className="absolute inset-0 m-auto h-[55rem] w-[55rem] rounded-full blur-[220px]"
          style={{
            background:
              "radial-gradient(35%_35% at 50% 50%, rgba(155,89,182,0.18) 0%, rgba(155,89,182,0) 70%)",
          }}
        />
      </div>

      {/* --- Animated conic glow layer --- */}
      <div
        className="pointer-events-none absolute -z-10 inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] animate-[spin_30s_linear_infinite]"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(0,255,224,0.15), rgba(168,85,247,0.15), rgba(255,0,204,0.15), rgba(0,255,224,0.15))",
        }}
      />

      {/* --- Subtle holographic grid --- */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px, 36px 36px",
          backgroundPosition: "-1px -1px",
        }}
      />

      {/* --- Floating gradient orbs for depth --- */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-[12%] left-[8%] h-28 w-28 rounded-full blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,255,224,0.5), rgba(168,85,247,0.35))",
        }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 2, delay: 0.2 }}
        className="absolute bottom-[14%] right-[10%] h-32 w-32 rounded-full blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,0,204,0.45), rgba(149, 225, 216, 0.35))",
        }}
      />

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
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-widest text-white shadow-2xl backdrop-blur-md backdrop-saturate-150 border border-white/10 bg-gradient-to-r from-indigo-600/70 via-fuchsia-600/70 to-cyan-500/70"
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
            // Base text gradient
            "text-transparent bg-clip-text bg-gradient-to-r from-[#00ffe0] via-[#a855f7] to-[#ff00cc]",
            // Glitch layer using ::before (relies on your existing animate-glitch keyframes)
            "before:content-['AI_Era_Has_Begun.'] before:absolute before:top-0 before:left-0 before:w-full before:h-full",
            "before:text-transparent before:bg-clip-text before:bg-gradient-to-r before:from-[#ff00cc] before:via-[#a855f7] before:to-[#00ffe0]",
            "before:opacity-50 before:mix-blend-screen before:animate-glitch"
          )}
        >
          AI Era Has Begun.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-4 text-base sm:text-lg md:text-xl text-gray-300/90 dark:text-gray-400 font-medium"
        >
          Stay tuned —{" "}
          <span className="text-indigo-300 font-semibold">the machines are thinking.</span>
        </motion.p>

        {/* Tool Buttons */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.98 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ delay: 1.2 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mx-auto"
        >
          {toolLinks?.map((tool, index) => (
            <Link
              key={index}
              to={tool.path}
              className={clsx(
                "group relative block rounded-2xl px-5 py-4 font-semibold text-base text-white shadow-xl",
                "bg-gradient-to-br ",
                tool.color,
                "ring-1 ring-white/10 hover:ring-2 hover:ring-white/20",
                "transition-transform duration-300 transform hover:scale-[1.03] active:scale-100",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 dark:focus:ring-cyan-400 focus:ring-offset-black/30",
                // Dark mode enhancements
                "dark:shadow-[0_0_20px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
              )}
            >
              <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-20 [background:linear-gradient(to_bottom,white,transparent_40%)] dark:[background:linear-gradient(to_bottom,rgba(255,255,255,0.1),transparent_40%)]" />
              <span className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300 [background:radial-gradient(40%_40%_at_50%_20%,rgba(255,255,255,0.35),transparent)] dark:[background:radial-gradient(40%_40%_at_50%_20%,rgba(255,255,255,0.25),transparent)]" />
              <span className="relative block text-center transition-all group-hover:tracking-wide">
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
          <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]" />
        </motion.div>
      </motion.section>

      {/* --- Vignette to focus content --- */}
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
    </main>
  );
}
