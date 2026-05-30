import React, { useEffect, useMemo, useState } from "react";

const showcaseQuotes = [
  "Written, designed, and directed by Amritanshu Mishra",
  "Crafted in silence by Amritanshu Mishra",
  "A vision in motion by Amritanshu Mishra",
  "From darkness into detail - Amritanshu Mishra",
  "One universe. One signature. Amritanshu Mishra",
  "A digital noir by Amritanshu Mishra",
];

const sessionQuotes = [
  "Calibrating a private entrance before the first frame arrives",
  "The theatre stays dark while your secure session takes its mark",
  "A silent handoff is shaping the opening scene",
];

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
      isTouchViewport: false,
      prefersReducedMotion: false,
      shouldOptimize: false,
    };
  }

  const prefersReducedMotion = queryMatches("(prefers-reduced-motion: reduce)");
  const isCompactViewport = queryMatches("(max-width: 768px), (max-height: 740px)");
  const isCoarsePointer = queryMatches("(hover: none), (pointer: coarse)");
  const isTouchViewport = isCompactViewport && isCoarsePointer;
  const nav = typeof navigator === "undefined" ? {} : navigator;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const deviceMemory = nav.deviceMemory ?? 8;
  const hardwareConcurrency = nav.hardwareConcurrency ?? 8;
  const isLowPowerDevice = deviceMemory <= 4 || hardwareConcurrency <= 4;

  return {
    prefersReducedMotion,
    isTouchViewport,
    shouldOptimize:
      prefersReducedMotion ||
      saveData ||
      isLowPowerDevice ||
      isTouchViewport,
  };
};

