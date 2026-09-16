import React, { memo, useEffect, useState } from "react";
import InitialLoaderScene, { INITIAL_LOADER_MIN_DURATION_MS } from "./InitialLoaderScene";
import "./InitialLoader.css";

export { INITIAL_LOADER_CREDIT, INITIAL_LOADER_MIN_DURATION_MS } from "./InitialLoaderScene";

export const INITIAL_LOADER_EXIT_DURATION_MS = 220;

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

let initialLoaderStartedAtMs = null;

export const beginInitialLoaderCycle = () => {
  const now = getPerformanceNow();

  if (initialLoaderStartedAtMs === null) {
    const bootstrapStartedAt = typeof window !== "undefined" &&
      window.location?.pathname === "/"
      ? window.__amiverseInitialLoaderStartedAt
      : undefined;
    initialLoaderStartedAtMs = Number.isFinite(bootstrapStartedAt)
      ? Math.min(now, Math.max(0, bootstrapStartedAt))
      : now;
  }

  return Math.max(0, now - initialLoaderStartedAtMs);
};

export const getInitialLoaderElapsedMs = () => beginInitialLoaderCycle();

export const completeInitialLoaderCycle = () => {
  initialLoaderStartedAtMs = null;
  if (typeof window !== "undefined") {
    delete window.__amiverseInitialLoaderStartedAt;
  }
};

const InitialLoader = ({ mode = "showcase", durationMs, phase = "visible" }) => {
  const isTimedShowcase = mode !== "session" && Number.isFinite(durationMs) && durationMs > 0;
  const [performanceProfile, setPerformanceProfile] = useState(getPerformanceProfile);
  const [initialProgressElapsedMs] = useState(() => isTimedShowcase ? getInitialLoaderElapsedMs() : 0);

  useEffect(() => {
    // Startup only needs a capability snapshot. CSS handles responsive layout.
    if (isTimedShowcase || typeof window === "undefined") return undefined;
    const queries = [
      getMediaQueryList("(prefers-reduced-motion: reduce)"),
      getMediaQueryList("(max-width: 1024px), (max-height: 740px)"),
      getMediaQueryList("(hover: none), (pointer: coarse)"),
    ].filter(Boolean);
    const updateProfile = () => setPerformanceProfile(getPerformanceProfile());
    queries.forEach((query) => {
      if (query.addEventListener) query.addEventListener("change", updateProfile);
      else query.addListener(updateProfile);
    });
    return () => queries.forEach((query) => {
      if (query.removeEventListener) query.removeEventListener("change", updateProfile);
      else query.removeListener(updateProfile);
    });
  }, [isTimedShowcase]);

  return (
    <InitialLoaderScene
      mode={mode}
      phase={phase}
      isTimedShowcase={isTimedShowcase}
      shouldOptimize={performanceProfile.shouldOptimize}
      isCompactViewport={performanceProfile.isCompactViewport}
      prefersReducedMotion={performanceProfile.prefersReducedMotion}
      progressDurationMs={isTimedShowcase ? Math.max(durationMs, INITIAL_LOADER_MIN_DURATION_MS) : 1800}
      initialProgressElapsedMs={initialProgressElapsedMs}
    />
  );
};

const MemoizedInitialLoader = memo(InitialLoader);
MemoizedInitialLoader.displayName = "InitialLoader";
export default MemoizedInitialLoader;
