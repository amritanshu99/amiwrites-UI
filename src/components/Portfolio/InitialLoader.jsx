import React, { useEffect, useState } from "react";

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

  const [randomQuote] = useState(
    () => quotePool[Math.floor(Math.random() * quotePool.length)],
  );
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);

  useEffect(() => {
    const statusInterval = window.setInterval(() => {
      setActiveStatusIndex((currentIndex) => (currentIndex + 1) % statusLines.length);
    }, 1600);

    return () => window.clearInterval(statusInterval);
  }, [statusLines.length]);

  return (
    <div
      data-loader-root
      className="fixed inset-0 z-[9999] overflow-hidden bg-[#010101] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(255,255,255,0.12),rgba(12,12,12,0.92)_30%,rgba(0,0,0,1)_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(4,4,4,0.94)_22%,rgba(0,0,0,0.78)_46%,rgba(0,0,0,0.96)_76%,rgba(0,0,0,1)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-[20vh] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-[letterboxBreath_8s_ease-in-out_infinite]" />
      <div className="absolute inset-x-0 bottom-0 h-[22vh] bg-black shadow-[0_-20px_60px_rgba(0,0,0,0.9)] animate-[letterboxBreath_8s_ease-in-out_infinite_reverse]" />
      <div className="absolute inset-y-0 left-0 w-[28vw] min-w-[150px] bg-[linear-gradient(90deg,rgba(0,0,0,1),rgba(4,4,4,0.98)_28%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[28vw] min-w-[150px] bg-[linear-gradient(270deg,rgba(0,0,0,1),rgba(4,4,4,0.98)_28%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute left-1/2 top-[-14%] h-[82vh] w-[52vw] max-w-[720px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_22%,rgba(255,255,255,0.015)_44%,rgba(255,255,255,0)_82%)] opacity-60 blur-[120px] animate-[projectorBloom_9s_ease-in-out_infinite]" />
      <div className="absolute left-1/2 top-[49%] h-[70vh] w-[70vh] max-w-[88vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05] bg-[radial-gradient(circle,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.03)_24%,rgba(0,0,0,0)_68%)] blur-3xl animate-[haloPulse_7.5s_ease-in-out_infinite]" />
      <div className="absolute left-[-12%] top-[-18%] h-[78vh] w-[40vw] min-w-[220px] rotate-[16deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.14),rgba(255,255,255,0.02),rgba(255,255,255,0))] opacity-35 blur-3xl animate-[beamSweepLeft_9s_ease-in-out_infinite]" />
      <div className="absolute right-[-12%] top-[-10%] h-[70vh] w-[38vw] min-w-[220px] -rotate-[16deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.1),rgba(255,255,255,0.015),rgba(255,255,255,0))] opacity-30 blur-3xl animate-[beamSweepRight_11s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(255,255,255,0.08),rgba(0,0,0,0)_26%)] animate-[centerGlow_5.8s_ease-in-out_infinite]" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.28)_0.8px,transparent_0.9px)] [background-size:4px_4px] animate-[grainDrift_7s_steps(18)_infinite]" />
      <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.03)_3px,transparent_4px)] animate-[scanlines_8s_linear_infinite]" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.04)_44%,transparent_56%,rgba(255,255,255,0.02)_70%,transparent_100%)] opacity-55 animate-[screenFlicker_4.4s_steps(10)_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_76%,rgba(0,0,0,0.98)_100%)]" />
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.96)]" />
      <div className="absolute inset-[14px] rounded-[2rem] border border-white/[0.04]" />
      <div className="absolute inset-[30px] rounded-[1.75rem] border border-white/[0.025] hidden sm:block" />

      {sideMarkerOffsets.map((offset, index) => (
        <React.Fragment key={offset}>
          <span
            className="absolute left-5 hidden h-10 w-[2px] rounded-full bg-white/[0.06] md:block animate-[markerBlink_4.2s_ease-in-out_infinite]"
            style={{ top: offset, animationDelay: `${index * 220}ms` }}
          />
          <span
            className="absolute right-5 hidden h-10 w-[2px] rounded-full bg-white/[0.06] md:block animate-[markerBlink_4.2s_ease-in-out_infinite]"
            style={{ top: offset, animationDelay: `${index * 220 + 160}ms` }}
          />
        </React.Fragment>
      ))}

      {floatingDust.map((dust, index) => (
        <span
          key={`${dust.left}-${dust.top}-${index}`}
          className="pointer-events-none absolute rounded-full bg-white/40 blur-[1px]"
          style={{
            left: dust.left,
            top: dust.top,
            width: `${dust.size}px`,
            height: `${dust.size}px`,
            animation: `dustFloat ${dust.duration} ease-in-out ${dust.delay} infinite`,
          }}
        />
      ))}

      <div className="absolute left-4 top-4 z-10 rounded-full border border-white/[0.08] bg-black/70 px-4 py-2 text-[0.48rem] uppercase tracking-[0.42em] text-white/38 shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-md sm:left-7 sm:top-6 sm:text-[0.52rem]">
        {topLeftLabel}
      </div>
      <div className="absolute right-4 top-4 z-10 rounded-full border border-white/[0.08] bg-black/70 px-4 py-2 text-[0.48rem] uppercase tracking-[0.42em] text-white/38 shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-md sm:right-7 sm:top-6 sm:text-[0.52rem]">
        {topRightLabel}
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2.2rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(10,10,10,0.86),rgba(0,0,0,0.8)_42%,rgba(4,4,4,0.92)_100%)] px-6 py-10 text-center shadow-[0_42px_180px_rgba(0,0,0,0.92)] backdrop-blur-[10px] animate-[openingReveal_1000ms_cubic-bezier(.22,1,.36,1)_forwards] sm:px-10 sm:py-12 md:px-14 md:py-14">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent sm:inset-x-10 md:inset-x-16" />
          <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent sm:inset-x-12 md:inset-x-20" />
          <div className="absolute inset-[1px] rounded-[calc(2.2rem-1px)] border border-white/[0.03]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.1),rgba(255,255,255,0)_38%)]" />
          <div className="absolute left-1/2 top-0 h-full w-[40%] max-w-[460px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)_38%,transparent_100%)] opacity-30 blur-[80px]" />

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
              {accentPills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[0.46rem] uppercase tracking-[0.42em] text-white/30 sm:px-4 sm:text-[0.5rem]"
                >
                  {pill}
                </span>
              ))}
            </div>

            <p className="mt-6 font-cinzel text-[0.58rem] uppercase tracking-[0.72em] text-white/58 sm:text-[0.68rem]">
              {topLeftLabel}
            </p>

            <div className="mt-5 h-px w-32 bg-gradient-to-r from-transparent via-white/75 to-transparent sm:w-40" />

            <div className="relative mt-8 h-28 w-28 animate-[emblemFloat_5.4s_ease-in-out_infinite] sm:h-32 sm:w-32 md:h-36 md:w-36">
              <div className="absolute inset-0 rounded-full border border-white/[0.08] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.025)_34%,rgba(0,0,0,0.28)_72%,rgba(0,0,0,0.5)_100%)] shadow-[0_0_75px_rgba(255,255,255,0.08)]" />
              <div className="absolute inset-[10px] rounded-full border border-white/[0.08] bg-[conic-gradient(from_0deg,rgba(255,255,255,0.18)_0deg,rgba(255,255,255,0.03)_26deg,rgba(0,0,0,0)_58deg,rgba(255,255,255,0.14)_132deg,rgba(0,0,0,0)_202deg,rgba(255,255,255,0.1)_260deg,rgba(0,0,0,0)_320deg,rgba(255,255,255,0.18)_360deg)] animate-[shutterSpin_18s_linear_infinite]" />
              <div className="absolute inset-[20px] rounded-full border border-white/[0.1] bg-black/90 shadow-[inset_0_0_36px_rgba(255,255,255,0.05)]" />
              <div className="absolute inset-[32px] flex items-center justify-center rounded-[1.2rem] border border-white/[0.1] bg-black/90 shadow-[0_18px_40px_rgba(0,0,0,0.65)] backdrop-blur-md sm:rounded-[1.35rem]">
                <img
                  src="/favicon.ico"
                  alt="AmiVerse Logo"
                  loading="eager"
                  className="h-10 w-10 rounded-[0.95rem] object-contain opacity-95 sm:h-12 sm:w-12"
                />
              </div>
              <span className="absolute inset-[-10px] rounded-full border border-white/[0.06] animate-[ringEcho_3.6s_ease-out_infinite]" />
              <span className="absolute inset-[-20px] rounded-full border border-white/[0.04] animate-[ringEcho_3.6s_ease-out_1.1s_infinite]" />
            </div>

            <p className="mt-8 font-cinzel text-[0.64rem] uppercase tracking-[0.5em] text-white/34 sm:text-xs">
              {introLine}
            </p>

            <h1 className="mt-4 font-cinzel text-[2.9rem] uppercase tracking-[0.16em] text-white drop-shadow-[0_24px_60px_rgba(0,0,0,0.96)] sm:text-5xl sm:tracking-[0.22em] md:text-6xl md:tracking-[0.26em] lg:text-7xl animate-[titleGlow_5s_ease-in-out_infinite]">
              AmiVerse
            </h1>

            <div className="mt-6 h-px w-44 bg-gradient-to-r from-transparent via-white/70 to-transparent sm:w-56 md:w-72" />

            <p className="mt-6 max-w-2xl font-cinzel text-[0.74rem] italic leading-relaxed tracking-[0.18em] text-zinc-300 sm:text-sm md:text-base animate-[quoteBreath_5.5s_ease-in-out_infinite]">
              {randomQuote}
            </p>

            <div className="mt-10 w-full max-w-xl sm:mt-11">
              <div className="flex items-center justify-between text-[0.5rem] uppercase tracking-[0.45em] text-white/32 sm:text-[0.56rem]">
                <span>{railStart}</span>
                <span>{railEnd}</span>
              </div>
              <div className="relative mt-3 h-[3px] overflow-hidden rounded-full bg-white/10 shadow-[0_0_28px_rgba(255,255,255,0.05)]">
                <span className="absolute inset-y-0 left-0 w-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.12),rgba(255,255,255,0.03))]" />
                <span className="absolute inset-y-0 left-[-42%] w-[42%] rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-95 animate-[progressTravel_1.9s_ease-in-out_infinite]" />
              </div>
            </div>

            <div className="mt-7 grid w-full max-w-2xl items-start gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="text-center sm:text-left">
                <p className="text-[0.5rem] uppercase tracking-[0.5em] text-white/28">
                  Current cue
                </p>
                <p
                  key={statusLines[activeStatusIndex]}
                  className="mt-2 font-cinzel text-[0.68rem] uppercase tracking-[0.34em] text-white/72 sm:text-[0.74rem] animate-[statusSwap_650ms_cubic-bezier(.22,1,.36,1)_both]"
                >
                  {statusLines[activeStatusIndex]}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 sm:justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-white/75 animate-[dotPulse_1.15s_ease-in-out_infinite]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/52 animate-[dotPulse_1.15s_ease-in-out_180ms_infinite]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/34 animate-[dotPulse_1.15s_ease-in-out_360ms_infinite]" />
              </div>
            </div>

            <p className="mt-7 text-[0.56rem] uppercase tracking-[0.62em] text-white/34 sm:text-[0.62rem] animate-[footerBlink_2.4s_ease-in-out_infinite]">
              {footerLabel}
            </p>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes openingReveal {
            0% {
              opacity: 0;
              transform: translateY(28px) scale(0.985);
              filter: blur(12px);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
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
              transform: translateX(-50%) scaleY(0.96);
              opacity: 0.42;
            }
            50% {
              transform: translateX(-50%) scaleY(1.04);
              opacity: 0.72;
            }
          }

          @keyframes haloPulse {
            0%,
            100% {
              transform: translate(-50%, -50%) scale(0.93);
              opacity: 0.68;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.05);
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
              transform: translateY(0);
            }
            100% {
              transform: translateY(18px);
            }
          }

          @keyframes screenFlicker {
            0%,
            100% {
              opacity: 0.44;
            }
            18% {
              opacity: 0.36;
            }
            32% {
              opacity: 0.52;
            }
            48% {
              opacity: 0.41;
            }
            68% {
              opacity: 0.56;
            }
            82% {
              opacity: 0.38;
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
              transform: translateY(0);
            }
            50% {
              transform: translateY(-8px);
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
              text-shadow: 0 24px 60px rgba(0, 0, 0, 0.96), 0 0 18px rgba(255, 255, 255, 0.1);
            }
            50% {
              text-shadow: 0 24px 60px rgba(0, 0, 0, 0.96), 0 0 34px rgba(255, 255, 255, 0.22);
            }
          }

          @keyframes quoteBreath {
            0%,
            100% {
              opacity: 0.74;
              transform: translateY(0);
            }
            50% {
              opacity: 1;
              transform: translateY(-2px);
            }
          }

          @keyframes progressTravel {
            0% {
              transform: translateX(0);
              opacity: 0;
            }
            16% {
              opacity: 1;
            }
            100% {
              transform: translateX(340%);
              opacity: 0;
            }
          }

          @keyframes statusSwap {
            0% {
              opacity: 0;
              transform: translateY(12px);
              filter: blur(8px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
              filter: blur(0);
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
              letter-spacing: 0.62em;
            }
            50% {
              opacity: 0.78;
              letter-spacing: 0.68em;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [data-loader-root] *,
            [data-loader-root] *::before,
            [data-loader-root] *::after {
              animation-duration: 0.01ms !important;
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
