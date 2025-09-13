import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import {
  FaLinkedin,
  FaGithub,
  FaFacebook,
  FaInstagram,
  FaReact,
  FaNodeJs,
  FaBriefcase,
  FaGraduationCap,
  FaJs,
} from "react-icons/fa";
import {
  SiTensorflow,
  SiOpenai,
  SiExpress,
  SiMongodb,
  SiGraphql,
} from "react-icons/si";
import { motion, AnimatePresence, useInView } from "framer-motion";
import InitialLoader from "./InitialLoader";
import { useLocation } from "react-router-dom";
import AchievementsModal from "./AchievementsModal";

/* ===========================
   NEW: Your 7 gradients (light) + tuned dark variants
   - Light gradients: exact inputs you provided (used directly)
   - Dark gradients: hand-tuned darker cousins so contrast stays comfortable
   =========================== */
const lightGradients = [
  "linear-gradient(120deg, #a6c0fe 0%, #f68084 100%)",
  "linear-gradient(to right, #fa709a 0%, #fee140 100%)",
  "linear-gradient(to top, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(to right, #eea2a2 0%, #bbc1bf 19%, #57c6e1 42%, #b49fda 79%, #7ac5d8 100%)",
  "linear-gradient(to right, #f83600 0%, #f9d423 100%)",
  "linear-gradient(-20deg, #ddd6f3 0%, #faaca8 100%, #faaca8 100%)",
  "linear-gradient(-225deg, #69EACB 0%, #EACCF8 48%, #6654F1 100%)",
];

const darkGradients = [
  // 0 - deep cool dusk
  "linear-gradient(120deg, #12203a 0%, #4b2430 100%)",
  // 1 - ember dusk
  "linear-gradient(to right, #3b1f2a 0%, #4a3a12 100%)",
  // 2 - teal dusk
  "linear-gradient(to top, #0e3d3a 0%, #3f2d32 100%)",
  // 3 - complex slate dusk
  "linear-gradient(to right, #3a2424 0%, #2a3a3e 19%, #114f57 42%, #392a48 79%, #163537 100%)",
  // 4 - ember core
  "linear-gradient(to right, #5f1700 0%, #3b2b09 100%)",
  // 5 - muted lavender dusk
  "linear-gradient(-20deg, #2a2337 0%, #4c2b27 100%)",
  // 6 - deep ocean dusk
  "linear-gradient(-225deg, #0b3f37 0%, #2a163c 48%, #2a2149 100%)",
];

/* ===========================
   Skill icons map (unchanged)
   =========================== */
const skillIconMap = {
  JavaScript: <FaJs className="text-yellow-500 w-8 h-8" />,
  React: <FaReact className="text-cyan-500 w-8 h-8" />,
  "Node.js": <FaNodeJs className="text-green-600 w-8 h-8" />,
  Express: <SiExpress className="text-gray-700 dark:text-gray-200 w-8 h-8" />,
  MongoDB: <SiMongodb className="text-green-700 w-8 h-8" />,
  GraphQL: <SiGraphql className="text-pink-500 w-8 h-8" />,
  AI: <SiOpenai className="text-purple-600 w-8 h-8" />,
  ML: <SiTensorflow className="text-orange-500 w-8 h-8" />,
};

