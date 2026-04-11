import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FaLinkedin,
  FaGithub,
  FaInstagram,
  FaFacebook,
  FaBriefcase,
  FaGraduationCap,
  FaReact,
  FaNodeJs,
  FaJs,
  FaFileAlt,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import {
  SiMongodb,
  SiExpress,
  SiGraphql,
  SiOpenai,
  SiTensorflow,
} from "react-icons/si";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import InitialLoader from "./InitialLoader";
import AchievementsModal from "./AchievementsModal";
import { FaCalendarAlt } from "react-icons/fa";

/* ================= ICON MAP ================= */
const skillIconMap = {
  JavaScript: <FaJs />,
  React: <FaReact />,
  "Node.js": <FaNodeJs />,
  MongoDB: <SiMongodb />,
  Express: <SiExpress />,
  GraphQL: <SiGraphql />,
  AI: <SiOpenai />,
  ML: <SiTensorflow />,
};

const companyLogoMap = {
  ConQsys: "/ConQsysLogo-Red.png",
  GlobalLogic: "/GL.png",
};

const socialColors = {
  LinkedIn: "text-[#0A66C2]",
  GitHub: "text-[#181717] dark:text-white",
  Instagram: "text-[#E4405F]",
  Facebook: "text-[#1877F2]",
};

const skillColors = {
  JavaScript: "text-[#F7DF1E]",
  React: "text-[#61DAFB]",
  "Node.js": "text-[#339933]",
  MongoDB: "text-[#47A248]",
  Express: "text-black dark:text-white",
  GraphQL: "text-[#E10098]",
  AI: "text-[#10A37F]",
  ML: "text-[#FF6F00]",
};

const getScrollParent = (element) => {
  let current = element?.parentElement;

  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;

    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return window;
};

const getSectionTop = (element, scrollParent) => {
  const rect = element.getBoundingClientRect();

  if (scrollParent === window) {
    return rect.top + window.scrollY;
  }

  const parentRect = scrollParent.getBoundingClientRect();
  return rect.top - parentRect.top + scrollParent.scrollTop;
};

const getPortfolioScrollParent = (pageElement) => {
  const selectorCandidates = [
    ".h-screen.overflow-y-scroll.relative",
    ".h-screen.overflow-y-scroll",
    "[data-scroll-container]",
    ".app-scroll-container",
  ];

  for (const selector of selectorCandidates) {
    const candidate = document.querySelector(selector);
    if (candidate) return candidate;
  }

  return getScrollParent(pageElement);
};

/* ================= TOOLTIP ================= */
const Tooltip = React.memo(({ children, content }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex justify-center">
      <motion.div
        onHoverStart={() => setShow(true)}
        onHoverEnd={() => setShow(false)}
        onTap={() => setShow((prev) => !prev)}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute -top-9 z-20
                        bg-black text-white dark:bg-white dark:text-black
                        text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ================= ANIMATED BANNER ================= */
const AnimatedBanner = React.memo(({ scrollRoot }) => {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    margin: "-120px",
    root: scrollRoot ?? undefined,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: 40 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <img
        src="/banner.png"
        alt="Amritanshu Mishra Banner"
        width="1920"
        height="640"
        className="
            w-full
            h-auto
            object-cover
            shadow-xl
          "
        loading="lazy"
        decoding="async"
      />
    </motion.div>
  );
});

/* ================= FADE ROW ================= */
const FadeRow = React.memo(({ children, scrollRoot }) => {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    margin: "-160px",
    root: scrollRoot ?? undefined,
  });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
});

/* ================= SOCIAL MODAL ================= */
const SocialModal = ({ isOpen, onClose, platform, url, icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 rounded-xl p-5 w-[280px] text-center"
      >
        <div className="text-2xl mb-2">{icon}</div>
        <h3 className="text-sm font-semibold mb-1">{platform}</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
          Open profile in a new tab?
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700"
          >
            Cancel
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 text-xs rounded bg-black text-white dark:bg-white dark:text-black"
          >
            Open
          </a>
        </div>
      </motion.div>
    </div>
  );
};

