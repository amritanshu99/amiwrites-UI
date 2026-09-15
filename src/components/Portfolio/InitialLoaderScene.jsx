import React from "react";

export const INITIAL_LOADER_CREDIT = "Written & Directed by Amritanshu Mishra";

// Kept pure so the first HTML paint can be generated from this exact scene.
export default function InitialLoaderScene({
  id,
  mode = "showcase",
  phase = "visible",
  isTimedShowcase = true,
  shouldOptimize = false,
  isCompactViewport = false,
  prefersReducedMotion = false,
  progressDurationMs = 600,
  initialProgressElapsedMs = 0,
  waitingLine = "Good things take time. Apparently, so does this.",
}) {
  const isSessionMode = mode === "session";
  const status = isSessionMode ? "Verifying secure access" : "Loading AmiVerse";

  return (
    <div
      id={id}
      data-loader-root
      data-loader-design="galaxy"
      data-loader-mode={shouldOptimize ? "optimized" : "cinematic"}
      data-loader-compact={isCompactViewport ? "true" : undefined}
      data-loader-timed={isTimedShowcase ? "true" : undefined}
      data-loader-profile={isTimedShowcase ? "lightweight" : undefined}
      data-loader-state={phase}
      style={{
        "--loader-scene-delay": `-${initialProgressElapsedMs}ms`,
        "--loader-progress-delay": `-${initialProgressElapsedMs}ms`,
        "--loader-progress-duration": `${progressDurationMs}ms`,
        "--loader-exit-duration": "220ms",
      }}
    >
      <span role="status" aria-live="polite" aria-atomic="true" aria-label={status} className="galaxy-sr-only">
        {status}
      </span>

      <div className="galaxy-scenery" aria-hidden="true">
        <div className="galaxy-stars galaxy-stars-distant" />
        <div className="galaxy-nebula" style={{ backgroundImage: 'url("/images/initial-loader-galaxy.svg")' }} />
        <div className="galaxy-orbit-plane">
          <div className="galaxy-orbit-path" />
          <div className="galaxy-orbit-runner"><span /></div>
        </div>
        <div className="galaxy-stars galaxy-stars-near" />
        <div className="galaxy-shooting-star" />
        <i className="galaxy-spark galaxy-spark-one" />
        <i className="galaxy-spark galaxy-spark-two" />
        <i className="galaxy-spark galaxy-spark-three" />
        <div className="galaxy-vignette" />
      </div>

      <div className="galaxy-masthead" aria-hidden="true">
        <div className="galaxy-brand-signature">
          <img src="/icons/icon-96x96.png" alt="" width="32" height="32" />
          <span>A personal universe</span>
        </div>
        <span className="galaxy-edition">{isSessionMode ? "Private Session" : "Beyond the ordinary"}</span>
      </div>

      <div className="galaxy-identity" aria-hidden="true">
        <p className="galaxy-eyebrow">{isSessionMode ? "Secure Access" : "Welcome to my orbit"}</p>
        <p className="galaxy-wordmark">AmiVerse<i className="galaxy-brand-star" /></p>
        <p className="galaxy-tagline">Ideas. Code. A little cosmic chaos.</p>
      </div>

      <div className="galaxy-loading-dock" aria-hidden="true">
        <p className="galaxy-loading-label"><span className="galaxy-status-light" />{status}</p>
        <div className="galaxy-progress-track">
          <span className={isTimedShowcase
            ? prefersReducedMotion ? "galaxy-progress-complete" : "galaxy-progress-fill"
            : "galaxy-progress-travel"} />
        </div>
        <p className="galaxy-waiting-line" data-bootstrap-quip>{waitingLine}</p>
      </div>

      <div className="galaxy-footer" aria-hidden="true">
        <span>{isSessionMode ? "Your private entrance is being prepared" : INITIAL_LOADER_CREDIT}</span>
        <span className="galaxy-footer-note">Made on Earth <span>&#10022;</span></span>
      </div>
    </div>
  );
}