/* Tooltip + ScrollFadeIn components unchanged from your original */
const Tooltip = ({ children, content }) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white dark:bg-cyan-600 px-2 py-1 text-xs font-semibold shadow-md z-50 select-none pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900 dark:bg-cyan-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function ScrollFadeIn({ children, className = "" }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Shuffle helper (non-repeating playlist) */
function shuffledIndices(len) {
  const arr = Array.from({ length: len }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Portfolio() {
  const [data, setData] = useState(null);
  const [modalData, setModalData] = useState({
    isOpen: false,
    title: "",
    achievements: [],
  });
  const [showLoader, setShowLoader] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
    document.title = "Amritanshu Mishra's Portfolio";

    const loaderTimer = setTimeout(() => {
      setShowLoader(false);
    }, 1600);

    axios
      .get(`https://amiwrites-backend-app-2lp5.onrender.com/api/portfolio`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching portfolio:", err));

    return () => clearTimeout(loaderTimer);
  }, []);

  /* ===========================
     Background behavior (only this area changed)
     - smooth gentle drift (background-position only)
     - two-layer crossfade for smooth transitions
     - per-layer speeds differ for subtle parallax
     - dark-mode uses tuned dark gradient variants
     - overflow-x-hidden on main prevents horizontal scroll
     =========================== */
  const [isDark, setIsDark] = useState(false);

  // playlist & pointer
  const playlistRef = useRef(shuffledIndices(lightGradients.length));
  const ptrRef = useRef(0);

  // current index and frontVisible for crossfade
  const [currentIdx, setCurrentIdx] = useState(playlistRef.current[0] ?? 0);
  const [frontVisible, setFrontVisible] = useState(true);
  const intervalRef = useRef(null);

  // detect dark mode initially and on runtime toggles
  useEffect(() => {
    const checkDark = () =>
      setIsDark(document?.documentElement?.classList?.contains?.("dark") ?? false);

    checkDark();
    const obs = new MutationObserver(() => checkDark());
    if (document?.documentElement) {
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }
    return () => obs.disconnect();
  }, []);

  // keyframes: gentle, very slow drift (background-position only)
  const styleTag = `
    @keyframes bgDrift {
      0% { background-position: 10% 50%; }
      50% { background-position: 90% 50%; }
      100% { background-position: 10% 50%; }
    }
  `;

  const incrementPtr = () => {
    ptrRef.current = (ptrRef.current + 1) % playlistRef.current.length;
    return playlistRef.current[ptrRef.current];
  };

  // auto-rotate (disabled in dark for stability; enable if you prefer)
  useEffect(() => {
    if (isDark) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // sync pointer with current
    const pos = playlistRef.current.indexOf(currentIdx);
    ptrRef.current = pos >= 0 ? pos : 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setFrontVisible(true);
      setTimeout(() => {
        const next = incrementPtr();
        setCurrentIdx(next);
        setTimeout(() => setFrontVisible(false), 140);
      }, 110);
    }, 11_000); // comfortable 11s cadence

    return () => clearInterval(intervalRef.current);
  }, [isDark, currentIdx]);

  // initial reveal so crossfade is visible on first paint
  useEffect(() => {
    const t = setTimeout(() => setFrontVisible(false), 160);
    return () => clearTimeout(t);
  }, []);

  // front/back gradient strings depending on mode
  const frontBg = useMemo(() => (isDark ? darkGradients[currentIdx] : lightGradients[currentIdx]), [
    currentIdx,
    isDark,
  ]);
  const nextIdx = useMemo(
    () => (isDark ? currentIdx : playlistRef.current[(ptrRef.current + 1) % playlistRef.current.length]),
    [currentIdx, isDark]
  );
  const backBg = useMemo(() => (isDark ? darkGradients[nextIdx] : lightGradients[nextIdx]), [nextIdx, isDark]);

  // layer style factory: only background-position animates (no layout changes)
  const makeLayerStyle = (bg, speed = 32, blend = "normal") => ({
    backgroundImage: bg,
    backgroundSize: "220% 220%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "10% 50%",
    animation: `bgDrift ${speed}s cubic-bezier(.2,.7,.2,1) infinite`,
    backgroundBlendMode: blend,
    willChange: "background-position, opacity",
    overflow: "hidden",
  });

  // subtle focus vignette (above bg layers, below content)
  const vignetteStyle = {
    position: "absolute",
    inset: 0,
    zIndex: -5,
    pointerEvents: "none",
    background: "radial-gradient(60% 60% at 50% 45%, rgba(255,255,255,0.04), rgba(0,0,0,0.06) 75%)",
    mixBlendMode: "soft-light",
  };

  // Keep existing scroll-to-top behavior on navigation (unchanged)
  useEffect(() => {
    const scrollContainer = document.querySelector(".h-screen.overflow-y-scroll.relative");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  if (!data || showLoader) return <InitialLoader />;

  const openModal = (title, achievements) => setModalData({ isOpen: true, title, achievements });
  const closeModal = () => setModalData({ isOpen: false, title: "", achievements: [] });

  return (
    <>
      {/* gentle background drift keyframes */}
      <style>{styleTag}</style>

      <main className="relative min-h-screen p-4 sm:p-8 md:p-12 flex justify-center items-center overflow-x-hidden">
        {/* BACK LAYER: slower drift (depth) */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 transition-opacity duration-[1000ms] ease-out"
          style={makeLayerStyle(backBg, isDark ? 48 : 40, "normal")}
        />

        {/* FRONT LAYER: slightly faster drift and crossfades */}
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 transition-opacity duration-[1000ms] ease-out ${
            frontVisible ? "opacity-100" : "opacity-0"
          }`}
          style={makeLayerStyle(frontBg, isDark ? 36 : 28, "overlay")}
        />

        {/* vignette to softly focus center */}
        <div aria-hidden style={vignetteStyle} />

        {/* CONTENT: unchanged */}
        <article className="bg-white dark:bg-zinc-900 text-black dark:text-white bg-opacity-90 backdrop-blur-md rounded-xl shadow-xl max-w-4xl w-full p-6 md:p-10">
          <section className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <motion.img
              src={`https://amiwrites-backend-app-2lp5.onrender.com${data.photoUrl}`}
              alt="Amritanshu Mishra"
              loading="eager"
              width={192}
              height={192}
              className="rounded-3xl object-cover shadow-lg border-4 border-cyan-300 w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-cyan-900 dark:text-cyan-300 leading-tight">
                {data.name}
              </h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-cyan-700 dark:text-cyan-400 mt-1">
                {data.title}
              </h2>
              <p className="text-cyan-800 dark:text-cyan-200 italic mt-3 max-w-md mx-auto sm:mx-0 leading-relaxed">
                {data.description}
              </p>
              <div className="mt-4 space-y-1 text-cyan-700 dark:text-cyan-300 font-medium text-sm sm:text-base max-w-md mx-auto sm:mx-0">
                <p>✉️ {data.email}</p>
                <p>📞 {data.phone}</p>
              </div>
              <nav className="flex justify-center sm:justify-start gap-6 mt-5 text-2xl">
                <motion.a
                  href={data.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="cursor-pointer text-cyan-600 dark:text-cyan-400 transition-colors hover:text-blue-700"
                >
                  <FaLinkedin />
                </motion.a>

                <motion.a
                  href={data.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="cursor-pointer text-cyan-600 dark:text-cyan-400 transition-colors hover:text-gray-800"
                >
                  <FaGithub />
                </motion.a>

                <motion.a
                  href={data.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="cursor-pointer text-cyan-600 dark:text-cyan-400 transition-colors hover:text-pink-500"
                >
                  <FaInstagram />
                </motion.a>

                <motion.a
                  href={data.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="cursor-pointer text-cyan-600 dark:text-cyan-400 transition-colors hover:text-blue-600"
                >
                  <FaFacebook />
                </motion.a>
              </nav>
            </div>
          </section>

          {/* Skills */}
          <ScrollFadeIn className="mt-10">
            <h3 className="text-3xl font-bold text-cyan-800 dark:text-cyan-300 mb-6 border-b-4 border-cyan-300 dark:border-cyan-600 inline-block pb-1">
              Skills
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5">
              {data.skills.map(({ skill, expertise }) => (
                <Tooltip key={skill} content={expertise} placement="top">
                  <div
                    className="group h-[110px] w-[110px] bg-white dark:bg-zinc-800 rounded-xl shadow-sm hover:shadow-lg hover:shadow-cyan-300/30 transition-transform duration-300 ease-in-out hover:scale-105 flex flex-col items-center justify-center mx-auto relative cursor-pointer"
                    tabIndex={0}
                  >
                    <div className="w-8 h-8 mb-2 flex items-center justify-center transition-transform duration-500 group-hover:rotate-3">
                      {skillIconMap[skill] ?? (
                        <span className="text-cyan-700 dark:text-cyan-300 text-sm">?</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center truncate px-2">
                      {skill}
                    </span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </ScrollFadeIn>

          {/* Experience */}
          <ScrollFadeIn className="mt-10">
            <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300 mb-4 border-b-2 border-cyan-300 dark:border-cyan-600 pb-1 flex items-center gap-2">
              <FaBriefcase /> Experience
            </h3>
            <div className="space-y-6 max-w-md">
              {data.experience.map(
                ({ company, role, duration, description, achievements }, i) => (
                  <article key={i} className="border-l-4 border-cyan-400 dark:border-cyan-600 pl-4">
                    <h4 className="text-xl font-semibold text-cyan-900 dark:text-cyan-200">{role}</h4>
                    <p className="italic text-gray-600 dark:text-gray-400 mb-1">{company} • {duration}</p>
                    <p className="text-cyan-800 dark:text-cyan-300">{description}</p>
                    {achievements?.length > 0 && (
                      <button
                        onClick={() => openModal(`${role} at ${company} - Achievements`, achievements)}
                        className="mt-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-100 font-semibold underline"
                      >
                        View Achievements
                      </button>
                    )}
                  </article>
                )
              )}
            </div>
          </ScrollFadeIn>

          {/* Education */}
          <ScrollFadeIn className="mt-10">
            <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300 mb-4 border-b-2 border-cyan-300 dark:border-cyan-600 pb-1 flex items-center gap-2">
              <FaGraduationCap /> Education
            </h3>
            <div className="space-y-6 max-w-md">
              {data.education.map(
                ({ institution, degree, duration, achievements }, i) => (
                  <article key={i} className="border-l-4 border-cyan-400 dark:border-cyan-600 pl-4">
                    <h4 className="text-xl font-semibold text-cyan-900 dark:text-cyan-200">{degree}</h4>
                    <p className="italic text-gray-600 dark:text-gray-400 mb-1">{institution} • {duration}</p>
                    {achievements?.length > 0 && (
                      <button
                        onClick={() => openModal(`${degree} at ${institution} - Achievements`, achievements)}
                        className="mt-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-100 font-semibold underline"
                      >
                        View Achievements
                      </button>
                    )}
                  </article>
                )
              )}
            </div>
          </ScrollFadeIn>
        </article>
      </main>

      <AchievementsModal isOpen={modalData.isOpen} onClose={closeModal} title={modalData.title} achievements={modalData.achievements} />
    </>
  );
}
