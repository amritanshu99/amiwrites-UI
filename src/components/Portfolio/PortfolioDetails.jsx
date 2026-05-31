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
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import InitialLoader from "./InitialLoader";
import AchievementsModal from "./AchievementsModal";
import MemoryLaneCta from "./MemoryLaneCta";
import AmiversePulseWidget from "../AmiversePulseWidget";
import { FaCalendarAlt } from "react-icons/fa";
import { apiUrl, assetUrl } from "../../config/api";

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
const AnimatedBanner = React.memo(() => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      className="w-full will-change-transform"
    >
      <img
        src={publicAsset("/banner-optimized.jpg")}
        alt="Amritanshu Mishra Banner"
        width="1584"
        height="396"
        className="
            w-full
            block
            h-auto
            object-cover
            object-center
            shadow-[0_18px_46px_rgba(15,23,42,0.16)]
            sm:h-[clamp(160px,19vw,280px)]
            sm:object-[center_58%]
          "
        loading="lazy"
        decoding="async"
      />
    </motion.div>
  );
});

/* ================= FADE ROW ================= */
const FadeRow = React.memo(({ children }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-160px" });
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
const MIN_LOADER_DURATION_MS = 900;
const resumeUrl = assetUrl("/images/Resume.pdf");
const publicAsset = (path) => `${process.env.PUBLIC_URL || ""}${path}`;
const cx = (...classes) => classes.filter(Boolean).join(" ");

/* ================= MAIN ================= */
export default function PortfolioDetails() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [hasOpenedGallery, setHasOpenedGallery] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [socialModal, setSocialModal] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const [isBottomCtaExpanded, setIsBottomCtaExpanded] = useState(() =>
    typeof window !== "undefined"
      ? !window.matchMedia("(max-width: 767px)").matches
      : true,
  );
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

  const heroRef = useRef(null);
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

  const heroScroll = useScroll({
    target: heroRef,
    offset: ["start start", "0.4 end"],
  });

  const imageScale = useTransform(
    heroScroll.scrollYProgress,
    [0, 0.2],
    [1.05, 1],
  );
  const textY = useTransform(
    heroScroll.scrollYProgress,
    [0, 0.2],
    [0, -30],
  );
  const textOpacity = useTransform(
    heroScroll.scrollYProgress,
    [0, 0.4],
    [1, 0.65],
  );
  const shouldReduceHeroMotion =
    prefersReducedMotion || isTouchDevice || isCompactViewport;
  const heroImageStyle = useMemo(
    () => (shouldReduceHeroMotion ? undefined : { scale: imageScale }),
    [imageScale, shouldReduceHeroMotion],
  );
  const heroTextStyle = useMemo(
    () =>
      shouldReduceHeroMotion ? undefined : { y: textY, opacity: textOpacity },
    [shouldReduceHeroMotion, textOpacity, textY],
  );

  useEffect(() => {
    const sync = () => {
      const nextIsDark = document.documentElement.classList.contains("dark");
      setIsDark((prev) => (prev === nextIsDark ? prev : nextIsDark));
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(pendingScrollTimerRef.current);
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
      .get(apiUrl("/api/portfolio"), {
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

    return assetUrl(isDark ? data.photoUrlDark : data.photoUrl);
  }, [data, isDark]);

  useEffect(() => {
    if (!heroImageUrl) return;

    setImageLoaded(false);

    const heroImage = new Image();
    heroImage.decoding = "async";
    heroImage.fetchPriority = "high";
    heroImage.src = heroImageUrl;

    if (heroImage.complete) {
      markHeroImageLoaded();
      return;
    }

    heroImage.addEventListener("load", markHeroImageLoaded);

    return () => {
      heroImage.removeEventListener("load", markHeroImageLoaded);
    };
  }, [heroImageUrl, markHeroImageLoaded]);

  useEffect(() => {
    if (!heroImageUrl) return undefined;

    const preloadImage = document.createElement("link");
    preloadImage.rel = "preload";
    preloadImage.as = "image";
    preloadImage.href = heroImageUrl;
    preloadImage.fetchPriority = "high";
    document.head.appendChild(preloadImage);

    return () => {
      document.head.removeChild(preloadImage);
    };
  }, [heroImageUrl]);

  useEffect(() => {
    const collapseTimer = window.setTimeout(() => {
      updateBottomCtaExpanded(false);
    }, 2000);

    return () => {
      window.clearTimeout(collapseTimer);
    };
  }, [updateBottomCtaExpanded]);

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

  useEffect(() => {
    setBackgroundImageLoaded(false);

    const backgroundImage = new Image();
    backgroundImage.decoding = "async";
    backgroundImage.fetchPriority = "low";
    backgroundImage.src = portfolioBackgroundImage;

    const markLoaded = () => setBackgroundImageLoaded(true);

    if (backgroundImage.complete) {
      markLoaded();
      return;
    }

    backgroundImage.addEventListener("load", markLoaded);

    return () => {
      backgroundImage.removeEventListener("load", markLoaded);
    };
  }, [portfolioBackgroundImage]);

  if (loading || !data) return <InitialLoader />;

  const [firstName, ...lastNameParts] = data.name.trim().split(/\s+/);
  const lastName = lastNameParts.join(" ");
  const useMobileBottomCta = isCompactViewport;
  const bottomCtaWrapperClassName = cx(
    "pointer-events-none fixed left-0 right-0 z-[80] lg:right-[var(--scrollbar-size)]",
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
      {/* ===== PREMIUM NY BACKGROUND ===== */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 left-0 right-0 z-0 bg-cover bg-center transition-opacity duration-500 lg:right-[var(--scrollbar-size)]"
        style={{
          backgroundImage: `url(${portfolioBackgroundImage})`,
          opacity: backgroundImageLoaded ? 1 : 0,
        }}
      >
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

        {/* ================= HERO ================= */}
        <section
          ref={heroRef}
          className="relative min-h-[88svh] sm:min-h-[98svh] md:min-h-[108svh] lg:min-h-[112svh] xl:min-h-[114svh]"
        >
          <motion.div
            style={heroImageStyle}
            className="sticky top-0 z-10 h-[72svh] min-h-[420px] overflow-hidden bg-white dark:bg-black sm:h-[78svh] sm:min-h-[500px] md:h-[84svh] md:min-h-[560px] lg:h-[86svh] xl:h-[88svh]"
          >
            <motion.img
              src={heroImageUrl}
              alt={`${data.name} portfolio portrait`}
              width="1920"
              height="1080"
              onLoad={markHeroImageLoaded}
              initial={false}
              animate={{
                opacity: imageLoaded ? 1 : 0,
                scale: 1,
              }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="
                h-full w-full
                object-cover
                object-[center_14%]
                sm:object-[center_15%]
                md:object-[center_17%]
                lg:object-[center_22%]
                block transform-gpu will-change-transform
              "
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-white/10 to-white/88 dark:from-black/34 dark:via-black/20 dark:to-black/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/42 via-white/8 to-white/12 dark:from-black/54 dark:via-transparent dark:to-black/18" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white dark:from-black to-transparent" />

            <motion.div
              style={heroTextStyle}
              className="hero-name-area pointer-events-none absolute inset-0 z-10 flex items-end px-5 pb-[max(2rem,8svh)] min-[380px]:px-6 sm:px-10 sm:pb-[9svh] md:px-16 md:pb-[10svh] lg:px-20 lg:pb-[11vh]"
            >
              <h1
                id="portfolio-title"
                aria-label={data.name}
                style={{ transformOrigin: "left center" }}
                className="
                  hero-name
                  font-extrabold
                  tracking-normal
                  text-slate-950
                  drop-shadow-[0_12px_34px_rgba(15,23,42,0.24)]
                  [text-shadow:0_2px_20px_rgba(255,255,255,0.9)]
                  [font-variation-settings:'wght'_840]
                  antialiased
                  dark:text-white
                  dark:drop-shadow-[0_18px_48px_rgba(0,0,0,0.78)]
                  dark:[text-shadow:0_2px_18px_rgba(0,0,0,0.86)]
                "
              >
                <span className="block">{firstName}</span>
                {lastName ? <span className="block">{lastName}</span> : null}
              </h1>
            </motion.div>
          </motion.div>

          <AmiversePulseWidget />
        </section>
        {/* ================= BRAND BANNER ================= */}
        <section
          aria-label="AmiVerse portfolio banner"
          className="w-full overflow-hidden border-y border-zinc-200/70 bg-white/92 py-4 backdrop-blur dark:border-zinc-800 dark:bg-black/92 sm:py-5 md:py-6 lg:py-7"
        >
          <AnimatedBanner />
        </section>

        {/* ================= INTRO ================= */}
        <section
          id="intro"
          ref={(el) => {
            sectionRefs.current.intro = el;
          }}
          aria-label="Profile details"
          className="border-b border-zinc-200 px-5 py-12 dark:border-zinc-800 sm:px-6 sm:py-14 md:px-20 md:py-16"
        >
          <FadeRow>
            <div className="w-full max-w-none space-y-6">
              <p className="w-full max-w-5xl text-base font-medium leading-relaxed tracking-normal text-zinc-800 [text-wrap:pretty] dark:text-zinc-100 sm:text-lg md:text-xl">
                {data.description}
              </p>
              <div className="flex flex-wrap gap-3 text-zinc-500">
                {socialProfiles.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setSocialModal(s)}
                    aria-label={`Open ${s.name} profile`}
                    className={`${socialColors[s.name]} rounded-full bg-white/70 p-2 shadow-sm ring-1 ring-zinc-200/70 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 dark:bg-zinc-900/60 dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)] dark:focus-visible:ring-cyan-300/45`}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>

              <nav
                className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
                aria-label="Direct contact actions"
              >
                <a
                  href={contactActions.phoneHref}
                  aria-label={`Call Amritanshu Mishra at ${contactActions.phoneDisplay}`}
                  className="group inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-3 rounded-full border border-emerald-300/60 bg-white/82 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_14px_32px_rgba(15,23,42,0.1)] ring-1 ring-white/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-white hover:shadow-[0_18px_40px_rgba(16,185,129,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-50 dark:shadow-[0_16px_36px_rgba(0,0,0,0.26)] dark:ring-emerald-100/10 dark:hover:border-emerald-200/55 dark:hover:bg-emerald-300/15 dark:focus-visible:ring-emerald-200/45 sm:w-auto sm:justify-start"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_10px_22px_rgba(16,185,129,0.26)] transition-transform duration-300 group-hover:scale-105 dark:from-emerald-300 dark:to-teal-300 dark:text-slate-950 dark:shadow-[0_10px_22px_rgba(45,212,191,0.18)]">
                    <FaPhoneAlt className="text-sm" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col items-start leading-tight">
                    <span>Call</span>
                    <span className="hidden whitespace-nowrap text-[12px] font-medium text-slate-500 dark:text-emerald-100/75 sm:block">
                      {contactActions.phoneDisplay}
                    </span>
                  </span>
                </a>

                <a
                  href={contactActions.emailHref}
                  aria-label={`Email Amritanshu Mishra at ${contactActions.emailDisplay}`}
                  className="group inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-3 rounded-full border border-sky-300/60 bg-white/82 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_14px_32px_rgba(15,23,42,0.1)] ring-1 ring-white/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-white hover:shadow-[0_18px_40px_rgba(14,165,233,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-50 dark:shadow-[0_16px_36px_rgba(0,0,0,0.26)] dark:ring-cyan-100/10 dark:hover:border-cyan-200/55 dark:hover:bg-cyan-300/15 dark:focus-visible:ring-cyan-200/45 sm:w-auto sm:justify-start"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-[0_10px_22px_rgba(14,165,233,0.26)] transition-transform duration-300 group-hover:scale-105 dark:from-cyan-300 dark:to-sky-300 dark:text-slate-950 dark:shadow-[0_10px_22px_rgba(34,211,238,0.18)]">
                    <FaEnvelope className="text-sm" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col items-start leading-tight">
                    <span>Email</span>
                    <span className="hidden max-w-[16rem] truncate text-[12px] font-medium text-slate-500 dark:text-cyan-100/75 sm:block">
                      {contactActions.emailDisplay}
                    </span>
                  </span>
                </a>
              </nav>

              <div className="flex w-full max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View my resume in a new tab"
                  className="group inline-flex min-w-0 w-full items-center justify-center gap-3 rounded-full border border-sky-300/70 bg-white/86 px-5 py-3 text-sm font-semibold tracking-[0.02em] text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.12)] ring-1 ring-white/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-white hover:shadow-[0_18px_42px_rgba(14,165,233,0.18)] dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-50 dark:shadow-[0_18px_42px_rgba(8,145,178,0.14)] dark:ring-cyan-100/15 dark:hover:border-cyan-200/70 dark:hover:bg-cyan-300/16 sm:w-auto"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.32)] transition-transform duration-300 group-hover:scale-105 dark:from-cyan-300 dark:to-sky-400 dark:text-slate-950 dark:shadow-[0_10px_24px_rgba(34,211,238,0.22)]">
                    <FaRegFilePdf className="text-base" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col items-start leading-tight">
                    <span>View my resume</span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-cyan-100/75">
                      Opens PDF in a new tab
                    </span>
                  </span>
                  <span className="shrink-0 text-base text-slate-400 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-cyan-100/75">
                    &rarr;
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => scrollToSection("experience")}
                  className="group inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-full border border-zinc-300/70 bg-white/78 px-5 py-3 text-sm font-semibold tracking-wide text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ring-1 ring-white/65 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100 dark:shadow-[0_16px_36px_rgba(0,0,0,0.26)] dark:ring-white/10 dark:hover:border-cyan-300/40 dark:hover:bg-cyan-300/10 sm:w-auto"
                >
                  Explore my experience
                  <span className="text-slate-400 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-cyan-100/70">
                    &rarr;
                  </span>
                </button>

                <MemoryLaneCta onClick={openMemoryLane} />
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
          aria-labelledby="skills-heading"
          className="border-b border-zinc-200 px-5 py-12 dark:border-zinc-800 sm:px-6 sm:py-14 md:px-20 md:py-16"
        >
          <FadeRow>
            <h2 id="skills-heading" className="mb-8 flex items-center gap-3 text-xl font-semibold tracking-tight after:h-px after:flex-1 after:bg-gradient-to-r after:from-sky-300/50 after:to-transparent dark:after:from-cyan-300/20 md:text-2xl">
              01 - Skills
            </h2>
            <div className="grid w-full grid-cols-[repeat(auto-fit,120px)] justify-center gap-4 sm:gap-5">
              {data.skills.map(({ skill, expertise }) => (
                <Tooltip key={skill} content={expertise}>
                  <motion.div
                    whileHover={{ scale: 1.04, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="
                      group relative flex h-[120px] w-[120px] shrink-0
                      cursor-pointer flex-col items-center justify-center gap-2
                      rounded-2xl border border-zinc-200/70 bg-white/75 p-4
                      shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition-all duration-300
                      hover:border-sky-200 hover:bg-white hover:shadow-[0_16px_38px_rgba(14,165,233,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70
                      dark:border-zinc-800 dark:bg-zinc-900/55 dark:hover:border-sky-400/35
                      dark:ring-white/5 dark:hover:bg-zinc-900 dark:hover:shadow-[0_16px_38px_rgba(0,0,0,0.45)] dark:focus-visible:ring-cyan-300/45
                    "
                  >
                    <div className={`text-3xl transition-transform duration-300 group-hover:scale-110 ${skillColors[skill]}`}>
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
          aria-labelledby="experience-heading"
          className="border-b border-zinc-200 px-5 py-12 dark:border-zinc-800 sm:px-6 sm:py-14 md:px-20 md:py-16"
        >
          <FadeRow>
            <h2 id="experience-heading" className="mb-8 flex items-center gap-3 text-xl font-semibold tracking-tight after:h-px after:flex-1 after:bg-gradient-to-r after:from-sky-300/50 after:to-transparent dark:after:from-cyan-300/20 md:text-2xl">
              <FaBriefcase aria-hidden="true" /> 02 - Experience
            </h2>

            {data.experience.map((exp, i) => (
              <div
                key={i}
                className="group mb-4 grid min-w-0 gap-4 rounded-2xl border border-zinc-200/55 bg-white/10 p-4 shadow-none ring-0 backdrop-blur-0 transition-all duration-300 last:mb-0 hover:-translate-y-0.5 hover:border-sky-200/80 hover:bg-white/24 dark:border-white/10 dark:bg-transparent dark:hover:border-sky-300/24 dark:hover:bg-white/[0.03] sm:grid-cols-[160px_1fr] sm:gap-5 sm:p-5 md:grid-cols-[220px_1fr]"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:items-start sm:pt-1">
  <FaCalendarAlt className="text-xs text-sky-500/80 dark:text-sky-300/80" />
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
  className="
    w-11 h-11 rounded-2xl object-contain
    bg-white/80 dark:bg-zinc-950/70
    backdrop-blur-xl
    p-2
    border border-zinc-200/70 dark:border-zinc-700/60

    shadow-sm

    transition-all duration-300
    group-hover:scale-105
  "
/>

                    )}

                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{exp.role}</h3>
                      <p className="break-words text-sm text-zinc-500 dark:text-zinc-400">{exp.company}</p>
                    </div>
                  </div>

                  <p className="mt-2 break-words text-base leading-relaxed text-zinc-800 dark:text-zinc-200">{exp.description}</p>

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

    bg-transparent dark:bg-transparent
    backdrop-blur-xl

    text-zinc-700 dark:text-zinc-300
    transition-all duration-300

    hover:bg-white/20 dark:hover:bg-white/10
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
    &rarr;
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
          aria-labelledby="education-heading"
          className="px-5 py-12 pb-44 sm:px-6 sm:py-14 sm:pb-40 md:px-20 md:py-16 md:pb-48"
        >
          <FadeRow>
            <h2 id="education-heading" className="mb-8 flex items-center gap-3 text-xl font-semibold tracking-tight after:h-px after:flex-1 after:bg-gradient-to-r after:from-sky-300/50 after:to-transparent dark:after:from-cyan-300/20 md:text-2xl">
              <FaGraduationCap aria-hidden="true" /> 03 - Education
            </h2>

            {data.education.map((edu, i) => (
              <div
                key={i}
                className="mb-4 grid min-w-0 gap-4 rounded-2xl border border-zinc-200/55 bg-white/10 p-4 shadow-none ring-0 backdrop-blur-0 transition-all duration-300 last:mb-0 hover:-translate-y-0.5 hover:border-sky-200/80 hover:bg-white/24 dark:border-white/10 dark:bg-transparent dark:hover:border-sky-300/24 dark:hover:bg-white/[0.03] sm:grid-cols-[160px_1fr] sm:gap-5 sm:p-5 md:grid-cols-[220px_1fr]"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:items-start sm:pt-1">
  <FaCalendarAlt className="text-xs text-sky-500/80 dark:text-sky-300/80" />
  <span>{edu.duration}</span>
</div>
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{edu.degree}</h3>
                  <p className="break-words text-sm text-zinc-500 dark:text-zinc-400">{edu.institution}</p>

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

    bg-transparent dark:bg-transparent
    backdrop-blur-xl

    text-zinc-700 dark:text-zinc-300
    transition-all duration-300

    hover:bg-white/20 dark:hover:bg-white/10
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
    &rarr;
  </span>
</motion.button>

                  )}
                </div>
              </div>
            ))}
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

      <AchievementsModal
        isOpen={modal.isOpen}
        title={modal.title}
        achievements={modal.achievements}
        onClose={() => setModal({ isOpen: false })}
      />

      {hasOpenedGallery && (
        <React.Suspense fallback={null}>
          <MemoryLaneGallery
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
          />
        </React.Suspense>
      )}

      <SocialModal
        isOpen={!!socialModal}
        platform={socialModal?.name}
        url={socialModal?.url}
        icon={socialModal?.icon}
        onClose={() => setSocialModal(null)}
      />
    </>
  );
}
