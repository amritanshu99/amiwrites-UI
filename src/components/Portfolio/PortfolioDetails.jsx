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
  FaRegFilePdf,
  FaChevronUp,
  FaChevronDown,
  FaPhoneAlt,
  FaEnvelope,
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
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import { Link } from "react-router-dom";
import InitialLoader from "./InitialLoader";
import MemoryLaneCta from "./MemoryLaneCta";
import AmiversePulseWidget from "../AmiversePulseWidget";
import { FaCalendarAlt } from "react-icons/fa";
import { apiUrl, assetUrl } from "../../config/api";
import portfolioFallback from "../../data/portfolioFallback";

const MemoryLaneGallery = React.lazy(() => import("./MemoryLaneGallery"));

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

const contactActions = {
  phoneDisplay: "+91 91491 94704",
  phoneHref: "tel:+919149194704",
  emailDisplay: "amritanshu99@gmail.com",
  emailHref: "mailto:amritanshu99@gmail.com",
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

const getPortfolioScrollParent = (element) => {
  const explicitScrollParent = document.querySelector(
    ".h-screen.overflow-y-scroll",
  );

  return explicitScrollParent || getScrollParent(element);
};

const getScrollMetrics = (scrollParent) => {
  if (scrollParent === window) {
    return {
      scrollTop: window.scrollY,
      clientHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
    };
  }

  return {
    scrollTop: scrollParent.scrollTop,
    clientHeight: scrollParent.clientHeight,
    scrollHeight: scrollParent.scrollHeight,
  };
};

/* ================= TOOLTIP ================= */
const Tooltip = React.memo(({ children, content }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex h-full w-full justify-center">
      <motion.div
        onHoverStart={() => setShow(true)}
        onHoverEnd={() => setShow(false)}
        onTap={() => setShow((prev) => !prev)}
        className="h-full w-full"
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

/* ================= FADE ROW ================= */
const FadeRow = React.memo(({ children, reduceMotion = false, delay = 0 }) => {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
});

const staggerCardContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.075,
    },
  },
};

const staggerSkillContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.045,
    },
  },
};

const revealCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.56,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const heroCopyContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.14,
      staggerChildren: 0.085,
    },
  },
};

const heroCopyItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.64,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const sectionMeta = [
  { id: "intro", label: "Intro" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];
const MIN_LOADER_DURATION_MS = 1200;
const resumeUrl = assetUrl("/images/Resume.pdf");
const publicAsset = (path) => `${process.env.PUBLIC_URL || ""}${path}`;
const contactBannerUrl = publicAsset("/banner-optimized.jpg");
const cx = (...classes) => classes.filter(Boolean).join(" ");

const proofPoints = [
  { value: "7+ years", label: "Product engineering" },
  { value: "MERN + GraphQL", label: "Full-stack delivery" },
  { value: "AI focused", label: "Practical innovation" },
];

const featuredProjects = [
  {
    title: "AmiBot",
    label: "AI assistant",
    description:
      "A context-aware assistant built to turn questions into clear, useful actions across the AmiVerse ecosystem.",
    result: "Conversational AI · Admin controls · Responsive UX",
    stack: ["React", "Node.js", "AI"],
    to: "/amibot",
  },
  {
    title: "Task Manager",
    label: "Productivity system",
    description:
      "A professional Kanban workspace that combines focused task execution with useful productivity analytics.",
    result: "Drag-and-drop workflow · Analytics · Mobile ready",
    stack: ["React", "Node.js", "Analytics"],
    to: "/task-manager",
  },
  {
    title: "AI Tools",
    label: "Applied AI lab",
    description:
      "A collection of approachable AI utilities that solve focused problems without adding unnecessary complexity.",
    result: "Multiple tools · Clear workflows · Fast discovery",
    stack: ["AI", "ML", "JavaScript"],
    to: "/ai-tools",
  },
];

/* ================= MAIN ================= */
export default function PortfolioDetails() {
  const [data, setData] = useState(portfolioFallback);
  const [loading, setLoading] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [hasOpenedGallery, setHasOpenedGallery] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;

    try {
      return (
        document.documentElement.classList.contains("dark") ||
        window.localStorage.getItem("theme") === "dark"
      );
    } catch {
      return document.documentElement.classList.contains("dark");
    }
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const [isBottomCtaExpanded, setIsBottomCtaExpanded] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 1023px)").matches
      : false,
  );
  const prefersReducedMotion = useReducedMotion();
  const pageRef = useRef(null);
  const bottomCtaRef = useRef(null);
  const sectionRefs = useRef({});
  const bottomCtaExpandedRef = useRef(isBottomCtaExpanded);
  const pendingScrollSectionRef = useRef(null);
  const pendingScrollTargetRef = useRef(null);
  const pendingScrollTimerRef = useRef(null);

  const portfolioBackgroundImage = publicAsset(
    isDark ? "/ny-dark-optimized.jpg" : "/ny-bg-optimized.jpg",
  );
  const activeSectionMeta = useMemo(
    () => sectionMeta.find((section) => section.id === activeSection) || sectionMeta[0],
    [activeSection],
  );
  const openMemoryLane = useCallback(() => {
    setHasOpenedGallery(true);
    setIsGalleryOpen(true);
  }, []);
  const markHeroImageLoaded = useCallback(() => {
    setImageLoaded((prev) => (prev ? prev : true));
  }, []);
  const updateBottomCtaExpanded = useCallback((nextExpanded) => {
    bottomCtaExpandedRef.current = nextExpanded;
    setIsBottomCtaExpanded((prev) =>
      prev === nextExpanded ? prev : nextExpanded,
    );
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const targetSection = sectionRefs.current[sectionId];

    if (!targetSection) return;

    const scrollParent = getPortfolioScrollParent(pageRef.current);
    const { clientHeight, scrollHeight } = getScrollMetrics(scrollParent);
    const targetTop = getSectionTop(targetSection, scrollParent);
    const sectionOffset = Math.min(112, Math.max(72, clientHeight * 0.1));
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
    const scrollTarget = Math.min(
      Math.max(targetTop - sectionOffset, 0),
      maxScrollTop,
    );

    pendingScrollSectionRef.current = sectionId;
    pendingScrollTargetRef.current = scrollTarget;
    window.clearTimeout(pendingScrollTimerRef.current);
    setActiveSection(sectionId);
    updateBottomCtaExpanded(false);

    if (scrollParent === window) {
      window.scrollTo({ top: scrollTarget, behavior: "smooth" });
    } else {
      scrollParent.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }

    pendingScrollTimerRef.current = window.setTimeout(() => {
      pendingScrollSectionRef.current = null;
      pendingScrollTargetRef.current = null;
    }, 900);
  }, [updateBottomCtaExpanded]);

  useEffect(() => {
    const syncTheme = () => {
      const nextIsDark = document.documentElement.classList.contains("dark");
      setIsDark((current) => (current === nextIsDark ? current : nextIsDark));
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(pendingScrollTimerRef.current);
    };
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    const loaderTimeout = window.setTimeout(() => {
      setLoading(false);
    }, MIN_LOADER_DURATION_MS);

    axios
      .get(apiUrl("/api/portfolio"), {
        signal: controller.signal,
      })
      .then((res) => {
        if (res.data && typeof res.data === "object") {
          setData((current) => ({
            ...current,
            ...res.data,
            title: portfolioFallback.title,
            description: portfolioFallback.description,
            experience: portfolioFallback.experience,
            education: portfolioFallback.education,
          }));
        }
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
      });

    return () => {
      controller.abort();
      window.clearTimeout(loaderTimeout);
    };
  }, []);

  useEffect(() => {
    if (loading) return undefined;

    const sections = sectionMeta
      .map(({ id }) => ({ id, element: sectionRefs.current[id] }))
      .filter((section) => section.element);

    if (!sections.length) return;

    const scrollParent = getPortfolioScrollParent(pageRef.current);
    const target = scrollParent === window ? window : scrollParent;
    let rafId = null;

    const updateActiveSection = () => {
      const { scrollTop, clientHeight } = getScrollMetrics(scrollParent);
      const marker = scrollTop + Math.min(clientHeight * 0.32, 220);
      const lastSection = sections[sections.length - 1];
      const lastSectionTop = getSectionTop(lastSection.element, scrollParent);
      const lastSectionBottom =
        lastSectionTop + lastSection.element.offsetHeight;
      const isNearLastSectionEnd =
        scrollTop + clientHeight >= lastSectionBottom - 96;

      let nextActiveSection = sections[0].id;

      if (isNearLastSectionEnd) {
        nextActiveSection = lastSection.id;
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

      const pendingSection = pendingScrollSectionRef.current;
      const pendingTarget = pendingScrollTargetRef.current;

      if (
        pendingSection &&
        Number.isFinite(pendingTarget) &&
        Math.abs(scrollTop - pendingTarget) > 32
      ) {
        nextActiveSection = pendingSection;
      } else if (pendingSection) {
        pendingScrollSectionRef.current = null;
        pendingScrollTargetRef.current = null;
        window.clearTimeout(pendingScrollTimerRef.current);
      }

      setActiveSection((prev) =>
        prev === nextActiveSection ? prev : nextActiveSection,
      );
    };

    const onScroll = () => {
      updateBottomCtaExpanded(false);

      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateActiveSection();
      });
    };

    updateActiveSection();

    target.addEventListener("scroll", onScroll, { passive: true });

    window.addEventListener("resize", updateActiveSection);

    return () => {
      target.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("resize", updateActiveSection);
    };
  }, [data, loading, updateBottomCtaExpanded]);

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

    const preferredPhoto = isDark && data.photoUrlDark
      ? data.photoUrlDark
      : data.photoUrl;

    return assetUrl(preferredPhoto);
  }, [data, isDark]);

  const handleHeroImageError = useCallback(
    (event) => {
      const image = event.currentTarget;
      const fallbackUrl = assetUrl(data.photoUrl);

      if (
        image.dataset.fallbackApplied !== "true" &&
        image.src !== fallbackUrl
      ) {
        image.dataset.fallbackApplied = "true";
        image.src = fallbackUrl;
        return;
      }

      markHeroImageLoaded();
    },
    [data.photoUrl, markHeroImageLoaded],
  );

  useEffect(() => {
    if (!heroImageUrl) return undefined;

    setImageLoaded(false);

    const heroImage = new Image();
    heroImage.decoding = "async";
    heroImage.fetchPriority = "high";
    heroImage.src = heroImageUrl;

    if (heroImage.complete) {
      markHeroImageLoaded();
      return undefined;
    }

    heroImage.addEventListener("load", markHeroImageLoaded);

    return () => {
      heroImage.removeEventListener("load", markHeroImageLoaded);
    };
  }, [heroImageUrl, markHeroImageLoaded]);

  useEffect(() => {
    setBackgroundImageLoaded(false);

    const backgroundImage = new Image();
    backgroundImage.decoding = "async";
    backgroundImage.fetchPriority = "low";
    backgroundImage.src = portfolioBackgroundImage;

    const markBackgroundImageLoaded = () => setBackgroundImageLoaded(true);

    if (backgroundImage.complete) {
      markBackgroundImageLoaded();
      return undefined;
    }

    backgroundImage.addEventListener("load", markBackgroundImageLoaded);
    backgroundImage.addEventListener("error", markBackgroundImageLoaded);

    return () => {
      backgroundImage.removeEventListener("load", markBackgroundImageLoaded);
      backgroundImage.removeEventListener("error", markBackgroundImageLoaded);
    };
  }, [portfolioBackgroundImage]);

  useEffect(() => {
    if (isCompactViewport) {
      updateBottomCtaExpanded(false);
    }
  }, [isCompactViewport, updateBottomCtaExpanded]);

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
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateCompactViewport = () => {
      setIsCompactViewport(mediaQuery.matches);
    };

    updateCompactViewport();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateCompactViewport);
      return () =>
        mediaQuery.removeEventListener("change", updateCompactViewport);
    }

    mediaQuery.addListener(updateCompactViewport);
    return () => mediaQuery.removeListener(updateCompactViewport);
  }, []);

  useEffect(() => {
    if (!isTouchDevice || !isBottomCtaExpanded) return;

    const handlePointerDownOutside = (event) => {
      if (!bottomCtaRef.current) return;
      if (bottomCtaRef.current.contains(event.target)) return;
      updateBottomCtaExpanded(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [isBottomCtaExpanded, isTouchDevice, updateBottomCtaExpanded]);

  if (loading) {
    return (
      <InitialLoader
        mode="showcase"
        durationMs={MIN_LOADER_DURATION_MS}
      />
    );
  }

  const [firstName, ...lastNameParts] = data.name.trim().split(/\s+/);
  const lastName = lastNameParts.join(" ");
  const useMobileBottomCta = isCompactViewport;
  const bottomCtaWrapperClassName = cx(
    "amiverse-portfolio-section-switcher pointer-events-none fixed left-0 right-0 z-[80] lg:right-[var(--scrollbar-size)]",
    useMobileBottomCta
      ? "bottom-0 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      : "bottom-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:px-6",
  );
  const bottomCtaContainerClassName = cx(
    "pointer-events-auto relative isolate mx-auto flex min-w-0 items-center overflow-hidden border border-white/[0.65] bg-white/[0.78] shadow-[0_18px_50px_rgba(15,23,42,0.18),0_4px_16px_rgba(14,165,233,0.12)] ring-1 ring-sky-100/70 backdrop-blur-2xl dark:border-cyan-100/15 dark:bg-zinc-950/[0.82] dark:shadow-[0_18px_54px_rgba(0,0,0,0.62),0_0_26px_rgba(34,211,238,0.08)] dark:ring-cyan-100/10",
    useMobileBottomCta
      ? "w-fit max-w-[calc(100vw_-_1rem)] justify-center gap-1 rounded-full p-1"
      : "w-fit max-w-[calc(100vw_-_1.5rem)] gap-1.5 rounded-[1.65rem] p-1.5 sm:max-w-[calc(100vw_-_3rem)] lg:max-w-[calc(100vw_-_var(--scrollbar-size)_-_3rem)]",
  );
  const collapsedCtaClassName = cx(
    "group relative z-10 flex items-center font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/60 transition-all duration-200 dark:text-zinc-100 dark:ring-white/10",
    useMobileBottomCta
      ? "min-h-11 max-w-full justify-center gap-2 rounded-full bg-white/[0.68] px-3 py-2 text-xs touch-manipulation active:bg-white/[0.9] dark:bg-white/[0.07] dark:active:bg-white/10"
      : "gap-2 rounded-full bg-white/[0.58] px-3 py-1.5 text-xs hover:bg-white/[0.88] hover:shadow-md dark:bg-white/[0.06] dark:hover:bg-white/10 sm:text-sm",
  );
  const activeCtaLabelClassName = cx(
    "rounded-full bg-gradient-to-r from-slate-950 via-sky-800 to-teal-700 text-white shadow-[0_7px_18px_rgba(14,116,144,0.22)] transition-colors duration-200 dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300 dark:text-slate-950",
    useMobileBottomCta ? "px-2.5 py-1 text-xs" : "px-2.5 py-1",
  );
  const expandedCtaClassName = cx(
    "relative z-10 min-w-0",
    useMobileBottomCta
      ? "flex max-w-[calc(100vw_-_2rem)] items-center gap-1 overflow-x-auto whitespace-nowrap px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      : "flex max-w-full flex-wrap items-center justify-center gap-1.5",
  );
  const sectionCtaButtonBaseClassName = cx(
    "inline-flex min-w-0 shrink-0 items-center whitespace-nowrap transition-all duration-200",
    useMobileBottomCta
      ? "min-h-10 justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold touch-manipulation"
      : "gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium sm:px-3 sm:text-sm",
  );
  const getSectionCtaButtonClassName = (isActive) =>
    cx(
      sectionCtaButtonBaseClassName,
      isActive
        ? "bg-gradient-to-r from-slate-950 via-sky-800 to-teal-700 text-white shadow-[0_8px_22px_rgba(14,116,144,0.3)] dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300 dark:text-slate-950 dark:shadow-[0_8px_22px_rgba(34,211,238,0.1)]"
        : useMobileBottomCta
          ? "bg-white/[0.48] text-slate-700 ring-1 ring-slate-200/70 active:bg-white/[0.82] active:text-slate-950 dark:bg-white/[0.055] dark:text-zinc-200 dark:ring-white/10 dark:active:bg-white/10 dark:active:text-cyan-100"
          : "text-slate-600 hover:bg-white/[0.72] hover:text-slate-900 hover:shadow-sm dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-cyan-100",
    );
  const closeCtaClassName = cx(
    "shrink-0 text-slate-500 transition-all duration-200 dark:text-zinc-400",
    useMobileBottomCta
      ? "flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.42] ring-1 ring-slate-200/60 touch-manipulation active:bg-white/[0.78] active:text-slate-700 dark:bg-white/[0.045] dark:ring-white/10 dark:active:bg-white/10 dark:active:text-cyan-100"
      : "rounded-full p-2 hover:bg-white/[0.72] hover:text-slate-700 hover:shadow-sm dark:hover:bg-white/10 dark:hover:text-cyan-100",
  );

  return (
    <>
      <article
        ref={pageRef}
        aria-labelledby="portfolio-title"
        className="relative isolate w-full max-w-full overflow-hidden bg-white text-zinc-900 dark:bg-black dark:text-zinc-100"
      >
      <div
        aria-hidden="true"
        className="portfolio-ny-background pointer-events-none fixed inset-y-0 left-0 right-0 z-0 bg-cover transition-opacity duration-500 lg:right-[var(--scrollbar-size)]"
        style={{
          backgroundImage: `url(${portfolioBackgroundImage})`,
          opacity: backgroundImageLoaded ? 1 : 0,
        }}
      >
        <div className="absolute inset-0 bg-white/10 dark:bg-black/38" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-slate-100/18 dark:from-black/22 dark:via-black/8 dark:to-black/58" />
        <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(15,23,42,0.1)] dark:shadow-[inset_0_0_180px_rgba(0,0,0,0.46)]" />
      </div>

      <div className="relative z-10">
        {/* ================= HERO ================= */}
        <section className="portfolio-hero relative isolate overflow-hidden bg-slate-100 text-slate-950 dark:bg-black dark:text-white">
          <img
            key={`ambient-${heroImageUrl}`}
            src={heroImageUrl}
            alt=""
            aria-hidden="true"
            width={isDark ? 1024 : 1477}
            height={isDark ? 1024 : 1317}
            className="portfolio-hero-ambient pointer-events-none absolute -inset-8 hidden h-[calc(100%+4rem)] w-[calc(100%+4rem)] max-w-none object-cover object-center opacity-25 blur-3xl dark:opacity-[0.16] lg:block"
            loading="eager"
            decoding="async"
          />
          <div
            aria-hidden="true"
            className="portfolio-hero-foundation absolute inset-0"
          />
          <motion.img
            key={heroImageUrl}
            src={heroImageUrl}
            alt={`${data.name} portfolio portrait`}
            width={isDark ? 1024 : 1477}
            height={isDark ? 1024 : 1317}
            onLoad={markHeroImageLoaded}
            onError={handleHeroImageError}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, x: 20, scale: 1.012 }
            }
            animate={{
              opacity: imageLoaded ? 1 : 0,
              x: 0,
              scale: 1,
            }}
            transition={{ duration: 0.86, ease: [0.22, 1, 0.36, 1] }}
            className="portfolio-hero-image absolute inset-0 h-full w-full max-w-none object-cover object-[38%_17%] saturate-[1.03] contrast-[1.02] will-change-[opacity,transform] sm:object-[46%_18%] lg:left-auto lg:right-0 lg:w-auto lg:object-contain lg:object-right dark:saturate-100 dark:contrast-[1.06]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div
            aria-hidden="true"
            className="portfolio-hero-scrim portfolio-hero-scrim-light absolute inset-0 dark:hidden"
          />
          <div
            aria-hidden="true"
            className="portfolio-hero-scrim portfolio-hero-scrim-dark absolute inset-0 hidden dark:block"
          />
          <div
            aria-hidden="true"
            className="portfolio-hero-colorwash pointer-events-none absolute inset-0 overflow-hidden dark:hidden"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden bg-[radial-gradient(circle_at_8%_20%,rgba(34,211,238,0.07),transparent_32%)] dark:block"
          />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-5 pb-14 sm:px-8 sm:pb-16 lg:items-center lg:px-12 lg:pb-0">
            <motion.div
              variants={heroCopyContainerVariants}
              initial={prefersReducedMotion ? false : "hidden"}
              animate="visible"
              className="hero-name-area w-full max-w-lg"
            >
              <motion.p
                variants={heroCopyItemVariants}
                className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-sky-800 [text-shadow:0_1px_8px_rgba(255,255,255,0.92)] before:h-px before:w-8 before:shrink-0 before:bg-sky-700/60 dark:text-cyan-200 dark:[text-shadow:0_2px_12px_rgba(0,0,0,0.72)] dark:before:bg-cyan-200/55 sm:text-sm"
              >
                Building useful products with clarity
              </motion.p>
              <motion.h1
                variants={heroCopyItemVariants}
                id="portfolio-title"
                aria-label={data.name}
                className="hero-name font-extrabold tracking-tight text-slate-950 antialiased drop-shadow-[0_2px_14px_rgba(255,255,255,0.55)] dark:text-white dark:drop-shadow-[0_10px_36px_rgba(0,0,0,0.48)]"
              >
                <span className="block">{firstName}</span>
                {lastName ? <span className="block">{lastName}</span> : null}
              </motion.h1>
              <motion.p
                variants={heroCopyItemVariants}
                className="mt-5 text-lg font-semibold text-slate-950 dark:text-white sm:text-xl lg:text-2xl"
              >
                {data.title || portfolioFallback.title}
              </motion.p>
              <motion.p
                variants={heroCopyItemVariants}
                className="portfolio-hero-summary mt-3 max-w-lg text-sm leading-relaxed text-slate-700 dark:text-slate-200 sm:text-base"
              >
                React, Node.js, GraphQL, and AI—combined to solve real product problems.
              </motion.p>
              <motion.div
                variants={heroCopyItemVariants}
                className="portfolio-hero-actions mt-7 flex flex-row gap-2 min-[360px]:gap-3"
              >
                <button
                  type="button"
                  onClick={() => scrollToSection("work")}
                  className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-slate-950 to-sky-950 px-2 py-3 text-xs font-bold text-white shadow-[0_16px_38px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(14,116,144,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:from-white dark:to-cyan-50 dark:text-slate-950 dark:shadow-[0_16px_38px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_18px_46px_rgba(34,211,238,0.16)] dark:focus-visible:ring-cyan-200 min-[360px]:px-4 min-[360px]:text-sm sm:px-6"
                >
                  Selected work <span className="ml-2" aria-hidden="true">&rarr;</span>
                </button>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full border border-slate-900/15 bg-white/[0.94] px-2 py-3 text-xs font-bold text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.1)] transition duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-[0_16px_34px_rgba(14,116,144,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-white/20 dark:bg-slate-950/[0.88] dark:text-white dark:shadow-[0_12px_28px_rgba(0,0,0,0.3)] dark:hover:border-cyan-300/35 dark:hover:bg-slate-950 dark:focus-visible:ring-cyan-200 min-[360px]:px-4 min-[360px]:text-sm sm:px-6"
                >
                  <FaRegFilePdf className="mr-2" aria-hidden="true" /> View résumé
                </a>
              </motion.div>
            </motion.div>
          </div>

          {!isCompactViewport && <AmiversePulseWidget />}
        </section>

        {/* ================= INTRO ================= */}
        <section
          id="intro"
          ref={(el) => {
            sectionRefs.current.intro = el;
          }}
          aria-label="Profile details"
          className="portfolio-section-surface border-b border-slate-200/70 bg-slate-50/[0.78] px-5 py-14 dark:border-zinc-800/80 dark:bg-zinc-950/[0.86] sm:px-8 md:py-20 lg:px-12"
        >
          <FadeRow reduceMotion={prefersReducedMotion}>
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">
                  About me
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Engineering thoughtful products from idea to impact.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-zinc-300 sm:text-lg">
                  {portfolioFallback.description}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href={contactActions.emailHref}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
                  >
                    <FaEnvelope aria-hidden="true" /> Email me
                  </a>
                  <a
                    href={contactActions.phoneHref}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/[0.94] px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-white/15 dark:bg-zinc-950/[0.94] dark:text-white"
                  >
                    <FaPhoneAlt aria-hidden="true" /> Call
                  </a>
                  <div className="flex items-center gap-2 text-zinc-500" aria-label="Social profiles">
                    {socialProfiles.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${social.name} profile`}
                        className={`${socialColors[social.name]} inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/[0.94] shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-white/10 dark:bg-zinc-950/[0.94]`}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <aside aria-label="Professional highlights">
                <motion.div
                  variants={staggerCardContainerVariants}
                  initial={prefersReducedMotion ? false : "hidden"}
                  whileInView={prefersReducedMotion ? undefined : "visible"}
                  viewport={{ once: true, amount: 0.16 }}
                  className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-1"
                >
                  {proofPoints.map((point) => (
                    <motion.div
                      key={point.value}
                      variants={revealCardVariants}
                      className="h-full min-h-[94px] rounded-2xl border border-white/80 bg-white/[0.92] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/[0.025] transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_40px_rgba(14,116,144,0.1)] dark:border-white/10 dark:bg-zinc-950/[0.94] dark:ring-white/[0.03] dark:hover:border-cyan-300/20"
                    >
                      <p className="text-lg font-bold text-slate-950 dark:text-white">{point.value}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{point.label}</p>
                    </motion.div>
                  ))}
                  <motion.div variants={revealCardVariants} className="h-full">
                    <MemoryLaneCta onClick={openMemoryLane} />
                  </motion.div>
                </motion.div>
              </aside>
            </div>
          </FadeRow>
        </section>

        {/* ================= SELECTED WORK ================= */}
        <section
          id="work"
          ref={(el) => {
            sectionRefs.current.work = el;
          }}
          aria-labelledby="work-heading"
          className="portfolio-section-surface border-b border-slate-200/70 bg-white/[0.76] px-5 py-14 dark:border-zinc-800/80 dark:bg-black/[0.84] sm:px-8 md:py-20 lg:px-12"
        >
          <FadeRow reduceMotion={prefersReducedMotion}>
            <div className="mx-auto max-w-7xl">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">01 · Selected work</p>
                <h2 id="work-heading" className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Products built to be useful, not just impressive.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600 dark:text-zinc-300 sm:text-lg">
                  A few AmiVerse projects that combine product thinking, engineering, and practical AI.
                </p>
              </div>

              <motion.div
                variants={staggerCardContainerVariants}
                initial={prefersReducedMotion ? false : "hidden"}
                whileInView={prefersReducedMotion ? undefined : "visible"}
                viewport={{ once: true, amount: 0.16 }}
                className="mt-9 grid gap-5 lg:grid-cols-3"
              >
                {featuredProjects.map((project) => (
                  <motion.article
                    key={project.title}
                    variants={revealCardVariants}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/85 bg-slate-50/[0.92] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_26px_58px_rgba(14,116,144,0.14)] dark:border-white/10 dark:bg-zinc-950/[0.94] dark:ring-white/[0.035] dark:hover:border-cyan-300/25"
                  >
                    <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/65 to-transparent opacity-70 dark:via-cyan-300/45" aria-hidden="true" />
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-cyan-300">{project.label}</p>
                    <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{project.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-7 text-slate-600 dark:text-zinc-300">{project.description}</p>
                    <p className="mt-5 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-zinc-200">{project.result}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.stack.map((item) => (
                        <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/10">
                          {item}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={project.to}
                      className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition group-hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:bg-white dark:text-slate-950 dark:group-hover:bg-cyan-200"
                    >
                      Explore project <span className="ml-2" aria-hidden="true">&rarr;</span>
                    </Link>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </FadeRow>
        </section>

        {/* ================= SKILLS ================= */}
        <section
          id="skills"
          ref={(el) => {
            sectionRefs.current.skills = el;
          }}
          aria-labelledby="skills-heading"
          className="portfolio-section-surface border-b border-slate-200/70 bg-slate-50/[0.78] px-5 py-14 dark:border-zinc-800/80 dark:bg-zinc-950/[0.86] sm:px-8 md:py-20 lg:px-12"
        >
          <FadeRow reduceMotion={prefersReducedMotion}>
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">02 · Core capabilities</p>
              <h2 id="skills-heading" className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                A focused toolkit for end-to-end delivery.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-zinc-300 sm:text-lg">
                Strongest across modern JavaScript products, backed by practical data and AI experience.
              </p>
            </div>
            <motion.div
              variants={staggerSkillContainerVariants}
              initial={prefersReducedMotion ? false : "hidden"}
              whileInView={prefersReducedMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.16 }}
              className="mx-auto mt-9 grid max-w-7xl auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8"
            >
              {data.skills.map(({ skill, expertise }) => (
                <Tooltip key={skill} content={expertise}>
                  <motion.div
                    variants={revealCardVariants}
                    whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                    transition={{ duration: 0.2 }}
                    className="group flex h-full min-h-28 w-full min-w-0 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-white/85 bg-white/[0.92] p-3 text-center shadow-[0_12px_30px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/[0.025] transition duration-300 hover:border-sky-200 hover:shadow-[0_18px_38px_rgba(14,116,144,0.12)] dark:border-white/10 dark:bg-zinc-950/[0.94] dark:ring-white/[0.035] dark:hover:border-cyan-300/25"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50/90 text-2xl ring-1 ring-slate-200/70 transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:ring-sky-200 dark:bg-white/[0.055] dark:ring-white/10 dark:group-hover:ring-cyan-300/20 ${skillColors[skill]}`}>
                      {skillIconMap[skill]}
                    </div>
                    <span className="text-xs font-bold leading-tight text-slate-800 dark:text-zinc-100 sm:text-sm">
                      {skill}
                    </span>
                  </motion.div>
                </Tooltip>
              ))}
            </motion.div>
          </FadeRow>
        </section>

        {/* ================= EXPERIENCE ================= */}
        <section
          id="experience"
          ref={(el) => {
            sectionRefs.current.experience = el;
          }}
          aria-labelledby="experience-heading"
          className="portfolio-section-surface border-b border-slate-200/70 bg-white/[0.76] px-5 py-14 dark:border-zinc-800/80 dark:bg-black/[0.84] sm:px-8 md:py-20 lg:px-12"
        >
          <FadeRow reduceMotion={prefersReducedMotion}>
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">03 · Experience</p>
              <h2 id="experience-heading" className="mt-3 flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                <FaBriefcase className="text-2xl text-sky-700 dark:text-cyan-300" aria-hidden="true" /> Career journey
              </h2>

              <motion.div
                variants={staggerCardContainerVariants}
                initial={prefersReducedMotion ? false : "hidden"}
                whileInView={prefersReducedMotion ? undefined : "visible"}
                viewport={{ once: true, amount: 0.12 }}
                className="mt-9 space-y-5"
              >
                {data.experience.map((exp, i) => (
                  <motion.article
                    key={`${exp.company}-${exp.duration}`}
                    variants={revealCardVariants}
                    className="group grid min-w-0 gap-5 rounded-3xl border border-white/85 bg-slate-50/[0.92] p-5 shadow-[0_18px_46px_rgba(15,23,42,0.075)] ring-1 ring-slate-900/[0.025] transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_24px_52px_rgba(14,116,144,0.11)] dark:border-white/10 dark:bg-zinc-950/[0.94] dark:ring-white/[0.035] dark:hover:border-cyan-300/25 sm:grid-cols-[180px_1fr] sm:p-7 md:grid-cols-[220px_1fr]"
                  >
                    <div className="flex items-start gap-2 text-sm font-semibold text-slate-500 dark:text-zinc-400 sm:pt-1">
                      <FaCalendarAlt className="mt-0.5 shrink-0 text-sky-600 dark:text-cyan-300" aria-hidden="true" />
                      <span>{exp.duration}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        {companyLogoMap[exp.company] && (
                          <img
                            src={companyLogoMap[exp.company]}
                            alt={`${exp.company} logo`}
                            decoding="async"
                            loading="lazy"
                            className="h-12 w-12 rounded-2xl border border-slate-200 bg-white p-2 object-contain shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white">{exp.role}</h3>
                          <p className="mt-0.5 break-words text-sm font-semibold text-sky-700 dark:text-cyan-300">{exp.company}</p>
                        </div>
                      </div>
                      <p className="mt-4 break-words text-base leading-7 text-slate-600 dark:text-zinc-300">{exp.description}</p>
                      {exp.achievements?.length > 0 && (
                        <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-700 dark:text-zinc-200">
                          {exp.achievements.slice(0, 3).map((achievement) => (
                            <li key={achievement} className="flex gap-3">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-cyan-300" aria-hidden="true" />
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </FadeRow>
        </section>

        {/* ================= EDUCATION ================= */}
        <section
          id="education"
          ref={(el) => {
            sectionRefs.current.education = el;
          }}
          aria-labelledby="education-heading"
          className="portfolio-section-surface border-b border-slate-200/70 bg-slate-50/[0.78] px-5 py-14 dark:border-zinc-800/80 dark:bg-zinc-950/[0.86] sm:px-8 md:py-20 lg:px-12"
        >
          <FadeRow reduceMotion={prefersReducedMotion}>
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">04 · Education</p>
              <h2 id="education-heading" className="mt-3 flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                <FaGraduationCap className="text-2xl text-sky-700 dark:text-cyan-300" aria-hidden="true" /> Foundations
              </h2>

              <motion.div
                variants={staggerCardContainerVariants}
                initial={prefersReducedMotion ? false : "hidden"}
                whileInView={prefersReducedMotion ? undefined : "visible"}
                viewport={{ once: true, amount: 0.16 }}
                className="mt-9 grid gap-5 lg:grid-cols-2"
              >
                {data.education.map((edu) => (
                  <motion.article
                    key={`${edu.degree}-${edu.duration}`}
                    variants={revealCardVariants}
                    className="rounded-3xl border border-white/85 bg-white/[0.92] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.075)] ring-1 ring-slate-900/[0.025] transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_24px_52px_rgba(14,116,144,0.11)] dark:border-white/10 dark:bg-zinc-950/[0.94] dark:ring-white/[0.035] dark:hover:border-cyan-300/20 sm:p-7"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-cyan-300">
                      <FaCalendarAlt aria-hidden="true" /> {edu.duration}
                    </div>
                    <h3 className="mt-4 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white">{edu.degree}</h3>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-500 dark:text-zinc-400">{edu.institution}</p>
                    {edu.achievements?.length > 0 && (
                      <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-700 dark:text-zinc-200">
                        {edu.achievements.slice(0, 2).map((achievement) => (
                          <li key={achievement} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-cyan-300" aria-hidden="true" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </FadeRow>
        </section>

        {/* ================= CONTACT SIGNATURE ================= */}
        <section
          id="contact"
          ref={(el) => {
            sectionRefs.current.contact = el;
          }}
          aria-labelledby="contact-heading"
          className="portfolio-section-surface bg-white/[0.76] px-5 py-14 pb-40 dark:bg-black/[0.84] sm:px-8 md:py-20 md:pb-44 lg:px-12"
        >
          <FadeRow reduceMotion={prefersReducedMotion}>
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">
                05 / Contact
              </p>
              <h2
                id="contact-heading"
                className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl"
              >
                Let&apos;s build something useful.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-zinc-300 sm:text-lg">
                Have a product problem, an AI idea, or a thoughtful collaboration in mind? Start with a direct note.
              </p>

              <figure className="group mt-9 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-zinc-950 shadow-[0_26px_70px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04] transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_30px_78px_rgba(14,116,144,0.2)] dark:border-white/10 dark:ring-white/[0.04]">
                <div className="relative h-[210px] overflow-hidden bg-[#111] sm:aspect-[4/1] sm:h-auto">
                  <img
                    src={contactBannerUrl}
                    alt=""
                    aria-hidden="true"
                    width="1584"
                    height="396"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-[18%_center] sm:object-contain"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-[30%] bg-gradient-to-r from-transparent to-black/90 sm:hidden"
                  />
                  <span className="absolute bottom-4 right-4 inline-flex max-w-[72%] items-center gap-2 rounded-full bg-black/[0.9] px-3 py-2 text-[0.68rem] font-semibold text-white shadow-lg sm:hidden">
                    <FaEnvelope className="shrink-0 text-cyan-300" aria-hidden="true" />
                    <span className="truncate">{contactActions.emailDisplay}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[59.5%] top-[47.2%] hidden h-[10%] w-[23.8%] items-center justify-center rounded-full bg-white px-2 text-center font-semibold uppercase tracking-[0.04em] text-zinc-900 shadow-sm sm:flex sm:text-[clamp(0.5rem,1.25vw,1.05rem)]"
                  >
                    Full-stack &amp; AI Engineer
                  </span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.035] to-transparent opacity-0 transition duration-700 group-hover:opacity-100"
                  />
                </div>

                <figcaption className="flex flex-col gap-4 border-t border-white/10 bg-zinc-950 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                      Original AmiVerse calling card
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Coffee, clarity, and a direct line to collaborate.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-semibold">
                    <a
                      href={contactActions.emailHref}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 py-2 text-zinc-950 transition hover:-translate-y-0.5 hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <FaEnvelope aria-hidden="true" /> Email
                    </a>
                    <a
                      href={contactActions.phoneHref}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-white transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <FaPhoneAlt aria-hidden="true" /> Call
                    </a>
                    <a
                      href="https://www.amiverse.in"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-white transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      amiverse.in <span className="ml-1 inline-block -rotate-45" aria-hidden="true">{"\u2192"}</span>
                    </a>
                  </div>
                </figcaption>
              </figure>
            </div>
          </FadeRow>
        </section>
      </div>

      </article>

      <div className={bottomCtaWrapperClassName}>
        <motion.div
          ref={bottomCtaRef}
          layout
          transition={{
            layout: { type: "spring", stiffness: 220, damping: 28, mass: 0.95 },
            duration: 0.38,
            ease: [0.22, 1, 0.36, 1],
          }}
          onMouseEnter={
            isTouchDevice ? undefined : () => updateBottomCtaExpanded(true)
          }
          onMouseLeave={
            isTouchDevice ? undefined : () => updateBottomCtaExpanded(false)
          }
          onFocusCapture={
            isTouchDevice ? undefined : () => updateBottomCtaExpanded(true)
          }
          onBlurCapture={
            isTouchDevice
              ? undefined
              : (event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    updateBottomCtaExpanded(false);
                  }
                }
          }
          className={bottomCtaContainerClassName}
          initial={
            prefersReducedMotion
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0.96, y: 6, scale: 0.985 }
          }
          animate={{ y: 0, opacity: 1, scale: 1 }}
        >
          <span className="pointer-events-none absolute inset-0 rounded-[1.65rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.76),rgba(224,242,254,0.52)_42%,rgba(209,250,229,0.38))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(8,47,73,0.52)_48%,rgba(6,78,59,0.36))]" />
          <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/80 dark:bg-cyan-100/20" />
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
                onClick={() => updateBottomCtaExpanded(true)}
                whileHover={isTouchDevice ? undefined : { scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={collapsedCtaClassName}
                aria-label={`Expand section switcher. Current section is ${activeSectionMeta.label}`}
                aria-expanded={false}
              >
                <span className="text-slate-500 dark:text-zinc-400">Jump to</span>
                <span className={activeCtaLabelClassName}>
                  {activeSectionMeta.label}
                </span>
                <FaChevronUp
                  className={cx(
                    "text-slate-500 transition-transform duration-200 dark:text-cyan-200/55",
                    useMobileBottomCta
                      ? "text-xs"
                      : "text-[10px] group-hover:-translate-y-0.5",
                  )}
                />
              </motion.button>
            ) : (
              <motion.div
                key="expanded-cta"
                layout="position"
                initial={{ opacity: 0, y: 6, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={expandedCtaClassName}
                aria-label="Portfolio section shortcuts"
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
                        updateBottomCtaExpanded(false);
                      }}
                      className={getSectionCtaButtonClassName(isActive)}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                          isActive
                            ? "bg-white/90 dark:bg-slate-950/80"
                            : "bg-sky-300/70 dark:bg-cyan-300/35"
                        }`}
                      />
                      <span>{section.label}</span>
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
                  onClick={() => updateBottomCtaExpanded(false)}
                  aria-label="Collapse section switcher"
                  className={closeCtaClassName}
                >
                  <FaChevronDown className={useMobileBottomCta ? "text-xs" : "text-[10px]"} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {hasOpenedGallery && (
        <React.Suspense fallback={null}>
          <MemoryLaneGallery
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
          />
        </React.Suspense>
      )}
    </>
  );
}
