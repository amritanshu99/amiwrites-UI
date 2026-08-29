import React, { useEffect, useMemo, useState } from "react";

export const INITIAL_LOADER_CREDIT =
  "Written & Directed by Amritanshu Mishra";

const sessionQuotes = [
  "Calibrating a private entrance before the first frame arrives",
  "The theatre stays dark while your secure session takes its mark",
  "A silent handoff is shaping the opening scene",
];

export const INITIAL_LOADER_MIN_DURATION_MS = 1200;
export const INITIAL_LOADER_EXIT_DURATION_MS = 220;

const startupQuoteIndexes = {
  session: Math.floor(Math.random() * sessionQuotes.length),
};

const getPerformanceNow = () => {
  if (
    typeof performance === "undefined" ||
    typeof performance.now !== "function"
  ) {
    return 0;
  }

  const now = performance.now();
  return Number.isFinite(now) ? Math.max(0, now) : 0;
};

let initialLoaderStartedAtMs =
  typeof window !== "undefined" && window.location?.pathname === "/" ? 0 : null;

export const beginInitialLoaderCycle = () => {
  const now = getPerformanceNow();

  if (initialLoaderStartedAtMs === null) {
    initialLoaderStartedAtMs = now;
  }

  return Math.max(0, now - initialLoaderStartedAtMs);
};

export const getInitialLoaderElapsedMs = () => beginInitialLoaderCycle();

export const completeInitialLoaderCycle = () => {
  initialLoaderStartedAtMs = null;
};

const showcaseStatusLines = [
  "Threading the projector",
  "Balancing the shadows",
  "Scoring the first movement",
  "Framing the hero shot",
  "Revealing the universe",
];

const sessionStatusLines = [
  "Checking session signature",
  "Aligning encrypted access",
  "Clearing the private entrance",
  "Bringing the stage online",
];

const floatingDust = [
  { left: "8%", top: "17%", size: 4, delay: "0s", duration: "12s" },
  { left: "16%", top: "68%", size: 3, delay: "1.8s", duration: "14s" },
  { left: "26%", top: "24%", size: 2, delay: "0.6s", duration: "10.5s" },
  { left: "35%", top: "80%", size: 4, delay: "2.3s", duration: "15s" },
  { left: "48%", top: "14%", size: 3, delay: "1.1s", duration: "11.5s" },
  { left: "58%", top: "73%", size: 2, delay: "2.8s", duration: "14.5s" },
  { left: "66%", top: "30%", size: 4, delay: "1.3s", duration: "12.5s" },
  { left: "77%", top: "63%", size: 3, delay: "3s", duration: "16s" },
  { left: "87%", top: "34%", size: 2, delay: "1.4s", duration: "11s" },
  { left: "93%", top: "77%", size: 4, delay: "2.1s", duration: "15.5s" },
];

const timedFloatingDust = floatingDust.filter(
  (_dust, index) => index % 2 === 0 || index === floatingDust.length - 1,
);

const sideMarkerOffsets = ["16%", "28%", "40%", "52%", "64%", "76%"];

const queryMatches = (query) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
};

const getMediaQueryList = (query) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
};

const getPerformanceProfile = () => {
  if (typeof window === "undefined") {
    return {
      isCompactViewport: false,
      isTouchViewport: false,
      prefersReducedMotion: false,
      shouldOptimize: false,
    };
  }

  const prefersReducedMotion = queryMatches("(prefers-reduced-motion: reduce)");
  const isCompactViewport = queryMatches("(max-width: 1024px), (max-height: 740px)");
  const isCoarsePointer = queryMatches("(hover: none), (pointer: coarse)");
  const isTouchViewport = isCoarsePointer;
  const nav = typeof navigator === "undefined" ? {} : navigator;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const deviceMemory = nav.deviceMemory ?? 8;
  const hardwareConcurrency = nav.hardwareConcurrency ?? 8;
  const isLowPowerDevice = deviceMemory <= 4 || hardwareConcurrency <= 4;

  return {
    prefersReducedMotion,
    isCompactViewport,
    isTouchViewport,
    shouldOptimize:
      prefersReducedMotion ||
      saveData ||
      isLowPowerDevice,
  };
};

