import { useState } from "react";
import LoadingBackdrop from "./LoadingBackdrop";
import { getWaitingLine } from "./waitingLines";

const Loader = ({
  size = "default",
  label = "Loading AmiVerse",
  fullscreen,
  opaque = false,
  isExiting = false,
  className = "",
}) => {
  const isSmall = size === "small";
  const isFullscreen = fullscreen ?? !isSmall;
  const inlineSizeClass = isSmall ? "h-4 w-4" : "h-5 w-5";

  if (!isFullscreen) {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        className={`relative inline-flex ${inlineSizeClass} shrink-0 items-center justify-center align-middle text-current motion-reduce:transition-none ${className}`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-current opacity-25"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-current motion-safe:animate-[spin_0.8s_linear_infinite]"
        />
      </span>
    );
  }

  return (
    <FullscreenLoader
      label={label}
      opaque={opaque}
      isExiting={isExiting}
      className={className}
    />
  );
};

const FullscreenLoader = ({ label, opaque, isExiting, className }) => {
  const [waitingLine] = useState(getWaitingLine);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      aria-label={label}
      data-app-loader="fullscreen"
      data-opaque={opaque ? "true" : undefined}
      data-state={isExiting ? "exiting" : "visible"}
      className={`amiverse-loading-overlay ${className}`}
    >
      <LoadingBackdrop />
      <div className="amiverse-loading-card" aria-hidden="true">
        <div className="amiverse-loading-masthead">
          <span>AmiVerse</span>
          <span className="amiverse-loading-tag">Please stand by</span>
        </div>
        <div className="amiverse-loading-orbit">
          <span className="amiverse-loading-orbit-ring" />
          <span className="amiverse-loading-orbit-core">
            <img src="/icons/icon-96x96.png" width="48" height="48" alt="" decoding="async" />
          </span>
        </div>
        <p className="amiverse-loading-label">{label}</p>
        <p className="amiverse-loading-quip">{waitingLine}</p>
        <div className="amiverse-loading-progress"><span /></div>
        <p className="amiverse-loading-caption">A tiny pause. A whole universe.</p>
      </div>
    </div>
  );
};

export default Loader;
