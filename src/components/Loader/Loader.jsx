const Loader = ({
  size = "default",
  label = "Loading AmiVerse",
  fullscreen,
  isExiting = false,
  className = "",
}) => {
  const isSmall = size === "small";
  const isFullscreen = fullscreen ?? !isSmall;

  if (!isFullscreen) {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        className={`relative inline-flex h-5 w-5 shrink-0 items-center justify-center align-middle text-current motion-reduce:transition-none ${className}`}
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
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      aria-label={label}
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/[0.65] px-4 py-6 text-white backdrop-blur-md transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
        isExiting
          ? "pointer-events-none scale-[0.98] opacity-0"
          : "scale-100 opacity-100 motion-safe:animate-fade-in"
      } ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),transparent_34%,rgba(244,114,182,0.12)_68%,transparent)] motion-reduce:hidden"
      />

      <div className="relative flex w-full max-w-[18rem] flex-col items-center rounded-xl border border-white/10 bg-black/[0.78] px-6 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] ring-1 ring-cyan-200/10 backdrop-blur-xl sm:max-w-xs sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-pink-200/30 to-transparent" />

        <div
          aria-hidden="true"
          className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20"
        >
          <span className="absolute -inset-3 rounded-full bg-cyan-300/[0.12] blur-xl motion-safe:animate-pulse motion-reduce:hidden" />
          <span className="absolute inset-0 rounded-full border-[3px] border-cyan-200/[0.15] border-r-pink-300/90 border-t-cyan-300 shadow-[0_0_32px_rgba(34,211,238,0.24)] motion-safe:animate-[spin_1.05s_linear_infinite]" />
          <span className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-sky-200/90 border-l-pink-300/90 motion-safe:animate-[spin_1.7s_linear_infinite_reverse]" />
          <span className="absolute inset-[1.35rem] flex items-center justify-center rounded-full border border-white/[0.15] bg-black/[0.85] shadow-[inset_0_0_18px_rgba(255,255,255,0.08)] sm:inset-[1.65rem]">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(165,243,252,0.8)] motion-safe:animate-pulse" />
          </span>
        </div>

        <p
          aria-hidden="true"
          className="mt-5 text-center text-sm font-semibold text-cyan-50 sm:text-base"
        >
          {label}
        </p>

        <div
          aria-hidden="true"
          className="mt-4 flex h-2 items-center justify-center gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/95 motion-safe:animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-sky-200/80 motion-safe:animate-pulse [animation-delay:180ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-pink-200/80 motion-safe:animate-pulse [animation-delay:360ms]" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
