import React, { memo, useEffect, useState } from "react";
import "./InitialLoader.css";

export const INITIAL_LOADER_CREDIT =
  "Written & Directed by Amritanshu Mishra";

export const INITIAL_LOADER_MIN_DURATION_MS = 1200;
export const INITIAL_LOADER_EXIT_DURATION_MS = 220;

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

const startupSessionQuoteIndex = Math.floor(
  Math.random() * sessionQuotes.length,
);

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
  const isCompactViewport = queryMatches(
    "(max-width: 1024px), (max-height: 740px)",
  );
  const isTouchViewport = queryMatches("(hover: none), (pointer: coarse)");
  const nav = typeof navigator === "undefined" ? {} : navigator;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;
  const deviceMemory = nav.deviceMemory ?? 8;
  const hardwareConcurrency = nav.hardwareConcurrency ?? 8;

  return {
    isCompactViewport,
    isTouchViewport,
    prefersReducedMotion,
    shouldOptimize:
      prefersReducedMotion ||
      Boolean(connection?.saveData) ||
      deviceMemory <= 4 ||
      hardwareConcurrency <= 4,
  };
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

const InitialLoader = ({ mode = "showcase", durationMs, phase = "visible" }) => {
  const isSessionMode = mode === "session";
  const isTimedShowcase =
    !isSessionMode && Number.isFinite(durationMs) && durationMs > 0;
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [performanceProfile, setPerformanceProfile] = useState(
    getPerformanceProfile,
  );
  const [initialProgressElapsedMs] = useState(() =>
    isTimedShowcase ? getInitialLoaderElapsedMs() : 0,
  );

  const {
    isCompactViewport,
    isTouchViewport,
    prefersReducedMotion,
    shouldOptimize,
  } = performanceProfile;
  const statusLines = isSessionMode ? sessionStatusLines : showcaseStatusLines;
  const shouldCycleStatus =
    !isTimedShowcase &&
    !shouldOptimize &&
    !isCompactViewport &&
    !isTouchViewport &&
    !prefersReducedMotion;
  const progressDurationMs = isTimedShowcase
    ? Math.max(durationMs, INITIAL_LOADER_MIN_DURATION_MS)
    : 1080;

  useEffect(() => {
    // The homepage loader is intentionally short-lived. Its initial media
    // snapshot is enough and avoids subscribing during the busiest startup
    // window. Longer session loaders keep adapting to viewport changes.
    if (isTimedShowcase || typeof window === "undefined") return undefined;

    const queries = [
      getMediaQueryList("(prefers-reduced-motion: reduce)"),
      getMediaQueryList("(max-width: 1024px), (max-height: 740px)"),
      getMediaQueryList("(hover: none), (pointer: coarse)"),
    ].filter(Boolean);
    const updateProfile = () => setPerformanceProfile(getPerformanceProfile());

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
  }, [isTimedShowcase]);

  useEffect(() => {
    if (!shouldCycleStatus) {
      setActiveStatusIndex(0);
      return undefined;
    }

    const statusInterval = window.setInterval(() => {
      setActiveStatusIndex(
        (currentIndex) => (currentIndex + 1) % statusLines.length,
      );
    }, 2100);

    return () => window.clearInterval(statusInterval);
  }, [shouldCycleStatus, statusLines.length]);

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
  const quote = isSessionMode
    ? sessionQuotes[startupSessionQuoteIndex % sessionQuotes.length]
    : INITIAL_LOADER_CREDIT;
  const currentStatus = shouldCycleStatus
    ? statusLines[activeStatusIndex]
    : statusLines[0];

  return (
    <div
      data-loader-root
      data-loader-mode={shouldOptimize ? "optimized" : "cinematic"}
      data-loader-compact={isCompactViewport ? "true" : undefined}
      data-loader-timed={isTimedShowcase ? "true" : undefined}
      data-loader-profile={isTimedShowcase ? "lightweight" : undefined}
      data-loader-state={phase}
      style={{
        "--loader-progress-delay": `-${initialProgressElapsedMs}ms`,
        "--loader-progress-duration": `${progressDurationMs}ms`,
        "--loader-exit-duration": `${INITIAL_LOADER_EXIT_DURATION_MS}ms`,
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

      <div className="loader-backdrop" aria-hidden="true" />

      <div className="loader-badges" aria-hidden="true">
        <div className="loader-badge">
          <span className="loader-badge-signal" />
          <span>{topLeftLabel}</span>
        </div>
        <div className="loader-badge loader-badge-right">
          <span>{topRightLabel}</span>
          <span className="loader-badge-index">01</span>
        </div>
      </div>

      <div className="loader-frame" aria-hidden="true">
        <div className="loader-shell">
          <div className="loader-content">
            {!isTimedShowcase && (
              <div className="loader-pills">
                <span>{isSessionMode ? "Encrypted handoff" : "Cinema grade"}</span>
                <span>{isSessionMode ? "Private route" : "Studio hush"}</span>
              </div>
            )}

            <div className="loader-kicker">
              <span className="loader-kicker-index">01</span>
              <span className="loader-kicker-line" />
              <span>{isSessionMode ? "Access protocol" : "AmiVerse original"}</span>
            </div>

            <div className="loader-emblem">
              <div className="loader-emblem-plate" />
              {!shouldOptimize && <div className="loader-emblem-shutter" />}
              <span className="loader-orbit-node" />
              <div className="loader-emblem-core" />
              <div className="loader-emblem-icon">
                <img
                  src="/icons/icon-96x96.png"
                  alt=""
                  width="48"
                  height="48"
                  aria-hidden="true"
                  loading="eager"
                />
              </div>
            </div>

            <p className="loader-intro">{introLine}</p>

            <p className="loader-title">
              <span>Ami</span>
              <span className="loader-title-accent">Verse</span>
            </p>

            <div className="loader-divider" />

            <p className="loader-quote">{quote}</p>

            <div className="loader-rail">
              <div className="loader-rail-labels">
                <span>{railStart}</span>
                <span>{railEnd}</span>
              </div>
              <div className="loader-progress-track">
                <span className="loader-progress-bed" />
                <span
                  className={
                    isTimedShowcase
                      ? prefersReducedMotion
                        ? "loader-progress-complete"
                        : "loader-progress-fill"
                      : "loader-progress-travel"
                  }
                />
              </div>
            </div>

            {!isTimedShowcase && (
              <div className="loader-status">
                <div>
                  <p className="loader-status-label">Current cue</p>
                  <p className="loader-status-value">{currentStatus}</p>
                </div>
                <div className="loader-status-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <p className="loader-footer">
              <span className="loader-footer-pulse" />
              <span>{footerLabel}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MemoizedInitialLoader = memo(InitialLoader);
MemoizedInitialLoader.displayName = "InitialLoader";

export default MemoizedInitialLoader;