const InitialLoader = ({ mode = "showcase", durationMs, phase = "visible" }) => {
  const isSessionMode = mode === "session";
  const isTimedShowcase =
    !isSessionMode && Number.isFinite(durationMs) && durationMs > 0;
  const statusLines = isSessionMode ? sessionStatusLines : showcaseStatusLines;
  const topLeftLabel = isSessionMode ? "Secure Access" : "Feature Presentation";
  const topRightLabel = isSessionMode ? "Monochrome Boot" : "Monochrome Intro";
  const introLine = isSessionMode
    ? "House lights stay low while your session is cleared."
    : "Lights out. Let the universe arrive.";
  const footerLabel = isSessionMode
    ? "Verifying secure access"
    : "Preparing the opening scene";
  const railStart = isSessionMode ? "Authenticating" : "Loading";
  const railEnd = isSessionMode ? "Private Session" : "Opening Sequence";
  const accentPills = isSessionMode
    ? ["Encrypted handoff", "Private route", "Noir startup"]
    : ["Cinema grade", "Black frame", "Studio hush"];

  const randomQuote = isSessionMode
    ? sessionQuotes[startupQuoteIndexes.session % sessionQuotes.length]
    : INITIAL_LOADER_CREDIT;
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [performanceProfile, setPerformanceProfile] = useState(
    getPerformanceProfile,
  );

  const {
    prefersReducedMotion,
    shouldOptimize,
    isCompactViewport,
    isTouchViewport,
  } = performanceProfile;
  const animatedDust = useMemo(
    () =>
      shouldOptimize
        ? []
        : isTimedShowcase || isCompactViewport || isTouchViewport
          ? timedFloatingDust
          : floatingDust,
    [isCompactViewport, isTimedShowcase, isTouchViewport, shouldOptimize],
  );
  const visiblePills = isTimedShowcase
    ? []
    : shouldOptimize || isCompactViewport
      ? accentPills.slice(0, 2)
      : accentPills;
  const shouldCycleStatus =
    !isTimedShowcase &&
    !shouldOptimize &&
    !isCompactViewport &&
    !isTouchViewport &&
    !prefersReducedMotion;
  const currentStatus = shouldCycleStatus
    ? statusLines[activeStatusIndex]
    : statusLines[0];
  const showAnimatedStatusDots =
    !isTimedShowcase &&
    !shouldOptimize &&
    !isCompactViewport &&
    !isTouchViewport;
  const progressDurationMs = isTimedShowcase
    ? Math.max(durationMs, INITIAL_LOADER_MIN_DURATION_MS)
    : 1080;
  const [initialProgressElapsedMs] = useState(() =>
    isTimedShowcase ? getInitialLoaderElapsedMs() : 0,
  );
  const badgeClass = shouldOptimize
    ? "loader-badge max-w-[calc(50vw-1.25rem)] truncate rounded-full border px-3 py-2 text-[0.44rem] uppercase tracking-[0.2em] min-[380px]:tracking-[0.28em] sm:max-w-none sm:px-4 sm:text-[0.52rem] sm:tracking-[0.36em]"
    : "loader-badge max-w-[calc(50vw-1.25rem)] truncate rounded-full border px-3 py-2 text-[0.44rem] uppercase tracking-[0.2em] backdrop-blur-md min-[380px]:tracking-[0.28em] sm:max-w-none sm:px-4 sm:text-[0.52rem] sm:tracking-[0.4em]";
  const shellClass = shouldOptimize
    ? `loader-shell relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.55rem] border px-4 py-7 text-center min-[380px]:rounded-[2rem] min-[380px]:px-5 min-[380px]:py-8 sm:px-9 sm:py-11 md:px-12 md:py-14 ${
        isTimedShowcase
          ? ""
          : "animate-[openingReveal_700ms_cubic-bezier(.22,1,.36,1)_forwards]"
      }`
    : `loader-shell relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.65rem] border px-4 py-8 text-center min-[380px]:rounded-[2rem] min-[380px]:px-6 min-[380px]:py-9 sm:rounded-[2.2rem] sm:px-10 sm:py-12 md:px-14 md:py-14 ${
        isTimedShowcase
          ? "backdrop-blur-[6px]"
          : "backdrop-blur-[10px] animate-[openingReveal_1000ms_cubic-bezier(.22,1,.36,1)_forwards]"
      }`;
  const haloClass = shouldOptimize
    ? "loader-halo absolute left-1/2 top-1/2 h-[84vw] w-[84vw] max-h-[420px] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
    : "loader-halo absolute left-1/2 top-[49%] h-[68vh] w-[68vh] max-w-[88vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl animate-[haloPulse_7.5s_ease-in-out_infinite]";
  const centerGlowClass = shouldOptimize
    ? "loader-center-glow absolute inset-0 opacity-40"
    : "loader-center-glow absolute inset-0 animate-[centerGlow_5.8s_ease-in-out_infinite]";
  const frameClass = isTouchViewport
    ? "loader-frame relative z-10 flex h-full min-h-0 items-center justify-center px-3 sm:px-8"
    : "loader-frame relative z-10 flex h-full min-h-0 items-center justify-center px-4 sm:px-8";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const queries = [
      getMediaQueryList("(prefers-reduced-motion: reduce)"),
      getMediaQueryList("(max-width: 1024px), (max-height: 740px)"),
      getMediaQueryList("(hover: none), (pointer: coarse)"),
    ].filter(Boolean);
    const updateProfile = () => setPerformanceProfile(getPerformanceProfile());

    updateProfile();

    queries.forEach((query) => {
      if (query.addEventListener) {
        query.addEventListener("change", updateProfile);
      } else {
        query.addListener(updateProfile);
      }
    });

    return () => {
      queries.forEach((query) => {
        if (query.removeEventListener) {
          query.removeEventListener("change", updateProfile);
        } else {
          query.removeListener(updateProfile);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!shouldCycleStatus) {
      setActiveStatusIndex(0);
      return undefined;
    }

    const statusInterval = window.setInterval(() => {
      setActiveStatusIndex((currentIndex) => (currentIndex + 1) % statusLines.length);
    }, 2100);

    return () => window.clearInterval(statusInterval);
  }, [shouldCycleStatus, statusLines.length]);

  return (
    <div
      data-loader-root
      data-loader-mode={shouldOptimize ? "optimized" : "cinematic"}
      data-loader-compact={isCompactViewport ? "true" : undefined}
      data-loader-timed={isTimedShowcase ? "true" : undefined}
      data-loader-state={phase}
      className="fixed left-0 top-0 z-[9999] overflow-hidden bg-[#010305] text-white antialiased"
      style={{
        "--loader-progress-delay": `-${initialProgressElapsedMs}ms`,
        "--loader-progress-duration": `${progressDurationMs}ms`,
      }}
    >
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={isSessionMode ? "Verifying secure access" : "Loading AmiVerse"}
        className="sr-only"
      >
        {isSessionMode ? "Verifying secure access" : "Loading AmiVerse"}
      </span>

      <div className="loader-visual absolute inset-0" aria-hidden="true">
      <div className="loader-backdrop absolute inset-0" />
      <div className="loader-horizon absolute inset-0" />
      <div className="loader-aurora loader-aurora-left absolute" />
      <div className="loader-aurora loader-aurora-right absolute" />

      {!shouldOptimize && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-[20vh] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[22vh] bg-black shadow-[0_-20px_60px_rgba(0,0,0,0.9)]"
          />
        </>
      )}

      <div className="absolute inset-y-0 left-0 w-[28vw] min-w-[150px] bg-[linear-gradient(90deg,rgba(0,0,0,1),rgba(4,4,4,0.98)_28%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[28vw] min-w-[150px] bg-[linear-gradient(270deg,rgba(0,0,0,1),rgba(4,4,4,0.98)_28%,rgba(0,0,0,0)_100%)]" />

      {!shouldOptimize && !isCompactViewport && (
        <>
          <div
            data-loader-animate
            className="absolute left-1/2 top-[-14%] h-[82vh] w-[52vw] max-w-[720px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.045)_22%,rgba(255,255,255,0.012)_44%,rgba(255,255,255,0)_82%)] opacity-50 blur-[120px] animate-[projectorBloom_12s_ease-in-out_infinite]"
          />
          {!isTimedShowcase && (
            <>
              <div
                data-loader-animate
                className="absolute left-[-12%] top-[-18%] h-[78vh] w-[40vw] min-w-[220px] rotate-[16deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.1),rgba(255,255,255,0.016),rgba(255,255,255,0))] opacity-[0.24] blur-3xl animate-[beamSweepLeft_13s_ease-in-out_infinite]"
              />
              <div
                data-loader-animate
                className="absolute right-[-12%] top-[-10%] h-[70vh] w-[38vw] min-w-[220px] -rotate-[16deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.085),rgba(255,255,255,0.012),rgba(255,255,255,0))] opacity-[0.22] blur-3xl animate-[beamSweepRight_15s_ease-in-out_infinite]"
              />
            </>
          )}
        </>
      )}

      <div
        {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
        className={haloClass}
      />

      <div
        {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
        className={centerGlowClass}
      />

      {!shouldOptimize && (
        <>
          <div
            className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.22)_0.65px,transparent_0.75px)] [background-size:5px_5px]"
          />
          <div
            className="absolute inset-0 opacity-[0.12] [background:repeating-linear-gradient(0deg,transparent_0px,transparent_3px,rgba(255,255,255,0.026)_4px,transparent_5px)]"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.035)_44%,transparent_56%,rgba(255,255,255,0.018)_70%,transparent_100%)] opacity-[0.34]"
          />
        </>
      )}

      <div className="loader-vignette absolute inset-0" />
      <div className={`absolute inset-0 ${shouldOptimize ? "shadow-[inset_0_0_120px_rgba(0,0,0,0.92)]" : "shadow-[inset_0_0_200px_rgba(0,0,0,0.96)]"}`} />
      <div className="loader-outer-frame absolute inset-[14px] rounded-[2rem] border" />
      {!shouldOptimize && (
        <div className="loader-outer-frame-secondary absolute inset-[30px] hidden rounded-[1.75rem] border sm:block" />
      )}

      {!shouldOptimize &&
        !isTimedShowcase &&
        sideMarkerOffsets.map((offset, index) => (
          <React.Fragment key={offset}>
            <span
              data-loader-animate
              className="absolute left-5 hidden h-10 w-[2px] rounded-full bg-white/[0.06] md:block animate-[markerBlink_4.2s_ease-in-out_infinite]"
              style={{ top: offset, animationDelay: `${index * 220}ms` }}
            />
            <span
              data-loader-animate
              className="absolute right-5 hidden h-10 w-[2px] rounded-full bg-white/[0.06] md:block animate-[markerBlink_4.2s_ease-in-out_infinite]"
              style={{ top: offset, animationDelay: `${index * 220 + 160}ms` }}
            />
          </React.Fragment>
        ))}

      {animatedDust.map((dust, index) => (
        <span
          key={`${dust.left}-${dust.top}-${index}`}
          data-loader-animate
          className={`loader-dust pointer-events-none absolute rounded-full bg-white/40 ${
            shouldOptimize ? "" : "blur-[1px]"
          }`}
          style={{
            left: dust.left,
            top: dust.top,
            width: `${shouldOptimize ? Math.max(dust.size - 1, 2) : dust.size}px`,
            height: `${shouldOptimize ? Math.max(dust.size - 1, 2) : dust.size}px`,
            animation: `dustFloat ${shouldOptimize ? "16s" : dust.duration} ease-in-out ${dust.delay} infinite`,
          }}
        />
      ))}

      <div className="loader-badges pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2 sm:inset-x-7 sm:top-6">
        <div className={`${badgeClass} flex items-center gap-2`}>
          <span className="loader-badge-signal h-1.5 w-1.5 shrink-0 rounded-full" />
          <span className="truncate">{topLeftLabel}</span>
        </div>
        <div className={`${badgeClass} flex items-center gap-2 text-right`}>
          <span className="truncate">{topRightLabel}</span>
          <span className="loader-badge-index shrink-0">01</span>
        </div>
      </div>

      <div className={frameClass}>
        <div
          data-loader-animate
          className={shellClass}
        >
          <div className="loader-shell-highlight absolute inset-x-6 top-0 h-px sm:inset-x-10 md:inset-x-16" />
          <div className="loader-shell-highlight loader-shell-highlight-bottom absolute inset-x-8 bottom-0 h-px sm:inset-x-12 md:inset-x-20" />
          <div className="loader-shell-inset absolute inset-[1px] rounded-[calc(2rem-1px)] border sm:rounded-[calc(2.2rem-1px)]" />
          <div className="loader-shell-glow absolute inset-0" />

          {!shouldOptimize && (
            <div className="absolute left-1/2 top-0 h-full w-[40%] max-w-[460px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)_38%,transparent_100%)] opacity-30 blur-[80px]" />
          )}

          <div className="loader-content relative z-10 mx-auto flex max-w-4xl flex-col items-center">
            {visiblePills.length > 0 && (
              <div className="loader-pills flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
                {visiblePills.map((pill) => (
                  <span
                    key={pill}
                    className={`rounded-full border border-white/[0.08] px-3 py-1.5 text-[0.46rem] uppercase text-white/[0.3] sm:px-4 sm:text-[0.5rem] ${
                      shouldOptimize
                        ? "bg-white/[0.015] tracking-[0.3em]"
                        : "bg-white/[0.02] tracking-[0.42em]"
                    }`}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            )}

            <div className="loader-kicker mt-5 flex items-center justify-center gap-3 text-[0.58rem] uppercase tracking-[0.28em] min-[380px]:mt-6 min-[380px]:gap-4 min-[380px]:tracking-[0.38em] sm:text-[0.64rem] sm:tracking-[0.5em]">
              <span className="loader-kicker-index font-semibold">01</span>
              <span className="loader-kicker-line h-px w-8 sm:w-12" />
              <span>{isSessionMode ? "Access protocol" : "AmiVerse original"}</span>
            </div>

            <div className="loader-divider loader-divider-top mt-5 h-px w-32 sm:w-40" />

            <div
              {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
              className={`loader-emblem relative mt-8 h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 ${
                shouldOptimize
                  ? ""
                  : isTimedShowcase
                    ? ""
                    : "animate-[emblemFloat_5.4s_ease-in-out_infinite]"
              }`}
            >
              <div className="loader-emblem-aura absolute inset-[-30%] rounded-full" />
              <div className="loader-emblem-plate absolute inset-0 rounded-full border" />
              {!shouldOptimize && (
                <div
                  data-loader-animate
                  className="loader-emblem-shutter absolute inset-[10px] rounded-full border animate-[shutterSpin_18s_linear_infinite]"
                />
              )}
              <span className="loader-orbit-node absolute left-1/2 top-[-3px] h-2 w-2 -translate-x-1/2 rounded-full" />
              <div className="loader-emblem-core absolute inset-[18px] rounded-full border sm:inset-[20px]" />
              <div className="loader-emblem-icon absolute inset-[28px] flex items-center justify-center rounded-[1rem] border sm:inset-[32px] sm:rounded-[1.2rem]">
                <img
                  src="/icons/icon-96x96.png"
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  className="h-9 w-9 rounded-[0.8rem] object-contain opacity-95 sm:h-12 sm:w-12"
                />
              </div>
              {!shouldOptimize &&
                (isTimedShowcase ? (
                  <span
                    data-loader-animate
                    className="absolute inset-[-10px] rounded-full border border-white/[0.06] animate-[cinematicRingCue_780ms_cubic-bezier(.22,1,.36,1)_160ms_both]"
                  />
                ) : (
                  <>
                    <span
                      data-loader-animate
                      className="absolute inset-[-10px] rounded-full border border-white/[0.06] animate-[ringEcho_3.6s_ease-out_infinite]"
                    />
                    <span
                      data-loader-animate
                      className="absolute inset-[-20px] rounded-full border border-white/[0.04] animate-[ringEcho_3.6s_ease-out_1.1s_infinite]"
                    />
                  </>
                ))}
            </div>

            <p className="loader-intro mt-7 max-w-full text-[0.62rem] font-semibold uppercase tracking-[0.2em] min-[380px]:mt-8 min-[380px]:tracking-[0.28em] sm:text-xs sm:tracking-[0.4em]">
              {introLine}
            </p>

            <p
              {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
              className={`loader-title mt-4 max-w-full font-cinzel text-[2rem] font-medium uppercase leading-none tracking-[0.08em] min-[390px]:text-[2.45rem] min-[390px]:tracking-[0.12em] sm:text-5xl sm:tracking-[0.2em] md:text-6xl md:tracking-[0.24em] lg:text-7xl ${
                shouldOptimize
                  ? ""
                  : isTimedShowcase
                    ? ""
                    : "animate-[titleGlow_5s_ease-in-out_infinite]"
              }`}
            >
              <span>Ami</span><span className="loader-title-accent">Verse</span>
            </p>

            <div className="loader-divider loader-divider-main mt-6 h-px w-40 max-w-full sm:w-56 md:w-72" />

            <p
              {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
              className={`loader-quote mt-6 max-w-2xl font-cinzel text-[0.68rem] leading-relaxed tracking-[0.08em] min-[380px]:text-[0.72rem] min-[380px]:tracking-[0.12em] sm:text-sm sm:tracking-[0.16em] md:text-base ${
                shouldOptimize
                  ? ""
                  : isTimedShowcase
                    ? ""
                    : "animate-[quoteBreath_5.5s_ease-in-out_infinite]"
              }`}
            >
              {randomQuote}
            </p>

            <div className="loader-rail mt-10 w-full max-w-xl sm:mt-11">
              <div className="flex items-center justify-between gap-3 text-[0.48rem] uppercase tracking-[0.18em] text-white/[0.44] min-[380px]:tracking-[0.26em] sm:text-[0.56rem] sm:tracking-[0.34em]">
                <span>{railStart}</span>
                <span>{railEnd}</span>
              </div>
              <div className="loader-progress-track relative mt-3 h-[3px] overflow-hidden rounded-full">
                <span className="loader-progress-bed absolute inset-y-0 left-0 w-full rounded-full" />
                {isTimedShowcase ? (
                  <>
                    <span
                      data-loader-animate
                      className={`absolute inset-y-0 left-0 w-full origin-left rounded-full ${
                        prefersReducedMotion
                          ? "loader-progress-complete opacity-80"
                          : "loader-progress-fill"
                      }`}
                    />
                    {!prefersReducedMotion && (
                      <span
                        data-loader-animate
                        className="loader-progress-hold absolute inset-y-0 left-[-24%] w-[24%] rounded-full"
                      />
                    )}
                  </>
                ) : (
                  <span
                    data-loader-animate
                    className={`absolute inset-y-0 left-[-42%] w-[42%] rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-95 ${
                      shouldOptimize
                        ? "animate-[progressTravel_2.45s_linear_infinite]"
                        : "animate-[progressTravel_2.15s_cubic-bezier(.22,1,.36,1)_infinite]"
                    }`}
                  />
                )}
              </div>
            </div>

            {!isTimedShowcase && (
              <div className="loader-status mt-7 grid w-full max-w-2xl items-start gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="text-center sm:text-left">
                  <p className="text-[0.5rem] uppercase tracking-[0.28em] text-white/[0.28] sm:tracking-[0.42em]">
                    Current cue
                  </p>
                  <p className="mt-2 min-h-[1.1rem] font-cinzel text-[0.64rem] uppercase tracking-[0.16em] text-white/[0.72] transition-colors duration-300 min-[380px]:text-[0.68rem] min-[380px]:tracking-[0.22em] sm:text-[0.74rem] sm:tracking-[0.28em]">
                    {currentStatus}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2.5 sm:justify-end">
                  <span
                    {...(showAnimatedStatusDots ? { "data-loader-animate": true } : {})}
                    className={`h-1.5 w-1.5 rounded-full ${
                      showAnimatedStatusDots
                        ? "bg-white/[0.68] animate-[dotPulse_1.8s_ease-in-out_infinite]"
                        : "bg-white/[0.4]"
                    }`}
                  />
                  <span
                    {...(showAnimatedStatusDots ? { "data-loader-animate": true } : {})}
                    className={`h-1.5 w-1.5 rounded-full ${
                      showAnimatedStatusDots
                        ? "bg-white/[0.46] animate-[dotPulse_1.8s_ease-in-out_240ms_infinite]"
                        : "bg-white/[0.28]"
                    }`}
                  />
                  <span
                    {...(showAnimatedStatusDots ? { "data-loader-animate": true } : {})}
                    className={`h-1.5 w-1.5 rounded-full ${
                      showAnimatedStatusDots
                        ? "bg-white/[0.28] animate-[dotPulse_1.8s_ease-in-out_480ms_infinite]"
                        : "bg-white/[0.18]"
                    }`}
                  />
                </div>
              </div>
            )}

            <p
              {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
              className="loader-footer mt-7 flex max-w-full items-center justify-center gap-2.5 text-[0.56rem] font-medium uppercase tracking-[0.26em] min-[380px]:tracking-[0.36em] sm:text-[0.62rem] sm:tracking-[0.46em]"
            >
              <span className="loader-footer-pulse h-1.5 w-1.5 shrink-0 rounded-full" />
              <span>{footerLabel}</span>
            </p>
          </div>
        </div>
      </div>
      </div>

      <style>
        {`
          [data-loader-root] {
            contain: layout paint;
            isolation: isolate;
            width: 100vw;
            height: 100vh;
            height: 100svh;
            min-height: 100svh;
            --loader-accent: 103, 232, 249;
            --loader-accent-strong: 34, 211, 238;
            --loader-blue: 14, 165, 233;
            --loader-frame-top: max(clamp(3.25rem, 6vh, 4.5rem), calc(env(safe-area-inset-top) + 0.75rem));
            --loader-frame-bottom: max(clamp(3.25rem, 6vh, 4.5rem), calc(env(safe-area-inset-bottom) + 0.75rem));
            --loader-shell-x: clamp(1rem, 4vw, 3.5rem);
            --loader-shell-y: clamp(1rem, 4vh, 3.5rem);
            --loader-stack-gap: clamp(0.5rem, 1.9vh, 1.5rem);
            --loader-stack-gap-lg: clamp(0.7rem, 2.7vh, 2.75rem);
            opacity: 1;
            overscroll-behavior: none;
            text-rendering: geometricPrecision;
            touch-action: none;
            transition: opacity ${INITIAL_LOADER_EXIT_DURATION_MS}ms cubic-bezier(.22, 1, .36, 1);
          }

          @supports (height: 100dvh) {
            [data-loader-root] {
              height: 100dvh;
              min-height: 100dvh;
            }
          }

          [data-loader-root][data-loader-state="exiting"] {
            opacity: 0;
            pointer-events: none;
          }

          .loader-visual {
            overflow: hidden;
          }

          .loader-backdrop {
            background:
              radial-gradient(circle at 50% 42%, rgba(var(--loader-accent), 0.105), rgba(4, 12, 17, 0.92) 30%, #010305 68%),
              linear-gradient(145deg, #02070a 0%, #010203 46%, #03070a 100%);
          }

          .loader-horizon {
            background:
              linear-gradient(180deg, rgba(0, 0, 0, 0.92) 0%, rgba(1, 7, 10, 0.7) 34%, rgba(0, 0, 0, 0.72) 68%, #000 100%),
              linear-gradient(90deg, transparent 0%, rgba(var(--loader-accent), 0.035) 50%, transparent 100%);
          }

          .loader-aurora {
            width: min(38rem, 58vw);
            height: min(38rem, 58vw);
            border-radius: 9999px;
            filter: blur(90px);
            opacity: 0.12;
            pointer-events: none;
          }

          .loader-aurora-left {
            left: -24rem;
            top: -18rem;
            background: rgba(var(--loader-blue), 0.82);
          }

          .loader-aurora-right {
            right: -26rem;
            bottom: -20rem;
            background: rgba(var(--loader-accent-strong), 0.62);
          }

          .loader-halo {
            border: 1px solid rgba(var(--loader-accent), 0.07);
            background: radial-gradient(circle, rgba(var(--loader-accent), 0.12) 0%, rgba(var(--loader-blue), 0.035) 31%, rgba(0, 0, 0, 0) 70%);
          }

          .loader-center-glow {
            background: radial-gradient(circle at 50% 53%, rgba(var(--loader-accent), 0.12), rgba(var(--loader-blue), 0.028) 24%, rgba(0, 0, 0, 0) 48%);
          }

          .loader-vignette {
            background: radial-gradient(circle at center, transparent 28%, rgba(0, 0, 0, 0.74) 74%, rgba(0, 0, 0, 0.98) 100%);
          }

          .loader-outer-frame {
            border-color: rgba(var(--loader-accent), 0.075);
            box-shadow: inset 0 0 40px rgba(var(--loader-accent), 0.018);
          }

          .loader-outer-frame-secondary {
            border-color: rgba(255, 255, 255, 0.026);
          }

          .loader-badges {
            top: max(0.75rem, calc(env(safe-area-inset-top) + 0.35rem)) !important;
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }

          @media (min-width: 640px) {
            .loader-badges {
              top: max(1.5rem, calc(env(safe-area-inset-top) + 0.75rem)) !important;
            }
          }

          .loader-badge {
            border-color: rgba(var(--loader-accent), 0.14);
            background: rgba(1, 7, 10, 0.72);
            color: rgba(226, 249, 252, 0.68);
            box-shadow:
              0 10px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.035);
          }

          .loader-badge-signal,
          .loader-footer-pulse {
            background: rgb(var(--loader-accent));
            box-shadow: 0 0 12px rgba(var(--loader-accent), 0.9);
          }

          .loader-badge-index {
            color: rgba(var(--loader-accent), 0.78);
            font-weight: 700;
            letter-spacing: 0.08em;
          }

          .loader-frame {
            height: 100%;
            min-height: 0;
            box-sizing: border-box;
            padding-top: var(--loader-frame-top);
            padding-bottom: var(--loader-frame-bottom);
          }

          .loader-shell {
            display: flex;
            max-height: 100%;
            min-height: 0;
            padding: var(--loader-shell-y) var(--loader-shell-x) !important;
            border-color: rgba(var(--loader-accent), 0.14) !important;
            background:
              radial-gradient(circle at 50% 4%, rgba(var(--loader-accent), 0.1), transparent 38%),
              linear-gradient(155deg, rgba(8, 17, 22, 0.94), rgba(1, 4, 6, 0.9) 45%, rgba(2, 9, 12, 0.96));
            box-shadow:
              0 36px 130px rgba(0, 0, 0, 0.9),
              0 0 80px rgba(var(--loader-blue), 0.045),
              inset 0 1px 0 rgba(255, 255, 255, 0.065),
              inset 0 -1px 0 rgba(var(--loader-accent), 0.035) !important;
            transform-origin: center;
          }

          .loader-shell-highlight {
            background: linear-gradient(90deg, transparent, rgba(var(--loader-accent), 0.88), rgba(255, 255, 255, 0.5), transparent);
            box-shadow: 0 0 18px rgba(var(--loader-accent), 0.26);
          }

          .loader-shell-highlight-bottom {
            background: linear-gradient(90deg, transparent, rgba(var(--loader-accent), 0.18), transparent);
            box-shadow: none;
          }

          .loader-shell-inset {
            border-color: rgba(255, 255, 255, 0.035);
          }

          .loader-shell-glow {
            background: radial-gradient(circle at 50% 12%, rgba(var(--loader-accent), 0.105), rgba(var(--loader-blue), 0.025) 34%, transparent 58%);
          }

          .loader-shell::before {
            position: absolute;
            inset: clamp(0.85rem, 2.4vw, 1.4rem);
            z-index: 1;
            border-radius: calc(1.55rem - 0.5rem);
            background:
              linear-gradient(90deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0)) left top / 2.25rem 1px no-repeat,
              linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0)) left top / 1px 2.25rem no-repeat,
              linear-gradient(270deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0)) right bottom / 2.25rem 1px no-repeat,
              linear-gradient(0deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0)) right bottom / 1px 2.25rem no-repeat;
            content: "";
            opacity: 0.42;
            pointer-events: none;
          }

          .loader-shell::after {
            position: absolute;
            inset: 0;
            z-index: 1;
            border-radius: inherit;
            background: linear-gradient(112deg, transparent 18%, rgba(255, 255, 255, 0.028) 43%, transparent 63%);
            content: "";
            opacity: 0.7;
            pointer-events: none;
          }

          .loader-content {
            width: 100%;
            max-height: 100%;
            min-height: 0;
            justify-content: center;
          }

          .loader-content > * + * {
            margin-top: var(--loader-stack-gap) !important;
          }

          .loader-divider {
            flex: 0 0 auto;
            background: linear-gradient(90deg, transparent, rgba(var(--loader-accent), 0.76), rgba(255, 255, 255, 0.62), rgba(var(--loader-accent), 0.76), transparent);
            box-shadow: 0 0 12px rgba(var(--loader-accent), 0.12);
          }

          .loader-kicker {
            color: rgba(218, 247, 250, 0.72);
          }

          .loader-kicker-index {
            color: rgb(var(--loader-accent));
            text-shadow: 0 0 16px rgba(var(--loader-accent), 0.35);
          }

          .loader-kicker-line {
            background: linear-gradient(90deg, rgba(var(--loader-accent), 0.12), rgba(var(--loader-accent), 0.78));
          }

          .loader-emblem {
            width: clamp(4.35rem, min(17vh, 24vw), 9rem) !important;
            height: clamp(4.35rem, min(17vh, 24vw), 9rem) !important;
            flex: 0 0 auto;
            filter: drop-shadow(0 18px 26px rgba(0, 0, 0, 0.62));
          }

          .loader-emblem-aura {
            background: radial-gradient(circle, rgba(var(--loader-accent), 0.15), rgba(var(--loader-blue), 0.035) 40%, transparent 70%);
            filter: blur(12px);
          }

          .loader-emblem-plate {
            border-color: rgba(var(--loader-accent), 0.2);
            background:
              radial-gradient(circle, rgba(var(--loader-accent), 0.12) 0%, rgba(255, 255, 255, 0.03) 34%, rgba(1, 8, 11, 0.76) 72%, rgba(0, 0, 0, 0.92) 100%);
            box-shadow:
              0 0 50px rgba(var(--loader-accent), 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .loader-emblem-shutter {
            border-color: rgba(var(--loader-accent), 0.14);
            background: conic-gradient(from 0deg, rgba(var(--loader-accent), 0.9) 0deg, rgba(var(--loader-accent), 0.06) 25deg, transparent 62deg, rgba(255, 255, 255, 0.36) 132deg, transparent 202deg, rgba(var(--loader-accent), 0.45) 262deg, transparent 322deg, rgba(var(--loader-accent), 0.9) 360deg);
            -webkit-mask: radial-gradient(circle, transparent 57%, #000 59%);
            mask: radial-gradient(circle, transparent 57%, #000 59%);
          }

          .loader-emblem-core {
            border-color: rgba(var(--loader-accent), 0.18);
            background: rgba(0, 5, 7, 0.92);
            box-shadow:
              inset 0 0 30px rgba(var(--loader-accent), 0.06),
              0 0 24px rgba(var(--loader-accent), 0.045);
          }

          .loader-emblem-icon {
            border-color: rgba(var(--loader-accent), 0.22);
            background: linear-gradient(145deg, rgba(8, 22, 27, 0.98), rgba(0, 3, 5, 0.98));
            box-shadow:
              0 16px 36px rgba(0, 0, 0, 0.66),
              inset 0 1px 0 rgba(255, 255, 255, 0.08),
              0 0 22px rgba(var(--loader-accent), 0.06);
          }

          .loader-orbit-node {
            background: rgb(var(--loader-accent));
            box-shadow:
              0 0 8px rgba(var(--loader-accent), 1),
              0 0 20px rgba(var(--loader-accent), 0.72);
          }

          .loader-intro {
            color: rgba(var(--loader-accent), 0.72);
            text-shadow: 0 0 18px rgba(var(--loader-accent), 0.12);
          }

          .loader-title {
            font-size: clamp(2rem, min(9vw, 8.2vh), 5.3rem) !important;
            line-height: 0.92 !important;
            color: #f8feff;
            filter: drop-shadow(0 18px 36px rgba(0, 0, 0, 0.82));
            text-wrap: balance;
          }

          .loader-title-accent {
            background: linear-gradient(112deg, #ffffff 4%, #dffcff 34%, rgb(var(--loader-accent)) 62%, #f8ffff 96%);
            color: rgb(var(--loader-accent));
            text-shadow: 0 0 34px rgba(var(--loader-accent), 0.12);
          }

          @supports ((-webkit-background-clip: text) or (background-clip: text)) {
            .loader-title-accent {
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
          }

          .loader-quote {
            display: -webkit-box;
            overflow: hidden;
            color: rgba(226, 243, 245, 0.78);
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }

          .loader-rail {
            margin-top: var(--loader-stack-gap-lg) !important;
          }

          .loader-rail > div:first-child {
            color: rgba(209, 241, 245, 0.56);
          }

          .loader-progress-track {
            background: rgba(var(--loader-accent), 0.075);
            box-shadow:
              0 0 22px rgba(var(--loader-accent), 0.075),
              inset 0 0 0 1px rgba(255, 255, 255, 0.025);
          }

          .loader-progress-bed {
            background: linear-gradient(90deg, rgba(var(--loader-accent), 0.02), rgba(var(--loader-accent), 0.12), rgba(var(--loader-accent), 0.02));
          }

          .loader-progress-fill,
          .loader-progress-complete {
            background: linear-gradient(90deg, rgba(var(--loader-blue), 0.56), rgb(var(--loader-accent)), #f2ffff);
            box-shadow: 0 0 16px rgba(var(--loader-accent), 0.58);
          }

          .loader-progress-fill {
            animation: progressFill var(--loader-progress-duration) cubic-bezier(.22, 1, .36, 1) var(--loader-progress-delay) both;
          }

          .loader-progress-complete {
            transform: scaleX(0.88);
          }

          .loader-progress-hold {
            background: linear-gradient(90deg, transparent, rgba(231, 254, 255, 0.94), transparent);
            filter: drop-shadow(0 0 6px rgba(var(--loader-accent), 0.72));
            animation: progressHold 1.3s ease-in-out calc(var(--loader-progress-delay) + var(--loader-progress-duration)) infinite;
          }

          [data-loader-root][data-loader-state="exiting"] .loader-progress-fill,
          [data-loader-root][data-loader-state="exiting"] .loader-progress-complete {
            animation: none !important;
            transform: scaleX(1);
            transition: transform 180ms cubic-bezier(.22, 1, .36, 1);
          }

          [data-loader-root][data-loader-state="exiting"] .loader-progress-hold {
            opacity: 0;
          }

          .loader-status,
          .loader-footer {
            margin-top: var(--loader-stack-gap) !important;
          }

          .loader-footer {
            color: rgba(211, 241, 245, 0.64);
          }

          [data-loader-root][data-loader-compact="true"] .loader-aurora,
          [data-loader-root][data-loader-mode="optimized"] .loader-aurora {
            filter: blur(58px);
            opacity: 0.09;
          }

          [data-loader-root][data-loader-compact="true"] .loader-shell,
          [data-loader-root][data-loader-mode="optimized"] .loader-shell {
            -webkit-backdrop-filter: none !important;
            backdrop-filter: none !important;
          }

          [data-loader-root][data-loader-compact="true"] .loader-halo {
            filter: blur(32px);
          }

          [data-loader-root][data-loader-compact="true"] .loader-halo,
          [data-loader-root][data-loader-compact="true"] .loader-center-glow,
          [data-loader-root][data-loader-compact="true"] .loader-emblem-shutter {
            animation: none !important;
          }

          [data-loader-root][data-loader-compact="true"] .loader-dust {
            animation-iteration-count: 1 !important;
          }

          [data-loader-root][data-loader-compact="true"]:not([data-loader-timed="true"]) .loader-emblem,
          [data-loader-root][data-loader-compact="true"]:not([data-loader-timed="true"]) .loader-title,
          [data-loader-root][data-loader-compact="true"]:not([data-loader-timed="true"]) .loader-quote {
            animation: none !important;
          }

          [data-loader-root][data-loader-timed="true"] .loader-shell {
            animation: cinematicShellCue 720ms cubic-bezier(.22, 1, .36, 1) var(--loader-progress-delay) both;
          }

          [data-loader-root][data-loader-timed="true"] .loader-kicker,
          [data-loader-root][data-loader-timed="true"] .loader-divider-top {
            animation: cinematicTextCue 560ms cubic-bezier(.22, 1, .36, 1) calc(var(--loader-progress-delay) + 40ms) both;
          }

          [data-loader-root][data-loader-timed="true"] .loader-emblem {
            animation: cinematicEmblemCue 620ms cubic-bezier(.22, 1, .36, 1) calc(var(--loader-progress-delay) + 80ms) both;
          }

          [data-loader-root][data-loader-timed="true"] .loader-intro {
            animation: cinematicTextCue 560ms cubic-bezier(.22, 1, .36, 1) calc(var(--loader-progress-delay) + 130ms) both;
          }

          [data-loader-root][data-loader-timed="true"] .loader-title {
            animation: cinematicTitleCue 620ms cubic-bezier(.22, 1, .36, 1) calc(var(--loader-progress-delay) + 170ms) both;
          }

          [data-loader-root][data-loader-timed="true"] .loader-divider-main,
          [data-loader-root][data-loader-timed="true"] .loader-quote {
            animation: cinematicQuoteCue 580ms cubic-bezier(.22, 1, .36, 1) calc(var(--loader-progress-delay) + 230ms) both;
          }

          [data-loader-root][data-loader-timed="true"] .loader-rail,
          [data-loader-root][data-loader-timed="true"] .loader-footer {
            animation: cinematicTextCue 520ms cubic-bezier(.22, 1, .36, 1) calc(var(--loader-progress-delay) + 300ms) both;
          }

          @media (min-width: 768px) and (min-height: 760px) {
            [data-loader-root] {
              --loader-frame-top: max(clamp(1.5rem, 3.2vh, 2rem), calc(env(safe-area-inset-top) + 0.75rem));
              --loader-frame-bottom: max(clamp(1.5rem, 3.2vh, 2rem), calc(env(safe-area-inset-bottom) + 0.75rem));
            }
          }

          @media (max-height: 720px) {
            [data-loader-root] {
              --loader-frame-top: max(clamp(1.75rem, 4.5vh, 2.25rem), calc(env(safe-area-inset-top) + 0.5rem));
              --loader-frame-bottom: max(clamp(1.75rem, 4.5vh, 2.25rem), calc(env(safe-area-inset-bottom) + 0.5rem));
              --loader-shell-y: clamp(0.75rem, 2.2vh, 1.35rem);
              --loader-stack-gap: clamp(0.35rem, 1.35vh, 0.8rem);
              --loader-stack-gap-lg: clamp(0.45rem, 1.8vh, 1rem);
            }

            .loader-pills {
              display: none !important;
            }

            .loader-quote {
              -webkit-line-clamp: 1;
            }

            .loader-rail > div:first-child {
              font-size: 0.46rem;
              letter-spacing: 0.14em;
            }
          }

          @media (max-width: 359px) {
            .loader-badge {
              padding: 0.45rem 0.6rem !important;
              font-size: 0.4rem !important;
              letter-spacing: 0.12em !important;
            }

            .loader-badge-signal {
              display: none;
            }

            .loader-shell {
              box-shadow:
                0 22px 70px rgba(0, 0, 0, 0.86),
                inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
            }

            .loader-title {
              font-size: clamp(1.82rem, 9.2vw, 2.1rem) !important;
              letter-spacing: 0.08em !important;
            }

            .loader-intro,
            .loader-quote {
              letter-spacing: 0.08em !important;
            }
          }

          @media (max-height: 600px) {
            [data-loader-root] {
              --loader-frame-top: max(1rem, calc(env(safe-area-inset-top) + 0.5rem));
              --loader-frame-bottom: max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem));
              --loader-shell-x: clamp(0.85rem, 3vw, 1.5rem);
              --loader-shell-y: clamp(0.6rem, 1.7vh, 0.95rem);
              --loader-stack-gap: clamp(0.28rem, 1vh, 0.58rem);
              --loader-stack-gap-lg: clamp(0.35rem, 1.25vh, 0.72rem);
            }

            .loader-kicker,
            .loader-divider-top,
            .loader-footer {
              display: none !important;
            }

            .loader-emblem {
              width: clamp(3.4rem, min(18vh, 18vw), 5.5rem) !important;
              height: clamp(3.4rem, min(18vh, 18vw), 5.5rem) !important;
            }

            .loader-emblem-shutter {
              inset: 6px !important;
            }

            .loader-emblem-core {
              inset: 8px !important;
            }

            .loader-emblem-icon {
              inset: 14px !important;
              border-radius: 0.72rem !important;
            }

            .loader-emblem-icon img {
              width: clamp(1.25rem, 7vw, 1.7rem) !important;
              height: clamp(1.25rem, 7vw, 1.7rem) !important;
              border-radius: 0.55rem !important;
            }

            .loader-title {
              font-size: clamp(1.75rem, min(8.5vw, 8vh), 3rem) !important;
            }

            .loader-intro,
            .loader-quote,
            .loader-status {
              font-size: 0.58rem !important;
              letter-spacing: 0.12em !important;
            }
          }

          @media (max-height: 500px) {
            [data-loader-root] {
              --loader-frame-top: max(0.55rem, calc(env(safe-area-inset-top) + 0.35rem));
              --loader-frame-bottom: max(0.55rem, calc(env(safe-area-inset-bottom) + 0.35rem));
            }

            .loader-badges,
            .loader-intro,
            .loader-quote {
              display: none !important;
            }

            .loader-status {
              grid-template-columns: 1fr auto;
              align-items: center;
              gap: 0.75rem;
            }

            .loader-status p:first-child {
              display: none;
            }
          }

          @media (max-height: 390px) {
            .loader-divider-main,
            .loader-status {
              display: none !important;
            }

            .loader-emblem {
              width: clamp(2.85rem, 18vh, 4rem) !important;
              height: clamp(2.85rem, 18vh, 4rem) !important;
            }

            .loader-emblem-core {
              inset: 7px !important;
            }

            .loader-emblem-icon {
              inset: 12px !important;
            }

            .loader-emblem-icon img {
              width: 1.15rem !important;
              height: 1.15rem !important;
            }

            .loader-rail {
              max-width: min(26rem, 100%);
            }
          }

          @media (max-height: 320px) {
            .loader-rail {
              display: none !important;
            }

            .loader-title {
              font-size: clamp(1.35rem, 10vh, 2.1rem) !important;
            }
          }

          .loader-shell,
          .loader-emblem,
          .loader-rail [data-loader-animate] {
            backface-visibility: hidden;
          }

          @media (hover: hover) and (pointer: fine) {
            .loader-shell,
            .loader-emblem,
            .loader-rail [data-loader-animate] {
              will-change: transform, opacity;
            }
          }

          @keyframes cinematicShellCue {
            0% {
              opacity: 0.86;
              transform: translate3d(0, 7px, 0) scale(0.994);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @keyframes cinematicTextCue {
            0% {
              opacity: 0;
              transform: translate3d(0, 4px, 0);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes openingReveal {
            0% {
              opacity: 0.82;
              transform: translate3d(0, 8px, 0) scale(0.992);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @keyframes letterboxBreath {
            0%,
            100% {
              transform: scaleY(1);
              opacity: 0.98;
            }
            50% {
              transform: scaleY(1.035);
              opacity: 1;
            }
          }

          @keyframes projectorBloom {
            0%,
            100% {
              transform: translate3d(-50%, 0, 0) scaleY(0.98);
              opacity: 0.38;
            }
            50% {
              transform: translate3d(-50%, 0, 0) scaleY(1.02);
              opacity: 0.54;
            }
          }

          @keyframes cinematicEmblemCue {
            0% {
              opacity: 0;
              transform: translate3d(0, 6px, 0) scale(0.96);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @keyframes cinematicTitleCue {
            0% {
              opacity: 0;
              filter: blur(2px) drop-shadow(0 18px 40px rgba(0, 0, 0, 0.9));
              transform: translate3d(0, 6px, 0);
            }
            100% {
              opacity: 1;
              filter: blur(0) drop-shadow(0 18px 40px rgba(0, 0, 0, 0.9));
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes cinematicQuoteCue {
            0% {
              opacity: 0;
              transform: translate3d(0, 4px, 0);
            }
            100% {
              opacity: 0.9;
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes cinematicRingCue {
            0% {
              opacity: 0;
              transform: scale(0.92);
            }
            42% {
              opacity: 0.45;
            }
            100% {
              opacity: 0;
              transform: scale(1.16);
            }
          }

          @keyframes haloPulse {
            0%,
            100% {
              transform: translate3d(-50%, -50%, 0) scale(0.93);
              opacity: 0.68;
            }
            50% {
              transform: translate3d(-50%, -50%, 0) scale(1.05);
              opacity: 1;
            }
          }

          @keyframes beamSweepLeft {
            0%,
            100% {
              transform: rotate(16deg) translate3d(0, 0, 0);
              opacity: 0.18;
            }
            50% {
              transform: rotate(14deg) translate3d(2%, 1%, 0);
              opacity: 0.3;
            }
          }

          @keyframes beamSweepRight {
            0%,
            100% {
              transform: rotate(-16deg) translate3d(0, 0, 0);
              opacity: 0.14;
            }
            50% {
              transform: rotate(-14deg) translate3d(-2%, 1%, 0);
              opacity: 0.26;
            }
          }

          @keyframes centerGlow {
            0%,
            100% {
              opacity: 0.28;
              transform: scale(0.98);
            }
            50% {
              opacity: 0.42;
              transform: scale(1.03);
            }
          }

          @keyframes grainDrift {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-2.4%, 2%, 0);
            }
          }

          @keyframes scanlines {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(0, 18px, 0);
            }
          }

          @keyframes dustFloat {
            0% {
              transform: translate3d(0, 0, 0) scale(0.9);
              opacity: 0;
            }
            20% {
              opacity: 0.62;
            }
            80% {
              opacity: 0.3;
            }
            100% {
              transform: translate3d(18px, -36px, 0) scale(1.14);
              opacity: 0;
            }
          }

          @keyframes markerBlink {
            0%,
            100% {
              opacity: 0.18;
              transform: scaleY(0.88);
            }
            50% {
              opacity: 0.62;
              transform: scaleY(1.08);
            }
          }

          @keyframes emblemFloat {
            0%,
            100% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(0, -8px, 0);
            }
          }

          @keyframes shutterSpin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes ringEcho {
            0% {
              transform: scale(1);
              opacity: 0.5;
            }
            100% {
              transform: scale(1.18);
              opacity: 0;
            }
          }

          @keyframes titleGlow {
            0%,
            100% {
              text-shadow: 0 24px 60px rgba(0, 0, 0, 0.96), 0 0 18px rgba(255, 255, 255, 0.08);
            }
            50% {
              text-shadow: 0 24px 60px rgba(0, 0, 0, 0.96), 0 0 28px rgba(255, 255, 255, 0.16);
            }
          }

          @keyframes quoteBreath {
            0%,
            100% {
              opacity: 0.74;
              transform: translate3d(0, 0, 0);
            }
            50% {
              opacity: 1;
              transform: translate3d(0, -2px, 0);
            }
          }

          @keyframes progressFill {
            0% {
              opacity: 0.45;
              transform: scaleX(0);
            }
            18% {
              opacity: 1;
            }
            100% {
              opacity: 1;
              transform: scaleX(0.88);
            }
          }

          @keyframes progressHold {
            0% {
              opacity: 0;
              transform: translate3d(0, 0, 0);
            }
            22% {
              opacity: 0.9;
            }
            78% {
              opacity: 0.9;
            }
            100% {
              opacity: 0;
              transform: translate3d(516%, 0, 0);
            }
          }

          @keyframes progressTravel {
            0% {
              transform: translate3d(0, 0, 0);
              opacity: 0;
            }
            14% {
              opacity: 1;
            }
            78% {
              opacity: 0.9;
            }
            100% {
              transform: translate3d(338%, 0, 0);
              opacity: 0;
            }
          }

          .loader-progress-travel {
            animation: progressTravel var(--loader-progress-duration) cubic-bezier(.22, 1, .36, 1) var(--loader-progress-delay) infinite;
          }

          @keyframes statusSwap {
            0% {
              opacity: 0;
              transform: translate3d(0, 6px, 0);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes dotPulse {
            0%,
            100% {
              transform: scale(0.9);
              opacity: 0.42;
            }
            50% {
              transform: scale(1.14);
              opacity: 0.82;
            }
          }

          @keyframes footerBlink {
            0%,
            100% {
              opacity: 0.34;
              transform: translate3d(0, 0, 0);
            }
            50% {
              opacity: 0.78;
              transform: translate3d(0, -1px, 0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [data-loader-root] {
              transition-duration: 0.01ms;
            }

            [data-loader-root] *,
            [data-loader-root] *::before,
            [data-loader-root] *::after {
              animation-duration: 0.01ms !important;
              animation-delay: 0ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default InitialLoader;