const sectionMeta = [
  { id: "intro", label: "Intro" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
];
const MIN_LOADER_DURATION_MS = 2500;
const RESUME_URL =
  "https://amiwrites-backend-app-2lp5.onrender.com/images/Resume.pdf";

/* ================= MAIN ================= */
export default function PortfolioDetails() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false });
  const [isDark, setIsDark] = useState(false);
  const [socialModal, setSocialModal] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);
  const [hideArrow, setHideArrow] = useState(true);
  const [activeSection, setActiveSection] = useState("intro");
  const [isBottomCtaExpanded, setIsBottomCtaExpanded] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [scrollRoot, setScrollRoot] = useState(null);
  const prefersReducedMotion = useReducedMotion();
  const pageRef = useRef(null);
  const bottomCtaRef = useRef(null);
  const sectionRefs = useRef({});
  const hasScrolledRef = useRef(false);

  const heroRef = useRef(null);
  const portfolioBackgroundLightImage = `${process.env.PUBLIC_URL}/ny-bg.png`;
  const portfolioBackgroundDarkImage = `${process.env.PUBLIC_URL}/ny-dark.jpg`;
  const activeSectionMeta = useMemo(
    () => sectionMeta.find((section) => section.id === activeSection) || sectionMeta[0],
    [activeSection],
  );

  const scrollToSection = useCallback((sectionId) => {
    const targetSection = sectionRefs.current[sectionId];

    if (!targetSection) return;

    const scrollParent = getPortfolioScrollParent(pageRef.current);
    const targetTop = getSectionTop(targetSection, scrollParent);
    const sectionOffset = 96;
    const scrollTarget = Math.max(targetTop - sectionOffset, 0);

    setActiveSection(sectionId);

    if (scrollParent === window) {
      window.scrollTo({ top: scrollTarget, behavior: "smooth" });
      return;
    }

    scrollParent.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, []);

  const heroScroll = useScroll({
    target: heroRef,
offset: ["start start", "0.4 end"],




  });



const imageScale = useTransform(
  heroScroll.scrollYProgress,
  [0, 0.2],
  [1.05, 1]
);
const textY = useTransform(
  heroScroll.scrollYProgress,
  [0, 0.2],
  [0, -30]
);


 const textOpacity = useTransform(
  heroScroll.scrollYProgress,
  [0, 0.4],
  [1, 0.65],
);

  const nameHeartbeatAnimation = prefersReducedMotion
    ? undefined
    : {
        scale: [1, 1.018, 1, 1.038, 1],
      };

  const nameHeartbeatTransition = prefersReducedMotion
    ? undefined
    : {
        duration: 2.6,
        times: [0, 0.18, 0.36, 0.54, 1],
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0.35,
      };

  useEffect(() => {
    const sync = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const scrollParent = getPortfolioScrollParent(pageRef.current);
    setScrollRoot(scrollParent === window ? null : scrollParent);
  }, []);
  useEffect(() => {
    const scrollParent = getPortfolioScrollParent(pageRef.current);
    const target = scrollParent === window ? window : scrollParent;
    let rafId = null;

    const updateArrowVisibility = () => {
      const scrollTop = scrollParent === window ? window.scrollY : scrollParent.scrollTop;
      const clientHeight =
        scrollParent === window ? window.innerHeight : scrollParent.clientHeight;
      const scrollHeight =
        scrollParent === window
          ? document.documentElement.scrollHeight
          : scrollParent.scrollHeight;

      if (scrollTop > 10 && !hasScrolledRef.current) {
        hasScrolledRef.current = true;
      }

      const atBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
      setHideArrow(!(hasScrolledRef.current && !atBottom));
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateArrowVisibility();
      });
    };

    updateArrowVisibility();
    target.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    const loadStart = Date.now();
    let loaderTimeout;
    let isCancelled = false;

    const finishLoading = () => {
      const elapsed = Date.now() - loadStart;
      const remaining = Math.max(MIN_LOADER_DURATION_MS - elapsed, 0);

      loaderTimeout = setTimeout(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      }, remaining);
    };

    axios
      .get("https://amiwrites-backend-app-2lp5.onrender.com/api/portfolio", {
        signal: controller.signal,
      })
      .then((res) => {
        setData(res.data);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setData(null);
      })
      .finally(() => {
        finishLoading();
      });

    return () => {
      isCancelled = true;
      controller.abort();
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
      }
    };
  }, []);

  useEffect(() => {
    if (loading || !data) return;

    const sections = sectionMeta
      .map(({ id }) => ({ id, element: sectionRefs.current[id] }))
      .filter((section) => section.element);

    if (!sections.length) return;

    const scrollParent = getPortfolioScrollParent(pageRef.current);

    const updateActiveSection = () => {
      const currentScroll =
        scrollParent === window ? window.scrollY : scrollParent.scrollTop;
      const viewportHeight =
        scrollParent === window ? window.innerHeight : scrollParent.clientHeight;
      const scrollHeight =
        scrollParent === window
          ? document.documentElement.scrollHeight
          : scrollParent.scrollHeight;
      const marker = currentScroll + Math.min(viewportHeight * 0.25, 160);
      const isNearBottom = currentScroll + viewportHeight >= scrollHeight - 8;

      let nextActiveSection = sections[0].id;

      if (isNearBottom) {
        nextActiveSection = sections[sections.length - 1].id;
      } else {
        for (const section of sections) {
          const sectionTop = getSectionTop(section.element, scrollParent);

          if (sectionTop <= marker) {
            nextActiveSection = section.id;
          } else {
            break;
          }
        }
      }

      setActiveSection((prev) =>
        prev === nextActiveSection ? prev : nextActiveSection,
      );
    };

    updateActiveSection();

    if (scrollParent === window) {
      window.addEventListener("scroll", updateActiveSection, { passive: true });
    } else {
      scrollParent.addEventListener("scroll", updateActiveSection, {
        passive: true,
      });
    }

    window.addEventListener("resize", updateActiveSection);

    return () => {
      if (scrollParent === window) {
        window.removeEventListener("scroll", updateActiveSection);
      } else {
        scrollParent.removeEventListener("scroll", updateActiveSection);
      }

      window.removeEventListener("resize", updateActiveSection);
    };
  }, [data, loading]);

  const socialProfiles = useMemo(
    () =>
      data
        ? [
            {
              name: "LinkedIn",
              icon: <FaLinkedin size={28} />,
              url: data.socialLinks.linkedin,
            },
            {
              name: "GitHub",
              icon: <FaGithub size={28} />,
              url: data.socialLinks.github,
            },
            {
              name: "Instagram",
              icon: <FaInstagram size={28} />,
              url: data.socialLinks.instagram,
            },
            {
              name: "Facebook",
              icon: <FaFacebook size={28} />,
              url: data.socialLinks.facebook,
            },
          ]
        : [],
    [
      data?.socialLinks?.facebook,
      data?.socialLinks?.github,
      data?.socialLinks?.instagram,
      data?.socialLinks?.linkedin,
    ],
  );



  const heroImageUrl = useMemo(() => {
    if (!data) return "";

    return `https://amiwrites-backend-app-2lp5.onrender.com${
      isDark ? data.photoUrlDark : data.photoUrl
    }`;
  }, [data, isDark]);

  useEffect(() => {
    if (!heroImageUrl) return;

    setImageLoaded(false);

    const heroImage = new Image();
    heroImage.decoding = "async";
    heroImage.fetchPriority = "high";
    heroImage.src = heroImageUrl;

    const markLoaded = () => setImageLoaded(true);

    if (heroImage.complete) {
      markLoaded();
      return;
    }

    heroImage.addEventListener("load", markLoaded);

    return () => {
      heroImage.removeEventListener("load", markLoaded);
    };
  }, [heroImageUrl]);

  useEffect(() => {
    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://amiwrites-backend-app-2lp5.onrender.com";
    preconnect.crossOrigin = "anonymous";

    document.head.appendChild(preconnect);

    if (heroImageUrl) {
      const preloadImage = document.createElement("link");
      preloadImage.rel = "preload";
      preloadImage.as = "image";
      preloadImage.href = heroImageUrl;
      preloadImage.fetchPriority = "high";
      document.head.appendChild(preloadImage);

      return () => {
        document.head.removeChild(preconnect);
        document.head.removeChild(preloadImage);
      };
    }

    return () => {
      document.head.removeChild(preconnect);
    };
  }, [heroImageUrl]);

  useEffect(() => {
    const collapseTimer = window.setTimeout(() => {
      setIsBottomCtaExpanded(false);
    }, 2000);

    return () => {
      window.clearTimeout(collapseTimer);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const updateTouchMode = () => {
      setIsTouchDevice(mediaQuery.matches);
    };

    updateTouchMode();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateTouchMode);
      return () => mediaQuery.removeEventListener("change", updateTouchMode);
    }

    mediaQuery.addListener(updateTouchMode);
    return () => mediaQuery.removeListener(updateTouchMode);
  }, []);

  useEffect(() => {
    if (!isTouchDevice || !isBottomCtaExpanded) return;

    const handlePointerDownOutside = (event) => {
      if (!bottomCtaRef.current) return;
      if (bottomCtaRef.current.contains(event.target)) return;
      setIsBottomCtaExpanded(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [isBottomCtaExpanded, isTouchDevice]);

  useEffect(() => {
    let cancelled = false;

    const preloadBackground = (src) =>
      new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.src = src;

        if (image.complete) {
          resolve();
          return;
        }

        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });

    setBackgroundImageLoaded(false);

    Promise.all([
      preloadBackground(portfolioBackgroundLightImage),
      preloadBackground(portfolioBackgroundDarkImage),
    ]).finally(() => {
      if (!cancelled) {
        setBackgroundImageLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [portfolioBackgroundDarkImage, portfolioBackgroundLightImage]);

  if (loading || !data) return <InitialLoader />;

  const [firstName, lastName] = data.name.split(" ");

  return (
    <main
      ref={pageRef}
      className="relative isolate w-full overflow-hidden text-zinc-900 dark:text-zinc-100"
    >
      {/* ===== PREMIUM NY BACKGROUND ===== */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center will-change-transform transition-opacity duration-500"
          style={{
            backgroundImage: `url(${portfolioBackgroundLightImage})`,
            opacity: backgroundImageLoaded && !isDark ? 1 : 0,
            transform: "translateZ(0)",
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center will-change-transform transition-opacity duration-500"
          style={{
            backgroundImage: `url(${portfolioBackgroundDarkImage})`,
            opacity: backgroundImageLoaded && isDark ? 1 : 0,
            transform: "translateZ(0)",
          }}
        />

        {/* corporate neutral tint (not too white, not too dark) */}
        <div className="absolute inset-0 bg-white/25 dark:bg-black/35" />

        {/* slightly stronger corporate tint */}
        <div className="absolute inset-0 bg-white/35 dark:bg-black/45" />

        {/* stronger readability but still elegant */}
        <div
          className="absolute inset-0 bg-gradient-to-b 
    from-white/20 
    via-transparent 
    to-white/55 
    dark:from-black/40 
    dark:to-black/80"
        />

        {/* subtle corporate depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.28)]" />
      </div>

      {/* PAGE HEIGHT WRAPPER (controls sticky duration) */}
     <div className="relative z-10">

        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 w-full px-3 sm:px-6">
          <motion.div
            ref={bottomCtaRef}
            layout
            transition={{
              layout: { type: "spring", stiffness: 220, damping: 28, mass: 0.95 },
            }}
            onMouseEnter={
              isTouchDevice ? undefined : () => setIsBottomCtaExpanded(true)
            }
            onMouseLeave={
              isTouchDevice ? undefined : () => setIsBottomCtaExpanded(false)
            }
            onFocusCapture={
              isTouchDevice ? undefined : () => setIsBottomCtaExpanded(true)
            }
            onBlurCapture={
              isTouchDevice
                ? undefined
                : (event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsBottomCtaExpanded(false);
                    }
                  }
            }
            className="mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-full border border-sky-200/70 bg-sky-50/90 p-1.5 shadow-[0_12px_30px_rgba(14,116,144,0.2)] ring-1 ring-white/55 backdrop-blur-2xl dark:border-sky-400/35 dark:bg-slate-900/85 dark:ring-sky-200/15"
            initial={
              prefersReducedMotion
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0.96, y: 6, scale: 0.985 }
            }
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!isBottomCtaExpanded ? (
                <motion.button
                  key="collapsed-cta"
                  layout="position"
                  type="button"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setIsBottomCtaExpanded(true)}
                  onPointerDown={(event) => {
                    if (event.pointerType === "touch") {
                      setIsBottomCtaExpanded(true);
                    }
                  }}
                  whileHover={isTouchDevice ? undefined : { scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-sky-100/85 dark:text-sky-100 dark:hover:bg-sky-500/20 sm:text-sm"
                  aria-label={`Expand section switcher. Current section is ${activeSectionMeta.label}`}
                >
                  <span className="text-slate-500 dark:text-sky-200/70">Jump to</span>
                  <span className="rounded-full bg-sky-700 px-2.5 py-1 text-white shadow-sm transition-colors duration-200 dark:bg-sky-300 dark:text-slate-900">
                    {activeSectionMeta.label}
                  </span>
                  <FaChevronUp className="text-[10px] text-slate-500 transition-transform duration-200 group-hover:-translate-y-0.5 dark:text-sky-200/80" />
                </motion.button>
              ) : (
                <motion.div
                  key="expanded-cta"
                  layout="position"
                  initial={{ opacity: 0, y: 6, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-1.5"
                >
                  {sectionMeta.map((section, index) => {
                    const isActive = activeSection === section.id;

                    return (
                      <motion.button
                        key={section.id}
                        type="button"
                        aria-current={isActive ? "page" : undefined}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.32,
                          delay: 0.04 * index,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        whileHover={isTouchDevice ? undefined : { y: -1, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          scrollToSection(section.id);
                          setIsBottomCtaExpanded(false);
                        }}
                        className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 sm:px-3 sm:text-sm ${
                          isActive
                            ? "bg-sky-700 text-white shadow-[0_6px_18px_rgba(3,105,161,0.32)] dark:bg-sky-300 dark:text-slate-900 dark:shadow-[0_6px_18px_rgba(56,189,248,0.2)]"
                            : "text-slate-600 hover:bg-sky-100/85 dark:text-sky-100/90 dark:hover:bg-sky-500/20"
                        }`}
                      >
                        {section.label}
                      </motion.button>
                    );
                  })}
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={isTouchDevice ? undefined : { y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsBottomCtaExpanded(false)}
                    aria-label="Collapse section switcher"
                    className="rounded-full p-2 text-slate-500 transition-all duration-200 hover:bg-sky-100/85 hover:text-slate-700 dark:text-sky-100/80 dark:hover:bg-sky-500/20 dark:hover:text-sky-100"
                  >
                    <FaChevronDown className="text-[10px]" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ================= STICKY SCROLL INDICATOR ================= */}
        <motion.div
          className="
      fixed top-24 left-1/2 -translate-x-1/2
      z-20 text-zinc-700 dark:text-white/70
      text-center pointer-events-none
    "
          animate={{
            opacity: hideArrow ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-[10px] tracking-widest uppercase mb-2">
            Scroll
          </div>

          <div className="flex flex-col items-center leading-none">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="text-lg"
                animate={{ y: [0, 10, 0], opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.4,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                ↓
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ================= HERO ================= */}
<section
  ref={heroRef}
className="relative w-full
min-h-[90vh] 
md:min-h-[110vh] 
lg:min-h-[108vh] 
xl:min-h-[114vh]"

>




          <motion.div
           style={{ scale: imageScale }}
className="sticky top-0 w-full
h-[55vh] 
md:h-[80vh] 
lg:h-[74vh] 
xl:h-[78vh] 
overflow-hidden z-10"





          >
            <motion.img
              src={heroImageUrl}
              alt={data.name}
              width="1920"
              height="1080"
              onLoad={() => setImageLoaded(true)}
              initial={false}
              animate={{
                opacity: imageLoaded ? 1 : 0,
                scale: 1,
              }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="
    w-full
    h-full
    object-cover
    object-[center_16%] md:object-[center_17%] lg:object-[center_24%]
    block
   transform-gpu 
   will-change-transform

  "
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/95" />
          </motion.div>

          <motion.div
            style={{ y: textY, opacity: textOpacity }}
           className="pointer-events-none sticky top-0 
h-[22vh] 
md:h-[32vh] 
lg:h-[42vh] 
xl:h-[52vh] 
flex items-center px-6 md:px-20 z-10"


          >
 <motion.h1
  animate={nameHeartbeatAnimation}
  transition={nameHeartbeatTransition}
  style={{ transformOrigin: "left center" }}
  className="
leading-[0.85]
font-extrabold
tracking-[-0.045em]

text-zinc-900 dark:text-white

text-[15vw]
sm:text-[12vw]
md:text-[10vw]
lg:text-[8.5vw]
xl:text-[7vw]

[font-variation-settings:'wght'_840]
antialiased

drop-shadow-[0_30px_80px_rgba(0,0,0,0.55)]
dark:drop-shadow-[0_30px_80px_rgba(0,0,0,0.8)]
dark:[text-shadow:0_0_25px_rgba(255,255,255,0.35)]
"
>
  <motion.span
    className="block"
    animate={
      prefersReducedMotion
        ? undefined
        : {
            opacity: [1, 0.96, 1, 0.94, 1],
          }
    }
    transition={
      prefersReducedMotion
        ? undefined
        : {
            duration: 2.6,
            times: [0, 0.18, 0.36, 0.54, 1],
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.35,
          }
    }
  >
    {firstName}
  </motion.span>
  <motion.span
    className="block"
    animate={
      prefersReducedMotion
        ? undefined
        : {
            opacity: [1, 0.97, 1, 0.95, 1],
          }
    }
    transition={
      prefersReducedMotion
        ? undefined
        : {
            duration: 2.6,
            times: [0, 0.18, 0.36, 0.54, 1],
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.35,
          }
    }
  >
    {lastName}
  </motion.span>
</motion.h1>


          </motion.div>
        </section>
        {/* ================= BRAND BANNER ================= */}
        <section className="w-full overflow-hidden bg-white dark:bg-black py-12 md:py-16">
          <AnimatedBanner scrollRoot={scrollRoot} />
        </section>

        {/* ================= INTRO ================= */}
        <section
          id="intro"
          ref={(el) => {
            sectionRefs.current.intro = el;
          }}
          className="px-6 md:px-20 py-14 md:py-16 border-b border-zinc-200 dark:border-zinc-800"
        >
          <FadeRow scrollRoot={scrollRoot}>
            <div className="max-w-4xl space-y-4">
              <p className="text-lg md:text-xl font-medium leading-relaxed">
                {data.description}
              </p>
              <div className="flex gap-4 text-zinc-500">
                {socialProfiles.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setSocialModal(s)}
                    aria-label={`Open ${s.name}`}
                    className={`${socialColors[s.name]} hover:scale-110 transition-transform`}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => scrollToSection("experience")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-300/70 bg-white/80 px-5 text-sm font-semibold tracking-wide transition-all hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:hover:bg-zinc-800 sm:w-auto"
                >
                  Explore my experience
                  <span>→</span>
                </button>

                <a
                  href={RESUME_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-zinc-300/70 bg-white/90 px-5 text-sm font-semibold tracking-wide text-zinc-900 shadow-[0_10px_28px_rgba(24,24,27,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white hover:shadow-[0_16px_34px_rgba(24,24,27,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:shadow-[0_10px_26px_rgba(0,0,0,0.45)] dark:hover:border-zinc-500 dark:hover:bg-zinc-900 dark:hover:shadow-[0_16px_34px_rgba(0,0,0,0.6)] dark:focus-visible:ring-zinc-300 dark:focus-visible:ring-offset-zinc-900 sm:w-auto sm:px-6"
                  aria-label="Open resume in a new tab"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-r from-zinc-100 via-white to-zinc-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800"
                  />
                  <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 shadow-sm transition-all duration-300 group-hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900">
                    <FaFileAlt className="text-[0.7rem]" />
                  </span>
                  <span className="relative">
                    View my resume
                  </span>
                  <span className="relative text-xs opacity-70 transition-transform duration-300 group-hover:translate-x-0.5">
                    ↗
                  </span>
                </a>
              </div>
            </div>
          </FadeRow>
        </section>

        {/* ================= SKILLS ================= */}
        <section
          id="skills"
          ref={(el) => {
            sectionRefs.current.skills = el;
          }}
          className="px-6 md:px-20 py-14 md:py-16 border-b border-zinc-200 dark:border-zinc-800"
        >
          <FadeRow scrollRoot={scrollRoot}>
            <h2 className="text-xl md:text-2xl font-semibold mb-8">
              01 — Skills
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-6">
              {data.skills.map(({ skill, expertise }) => (
                <Tooltip key={skill} content={expertise}>
                  <motion.div
                    whileHover={{ scale: 1.06, y: -6 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="
    group relative
    flex flex-col items-center justify-center
    w-[115px] h-[115px]
    gap-2 p-4
    rounded-3xl cursor-pointer
    border border-zinc-200/70 dark:border-zinc-800
    bg-white/70 dark:bg-zinc-900/50
    backdrop-blur-xl
    transition-all duration-300

    hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)]
    dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]
    hover:border-zinc-300 dark:hover:border-zinc-600
  "
                  >
                    <div className={`text-3xl ${skillColors[skill]}`}>
                      {skillIconMap[skill]}
                    </div>
                    <span className="text-sm font-semibold text-center leading-tight">
                      {skill}
                    </span>
                  </motion.div>
                </Tooltip>
              ))}
            </div>
          </FadeRow>
        </section>

        {/* ================= EXPERIENCE ================= */}
        <section
          id="experience"
          ref={(el) => {
            sectionRefs.current.experience = el;
          }}
          className="px-6 md:px-20 py-14 md:py-16 border-b border-zinc-200 dark:border-zinc-800"
        >
          <FadeRow scrollRoot={scrollRoot}>
            <h2 className="text-xl md:text-2xl font-semibold mb-8 flex items-center gap-2">
              <FaBriefcase /> 02 — Experience
            </h2>

            {data.experience.map((exp, i) => (
              <div
                key={i}
                className="grid sm:grid-cols-[160px_1fr] sm:grid-cols-[160px_1fr] md:grid-cols-[220px_1fr] gap-8 pb-10
                            border-b border-zinc-200 dark:border-zinc-800 last:border-none"
              >
                <div className="flex items-center gap-2 text-sm text-zinc-500">
  <FaCalendarAlt className="text-zinc-400 dark:text-zinc-500 text-xs" />
  <span>{exp.duration}</span>
</div>
                <div>
                  <div className="flex items-center gap-3">
                    {companyLogoMap[exp.company] && (
                <img
  src={companyLogoMap[exp.company]}
  alt={exp.company}
  decoding="async"
  loading="lazy"
  className="
    w-10 h-10 rounded-2xl object-contain
    bg-white/70 dark:bg-zinc-900/60
    backdrop-blur-xl
    p-2
    border border-zinc-200/70 dark:border-zinc-700/60

    shadow-[0_4px_15px_rgba(0,0,0,0.08)]
    dark:shadow-[0_6px_20px_rgba(0,0,0,0.5)]

    transition-all duration-300
    group-hover:scale-110
    group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)]
  "
/>

                    )}

                    <div>
                      <h3 className="text-lg font-semibold">{exp.role}</h3>
                      <p className="text-sm text-zinc-500">{exp.company}</p>
                    </div>
                  </div>

                  <p className="mt-2 text-base">{exp.description}</p>

                  {exp.achievements?.length > 0 && (
                  <motion.button
  whileHover={{ x: 4 }}
  whileTap={{ scale: 0.97 }}
  className="
    group mt-4 inline-flex items-center gap-2
    px-3 py-1.5
    text-xs font-semibold tracking-wide

    rounded-full
    border border-zinc-200 dark:border-zinc-700

    bg-white/60 dark:bg-zinc-900/50
    backdrop-blur-xl

    text-zinc-700 dark:text-zinc-300
    transition-all duration-300

    hover:bg-white dark:hover:bg-zinc-800
    hover:border-zinc-300 dark:hover:border-zinc-600

    shadow-sm hover:shadow-md
  "
  onClick={() =>
    setModal({
      isOpen: true,
      title: `${exp.role} @ ${exp.company}`,
      achievements: exp.achievements,
    })
  }
>
  View achievements

  <span
    className="
      transition-transform duration-300
      group-hover:translate-x-1
    "
  >
    →
  </span>
</motion.button>

                  )}
                </div>
              </div>
            ))}
          </FadeRow>
        </section>

        {/* ================= EDUCATION ================= */}
        <section
          id="education"
          ref={(el) => {
            sectionRefs.current.education = el;
          }}
          className="px-6 md:px-20 py-14 md:py-16 pb-32 sm:pb-28"
        >
          <FadeRow scrollRoot={scrollRoot}>
            <h2 className="text-xl md:text-2xl font-semibold mb-8 flex items-center gap-2">
              <FaGraduationCap /> 03 — Education
            </h2>

            {data.education.map((edu, i) => (
              <div
                key={i}
                className="grid sm:grid-cols-[160px_1fr] sm:grid-cols-[160px_1fr] md:grid-cols-[220px_1fr] gap-8 pb-10
                          border-b border-zinc-200 dark:border-zinc-800 last:border-none"
              >
                <div className="flex items-center gap-2 text-sm text-zinc-500">
  <FaCalendarAlt className="text-zinc-400 dark:text-zinc-500 text-xs" />
  <span>{edu.duration}</span>
</div>
                <div>
                  <h3 className="text-lg font-semibold">{edu.degree}</h3>
                  <p className="text-sm text-zinc-500">{edu.institution}</p>

                  {edu.achievements?.length > 0 && (
                <motion.button
  whileHover={{ x: 4 }}
  whileTap={{ scale: 0.97 }}
  className="
    group mt-4 inline-flex items-center gap-2
    px-3 py-1.5
    text-xs font-semibold tracking-wide

    rounded-full
    border border-zinc-200 dark:border-zinc-700

    bg-white/60 dark:bg-zinc-900/50
    backdrop-blur-xl

    text-zinc-700 dark:text-zinc-300
    transition-all duration-300

    hover:bg-white dark:hover:bg-zinc-800
    hover:border-zinc-300 dark:hover:border-zinc-600

    shadow-sm hover:shadow-md
  "
  onClick={() =>
    setModal({
      isOpen: true,
      title: `${edu.degree} @ ${edu.institution}`,
      achievements: edu.achievements,
    })
  }
>
  View achievements

  <span
    className="
      transition-transform duration-300
      group-hover:translate-x-1
    "
  >
    →
  </span>
</motion.button>

                  )}
                </div>
              </div>
            ))}
          </FadeRow>
        </section>
      </div>

      <AchievementsModal
        isOpen={modal.isOpen}
        title={modal.title}
        achievements={modal.achievements}
        onClose={() => setModal({ isOpen: false })}
      />

      <SocialModal
        isOpen={!!socialModal}
        platform={socialModal?.name}
        url={socialModal?.url}
        icon={socialModal?.icon}
        onClose={() => setSocialModal(null)}
      />
    </main>
  );
}