const InitialLoader = ({ mode = "showcase" }) => {
  const isSessionMode = mode === "session";
  const quotePool = isSessionMode ? sessionQuotes : showcaseQuotes;
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

  const randomQuote = useMemo(
    () => quotePool[Math.floor(Math.random() * quotePool.length)],
    [quotePool],
  );
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [performanceProfile, setPerformanceProfile] = useState(
    getPerformanceProfile,
  );

  const { prefersReducedMotion, shouldOptimize, isTouchViewport } = performanceProfile;
  const animatedDust = useMemo(() => (shouldOptimize ? [] : floatingDust), [shouldOptimize]);
  const visiblePills = shouldOptimize ? accentPills.slice(0, 2) : accentPills;
  const shouldCycleStatus = !shouldOptimize && !prefersReducedMotion;
  const currentStatus = shouldCycleStatus
    ? statusLines[activeStatusIndex]
    : statusLines[0];
  const showAnimatedStatusDots = !shouldOptimize;
  const badgeClass = shouldOptimize
    ? "max-w-[calc(50vw-1.25rem)] truncate rounded-full border border-white/[0.08] bg-black/[0.82] px-3 py-2 text-[0.44rem] uppercase tracking-[0.22em] text-white/[0.4] shadow-[0_8px_24px_rgba(0,0,0,0.5)] min-[380px]:tracking-[0.3em] sm:max-w-none sm:px-4 sm:text-[0.52rem] sm:tracking-[0.36em]"
    : "max-w-[calc(50vw-1.25rem)] truncate rounded-full border border-white/[0.08] bg-black/[0.7] px-3 py-2 text-[0.44rem] uppercase tracking-[0.22em] text-white/[0.38] shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-md min-[380px]:tracking-[0.3em] sm:max-w-none sm:px-4 sm:text-[0.52rem] sm:tracking-[0.42em]";
  const shellClass = shouldOptimize
    ? "loader-shell relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.55rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(10,10,10,0.9),rgba(0,0,0,0.86)_45%,rgba(4,4,4,0.94)_100%)] px-4 py-7 text-center shadow-[0_24px_90px_rgba(0,0,0,0.82)] animate-[openingReveal_700ms_cubic-bezier(.22,1,.36,1)_forwards] min-[380px]:rounded-[2rem] min-[380px]:px-5 min-[380px]:py-8 sm:px-9 sm:py-11 md:px-12 md:py-14"
    : "loader-shell relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.65rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(10,10,10,0.86),rgba(0,0,0,0.8)_42%,rgba(4,4,4,0.92)_100%)] px-4 py-8 text-center shadow-[0_42px_180px_rgba(0,0,0,0.92)] backdrop-blur-[10px] animate-[openingReveal_1000ms_cubic-bezier(.22,1,.36,1)_forwards] min-[380px]:rounded-[2rem] min-[380px]:px-6 min-[380px]:py-9 sm:rounded-[2.2rem] sm:px-10 sm:py-12 md:px-14 md:py-14";
  const haloClass = shouldOptimize
    ? "absolute left-1/2 top-1/2 h-[84vw] w-[84vw] max-h-[420px] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04] bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_30%,rgba(0,0,0,0)_74%)] opacity-60"
    : "absolute left-1/2 top-[49%] h-[68vh] w-[68vh] max-w-[88vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_24%,rgba(0,0,0,0)_68%)] blur-3xl animate-[haloPulse_7.5s_ease-in-out_infinite]";
  const centerGlowClass = shouldOptimize
    ? "absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(255,255,255,0.04),rgba(0,0,0,0)_24%)] opacity-28"
    : "absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(255,255,255,0.08),rgba(0,0,0,0)_26%)] animate-[centerGlow_5.8s_ease-in-out_infinite]";
  const frameClass = isTouchViewport
    ? "loader-frame relative z-10 flex h-full min-h-0 items-center justify-center px-3 sm:px-8"
    : "loader-frame relative z-10 flex h-full min-h-0 items-center justify-center px-4 sm:px-8";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const queries = [
      getMediaQueryList("(prefers-reduced-motion: reduce)"),
      getMediaQueryList("(max-width: 768px), (max-height: 740px)"),
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
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={isSessionMode ? "Verifying secure access" : "Loading AmiVerse"}
      className="fixed inset-0 z-[9999] overflow-hidden bg-[#010101] text-white antialiased"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.13),rgba(12,12,12,0.91)_31%,rgba(0,0,0,1)_72%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(4,4,4,0.94)_22%,rgba(0,0,0,0.8)_47%,rgba(0,0,0,0.96)_77%,rgba(0,0,0,1)_100%)]" />

      {!shouldOptimize && (
        <>
          <div
            data-loader-animate
            className="absolute inset-x-0 top-0 h-[20vh] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-[letterboxBreath_8s_ease-in-out_infinite]"
          />
          <div
            data-loader-animate
            className="absolute inset-x-0 bottom-0 h-[22vh] bg-black shadow-[0_-20px_60px_rgba(0,0,0,0.9)] animate-[letterboxBreath_8s_ease-in-out_infinite_reverse]"
          />
        </>
      )}

      <div className="absolute inset-y-0 left-0 w-[28vw] min-w-[150px] bg-[linear-gradient(90deg,rgba(0,0,0,1),rgba(4,4,4,0.98)_28%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[28vw] min-w-[150px] bg-[linear-gradient(270deg,rgba(0,0,0,1),rgba(4,4,4,0.98)_28%,rgba(0,0,0,0)_100%)]" />

      {!shouldOptimize && (
        <>
          <div
            data-loader-animate
            className="absolute left-1/2 top-[-14%] h-[82vh] w-[52vw] max-w-[720px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_22%,rgba(255,255,255,0.015)_44%,rgba(255,255,255,0)_82%)] opacity-60 blur-[120px] animate-[projectorBloom_9s_ease-in-out_infinite]"
          />
          <div
            data-loader-animate
            className="absolute left-[-12%] top-[-18%] h-[78vh] w-[40vw] min-w-[220px] rotate-[16deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.14),rgba(255,255,255,0.02),rgba(255,255,255,0))] opacity-35 blur-3xl animate-[beamSweepLeft_9s_ease-in-out_infinite]"
          />
          <div
            data-loader-animate
            className="absolute right-[-12%] top-[-10%] h-[70vh] w-[38vw] min-w-[220px] -rotate-[16deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.1),rgba(255,255,255,0.015),rgba(255,255,255,0))] opacity-30 blur-3xl animate-[beamSweepRight_11s_ease-in-out_infinite]"
          />
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
            data-loader-animate
            className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,0.24)_0.8px,transparent_0.9px)] [background-size:4px_4px] animate-[grainDrift_10s_linear_infinite]"
          />
          <div
            data-loader-animate
            className="absolute inset-0 opacity-[0.34] [background:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.03)_3px,transparent_4px)] animate-[scanlines_9.5s_linear_infinite]"
          />
          <div
            data-loader-animate
            className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.04)_44%,transparent_56%,rgba(255,255,255,0.02)_70%,transparent_100%)] opacity-[0.46] animate-[screenFlicker_6.8s_ease-in-out_infinite]"
          />
        </>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_76%,rgba(0,0,0,0.98)_100%)]" />
      <div className={`absolute inset-0 ${shouldOptimize ? "shadow-[inset_0_0_120px_rgba(0,0,0,0.92)]" : "shadow-[inset_0_0_200px_rgba(0,0,0,0.96)]"}`} />
      <div className="absolute inset-[14px] rounded-[2rem] border border-white/[0.04]" />
      {!shouldOptimize && (
        <div className="absolute inset-[30px] hidden rounded-[1.75rem] border border-white/[0.025] sm:block" />
      )}

      {!shouldOptimize &&
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
          className={`pointer-events-none absolute rounded-full bg-white/40 ${
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
        <div className={badgeClass}>{topLeftLabel}</div>
        <div className={`${badgeClass} text-right`}>{topRightLabel}</div>
      </div>

      <div className={frameClass}>
        <div
          data-loader-animate
          className={shellClass}
        >
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.45] to-transparent sm:inset-x-10 md:inset-x-16" />
          <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.16] to-transparent sm:inset-x-12 md:inset-x-20" />
          <div className="absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/[0.03] sm:rounded-[calc(2.2rem-1px)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.1),rgba(255,255,255,0)_38%)]" />

          {!shouldOptimize && (
            <div className="absolute left-1/2 top-0 h-full w-[40%] max-w-[460px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)_38%,transparent_100%)] opacity-30 blur-[80px]" />
          )}

          <div className="loader-content relative z-10 mx-auto flex max-w-4xl flex-col items-center">
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

            <p className="loader-kicker mt-5 font-cinzel text-[0.56rem] uppercase tracking-[0.38em] text-white/[0.58] min-[380px]:mt-6 min-[380px]:tracking-[0.5em] sm:text-[0.68rem] sm:tracking-[0.64em]">
              {topLeftLabel}
            </p>

            <div className="loader-divider loader-divider-top mt-5 h-px w-32 bg-gradient-to-r from-transparent via-white/[0.75] to-transparent sm:w-40" />

            <div
              {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
              className={`loader-emblem relative mt-8 h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 ${
                shouldOptimize ? "" : "animate-[emblemFloat_5.4s_ease-in-out_infinite]"
              }`}
            >
              <div className="absolute inset-0 rounded-full border border-white/[0.08] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.025)_34%,rgba(0,0,0,0.28)_72%,rgba(0,0,0,0.5)_100%)] shadow-[0_0_55px_rgba(255,255,255,0.06)]" />
              {!shouldOptimize && (
                <div
                  data-loader-animate
                  className="absolute inset-[10px] rounded-full border border-white/[0.08] bg-[conic-gradient(from_0deg,rgba(255,255,255,0.18)_0deg,rgba(255,255,255,0.03)_26deg,rgba(0,0,0,0)_58deg,rgba(255,255,255,0.14)_132deg,rgba(0,0,0,0)_202deg,rgba(255,255,255,0.1)_260deg,rgba(0,0,0,0)_320deg,rgba(255,255,255,0.18)_360deg)] animate-[shutterSpin_18s_linear_infinite]"
                />
              )}
              <div className="absolute inset-[18px] rounded-full border border-white/[0.1] bg-black/90 shadow-[inset_0_0_30px_rgba(255,255,255,0.04)] sm:inset-[20px]" />
              <div className="absolute inset-[28px] flex items-center justify-center rounded-[1rem] border border-white/[0.1] bg-black/90 shadow-[0_16px_36px_rgba(0,0,0,0.62)] sm:inset-[32px] sm:rounded-[1.2rem]">
                <img
                  src="/icons/icon-96x96.png"
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  className="h-9 w-9 rounded-[0.8rem] object-contain opacity-95 sm:h-12 sm:w-12"
                />
              </div>
              {!shouldOptimize && (
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
              )}
            </div>

            <p className="loader-intro mt-7 max-w-full font-cinzel text-[0.58rem] uppercase tracking-[0.22em] text-white/[0.34] min-[380px]:mt-8 min-[380px]:tracking-[0.32em] sm:text-xs sm:tracking-[0.42em]">
              {introLine}
            </p>

            <h1
              {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
              className={`loader-title mt-4 max-w-full font-cinzel text-[2rem] uppercase leading-none tracking-[0.08em] text-white drop-shadow-[0_18px_40px_rgba(0,0,0,0.9)] min-[390px]:text-[2.45rem] min-[390px]:tracking-[0.12em] sm:text-5xl sm:tracking-[0.2em] md:text-6xl md:tracking-[0.24em] lg:text-7xl ${
                shouldOptimize ? "" : "animate-[titleGlow_5s_ease-in-out_infinite]"
              }`}
            >
              AmiVerse
            </h1>

            <div className="loader-divider loader-divider-main mt-6 h-px w-40 max-w-full bg-gradient-to-r from-transparent via-white/[0.7] to-transparent sm:w-56 md:w-72" />

            <p
              {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
              className={`loader-quote mt-6 max-w-2xl font-cinzel text-[0.68rem] italic leading-relaxed tracking-[0.08em] text-zinc-300 min-[380px]:text-[0.72rem] min-[380px]:tracking-[0.12em] sm:text-sm sm:tracking-[0.16em] md:text-base ${
                shouldOptimize ? "" : "animate-[quoteBreath_5.5s_ease-in-out_infinite]"
              }`}
            >
              {randomQuote}
            </p>

            <div className="loader-rail mt-10 w-full max-w-xl sm:mt-11">
              <div className="flex items-center justify-between gap-3 text-[0.48rem] uppercase tracking-[0.18em] text-white/[0.32] min-[380px]:tracking-[0.26em] sm:text-[0.56rem] sm:tracking-[0.34em]">
                <span>{railStart}</span>
                <span>{railEnd}</span>
              </div>
              <div className="relative mt-3 h-[3px] overflow-hidden rounded-full bg-white/[0.1] shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <span className="absolute inset-y-0 left-0 w-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.12),rgba(255,255,255,0.03))]" />
                <span
                  data-loader-animate
                  className={`absolute inset-y-0 left-[-42%] w-[42%] rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-95 ${
                    shouldOptimize
                      ? "animate-[progressTravel_2.45s_linear_infinite]"
                      : "animate-[progressTravel_2.15s_cubic-bezier(.22,1,.36,1)_infinite]"
                  }`}
                />
              </div>
            </div>

            <div className="loader-status mt-7 grid w-full max-w-2xl items-start gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="text-center sm:text-left">
                <p className="text-[0.5rem] uppercase tracking-[0.28em] text-white/[0.28] sm:tracking-[0.42em]">
                  Current cue
                </p>
                <p
                  key={shouldCycleStatus ? currentStatus : "static-status"}
                  className={`mt-2 font-cinzel text-[0.64rem] uppercase tracking-[0.16em] text-white/[0.72] min-[380px]:text-[0.68rem] min-[380px]:tracking-[0.22em] sm:text-[0.74rem] sm:tracking-[0.28em] ${
                    shouldCycleStatus
                      ? "animate-[statusSwap_650ms_cubic-bezier(.22,1,.36,1)_both]"
                      : ""
                  }`}
                >
                  {currentStatus}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 sm:justify-end">
                <span
                  {...(showAnimatedStatusDots ? { "data-loader-animate": true } : {})}
                  className={`h-1.5 w-1.5 rounded-full ${
                    showAnimatedStatusDots
                      ? "bg-white/[0.75] animate-[dotPulse_1.15s_ease-in-out_infinite]"
                      : "bg-white/[0.4]"
                  }`}
                />
                <span
                  {...(showAnimatedStatusDots ? { "data-loader-animate": true } : {})}
                  className={`h-1.5 w-1.5 rounded-full ${
                    showAnimatedStatusDots
                      ? "bg-white/[0.52] animate-[dotPulse_1.15s_ease-in-out_180ms_infinite]"
                      : "bg-white/[0.28]"
                  }`}
                />
                <span
                  {...(showAnimatedStatusDots ? { "data-loader-animate": true } : {})}
                  className={`h-1.5 w-1.5 rounded-full ${
                    showAnimatedStatusDots
                      ? "bg-white/[0.34] animate-[dotPulse_1.15s_ease-in-out_360ms_infinite]"
                      : "bg-white/[0.18]"
                  }`}
                />
              </div>
            </div>

            <p
              {...(!shouldOptimize ? { "data-loader-animate": true } : {})}
              className={`loader-footer mt-7 max-w-full text-[0.54rem] uppercase tracking-[0.28em] text-white/[0.34] min-[380px]:tracking-[0.38em] sm:text-[0.62rem] sm:tracking-[0.48em] ${
                shouldOptimize ? "" : "animate-[footerBlink_2.4s_ease-in-out_infinite]"
              }`}
            >
              {footerLabel}
            </p>
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
            --loader-frame-top: max(clamp(2.7rem, 7.5vh, 5.75rem), env(safe-area-inset-top));
            --loader-frame-bottom: max(clamp(0.7rem, 2.4vh, 2rem), env(safe-area-inset-bottom));
            --loader-shell-x: clamp(1rem, 4vw, 3.5rem);
            --loader-shell-y: clamp(1rem, 4vh, 3.5rem);
            --loader-stack-gap: clamp(0.5rem, 1.9vh, 1.5rem);
            --loader-stack-gap-lg: clamp(0.7rem, 2.7vh, 2.75rem);
            transform: translateZ(0);
            backface-visibility: hidden;
            overscroll-behavior: none;
          }

          .loader-frame {
            height: 100%;
            min-height: 0;
            box-sizing: border-box;
            padding-top: var(--loader-frame-top);
            padding-bottom: var(--loader-frame-bottom);
          }

          @supports (height: 100dvh) {
            [data-loader-root] {
              height: 100dvh;
            }
          }

          .loader-shell {
            display: flex;
            max-height: 100%;
            min-height: 0;
            padding: var(--loader-shell-y) var(--loader-shell-x) !important;
            transform-origin: center;
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
          }

          .loader-emblem {
            width: clamp(4.35rem, min(17vh, 24vw), 9rem) !important;
            height: clamp(4.35rem, min(17vh, 24vw), 9rem) !important;
            flex: 0 0 auto;
          }

          .loader-title {
            font-size: clamp(1.8rem, min(7.5vw, 7.6vh), 4.5rem) !important;
            line-height: 0.9 !important;
          }

          .loader-quote {
            display: -webkit-box;
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }

          .loader-rail {
            margin-top: var(--loader-stack-gap-lg) !important;
          }

          .loader-status,
          .loader-footer {
            margin-top: var(--loader-stack-gap) !important;
          }

          @media (min-width: 768px) and (min-height: 760px) {
            [data-loader-root] {
              --loader-frame-top: max(clamp(1.5rem, 3.2vh, 2rem), env(safe-area-inset-top));
              --loader-frame-bottom: max(clamp(1.5rem, 3.2vh, 2rem), env(safe-area-inset-bottom));
            }
          }

          @media (max-height: 720px) {
            [data-loader-root] {
              --loader-frame-top: max(clamp(2.35rem, 6vh, 4rem), env(safe-area-inset-top));
              --loader-frame-bottom: max(0.45rem, env(safe-area-inset-bottom));
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
            .loader-shell {
              box-shadow: 0 22px 70px rgba(0, 0, 0, 0.86);
            }
          }

          @media (max-height: 600px) {
            [data-loader-root] {
              --loader-frame-top: max(2.75rem, env(safe-area-inset-top));
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

            .loader-title {
              font-size: clamp(1.65rem, min(7vw, 8vh), 3rem) !important;
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
              --loader-frame-top: max(0.55rem, env(safe-area-inset-top));
              --loader-frame-bottom: max(0.45rem, env(safe-area-inset-bottom));
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

          [data-loader-animate] {
            will-change: transform, opacity;
            transform: translateZ(0);
            backface-visibility: hidden;
          }

          @keyframes openingReveal {
            0% {
              opacity: 0;
              transform: translate3d(0, 14px, 0) scale(0.985);
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
              transform: translate3d(-50%, 0, 0) scaleY(0.96);
              opacity: 0.42;
            }
            50% {
              transform: translate3d(-50%, 0, 0) scaleY(1.04);
              opacity: 0.72;
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
              opacity: 0.22;
            }
            50% {
              transform: rotate(13deg) translate3d(4%, 2%, 0);
              opacity: 0.42;
            }
          }

          @keyframes beamSweepRight {
            0%,
            100% {
              transform: rotate(-16deg) translate3d(0, 0, 0);
              opacity: 0.16;
            }
            50% {
              transform: rotate(-12deg) translate3d(-5%, 2%, 0);
              opacity: 0.34;
            }
          }

          @keyframes centerGlow {
            0%,
            100% {
              opacity: 0.3;
              transform: scale(0.98);
            }
            50% {
              opacity: 0.62;
              transform: scale(1.06);
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

          @keyframes screenFlicker {
            0%,
            100% {
              opacity: 0.38;
            }
            18% {
              opacity: 0.34;
            }
            32% {
              opacity: 0.47;
            }
            48% {
              opacity: 0.37;
            }
            68% {
              opacity: 0.5;
            }
            82% {
              opacity: 0.35;
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
              opacity: 0.38;
            }
            50% {
              transform: scale(1.24);
              opacity: 1;
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
