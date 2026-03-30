import React, { useEffect, useState } from "react";

const InitialLoader = () => {
  const [randomQuote, setRandomQuote] = useState("");

  useEffect(() => {
    const quotes = [
      "Written, Designed & Directed by Amritanshu Mishra",
      "A vision brought to life by Amritanshu Mishra",
      "Crafted with soul by Amritanshu Mishra",
      "From imagination to execution — Amritanshu Mishra",
      "By the mind and heart of Amritanshu Mishra",
      "Created with intent by Amritanshu Mishra",
      "The journey begins with Amritanshu Mishra",
      "Ideas that breathe, from Amritanshu Mishra",
      "Where thought meets form — Amritanshu Mishra",
      "A storyteller, a maker — Amritanshu Mishra",
      "Ink, pixels, and passion — Amritanshu Mishra",
      "One vision. Infinite stories. Amritanshu Mishra",
    ];

    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);

    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");

    return () => {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#020202] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),rgba(0,0,0,0.95)_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(145,158,255,0.12),rgba(0,0,0,0)_43%)] animate-[nebulaDrift_11s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_78%,rgba(255,255,255,0.12),rgba(0,0,0,0)_46%)] animate-[nebulaDrift_9s_ease-in-out_infinite_reverse]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.3)_0.8px,transparent_0.8px)] [background-size:4px_4px] animate-[filmTexture_5.5s_steps(16)_infinite]" />
      <div className="absolute inset-0 opacity-45 [background:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.03)_3px,transparent_4px)] animate-[scanlineShift_8s_linear_infinite]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-black/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_32%,rgba(0,0,0,0.88)_82%)]" />
      <div className="pointer-events-none absolute -left-[65%] top-0 h-full w-[45%] rotate-[7deg] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-3xl animate-[projectorSweep_3.1s_cubic-bezier(.33,.05,.34,.98)_infinite]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl space-y-6 px-5 py-14 text-center sm:space-y-7 sm:px-8 md:space-y-9 md:py-16 lg:space-y-10 lg:py-20 animate-[cinemaReveal_950ms_ease-out_forwards]">
        <div className="mx-auto mb-2 h-[1px] w-24 bg-gradient-to-r from-transparent via-white/80 to-transparent sm:w-32" />

        <div className="relative mx-auto w-fit animate-[logoFloat_3.4s_ease-in-out_infinite]">
          <img
            src="/favicon.ico"
            alt="AmiVerse Logo"
            loading="eager"
            className="mx-auto h-16 w-16 rounded-full border border-white/25 bg-black/40 p-2 shadow-[0_0_35px_rgba(255,255,255,0.32)] sm:h-20 sm:w-20 md:h-24 md:w-24"
          />
          <span className="absolute inset-0 rounded-full border border-white/30 animate-[echoRing_2.4s_ease-out_infinite]" />
          <span className="absolute inset-0 rounded-full border border-indigo-300/35 animate-[echoRing_2.4s_ease-out_850ms_infinite]" />
        </div>

        <h1 className="font-cinzel text-4xl uppercase tracking-[0.28em] text-white drop-shadow-[0_12px_36px_rgba(0,0,0,0.95)] sm:text-5xl md:text-6xl lg:text-7xl animate-[titleAura_3.4s_ease-in-out_infinite]">
          AmiVerse
        </h1>

        <div className="mx-auto h-px w-44 bg-gradient-to-r from-transparent via-white/70 to-transparent sm:w-56 md:w-64" />

        <p className="mx-auto max-w-[92%] font-cinzel text-xs italic leading-relaxed tracking-[0.14em] text-gray-300 sm:max-w-3xl sm:text-sm md:text-base lg:text-lg animate-[textBreath_4.6s_ease-in-out_infinite]">
          {randomQuote}
        </p>

        <div className="mx-auto mt-2 h-[2px] w-44 overflow-hidden rounded-full bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.12)] sm:w-52">
          <span className="block h-full w-full origin-left bg-gradient-to-r from-indigo-300/70 via-white/85 to-indigo-300/70 animate-[loadSweep_1.9s_ease-in-out_infinite]" />
        </div>

        <div className="mx-auto flex w-fit items-center gap-2.5 pt-2 sm:pt-3">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-[pulse_1s_ease-in-out_infinite]" />
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-200/80 animate-[pulse_1s_ease-in-out_180ms_infinite]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/45 animate-[pulse_1s_ease-in-out_360ms_infinite]" />
        </div>
      </div>

      <style>
        {`
          @keyframes cinemaReveal {
            0% {
              transform: translateY(18px) scale(0.99);
              opacity: 0;
              filter: blur(3px);
            }
            100% {
              transform: translateY(0) scale(1);
              opacity: 1;
              filter: blur(0);
            }
          }

          @keyframes titleAura {
            0%,
            100% {
              text-shadow: 0 12px 36px rgba(0, 0, 0, 0.95), 0 0 18px rgba(255, 255, 255, 0.18);
              letter-spacing: 0.28em;
            }
            50% {
              text-shadow: 0 14px 42px rgba(0, 0, 0, 0.95), 0 0 28px rgba(255, 255, 255, 0.34);
              letter-spacing: 0.3em;
            }
          }

          @keyframes textBreath {
            0%,
            100% {
              opacity: 0.82;
              transform: translateY(0);
            }
            50% {
              opacity: 1;
              transform: translateY(-1px);
            }
          }

          @keyframes loadSweep {
            0% {
              transform: scaleX(0.12);
              opacity: 0.55;
            }
            40% {
              transform: scaleX(0.72);
              opacity: 0.85;
            }
            100% {
              transform: scaleX(1);
              opacity: 1;
            }
          }

          @keyframes logoFloat {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes echoRing {
            0% {
              transform: scale(1);
              opacity: 0.55;
            }
            100% {
              transform: scale(1.35);
              opacity: 0;
            }
          }

          @keyframes nebulaDrift {
            0%,
            100% {
              transform: scale(1) translate3d(0, 0, 0);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.1) translate3d(2%, -1.5%, 0);
              opacity: 0.95;
            }
          }

          @keyframes filmTexture {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-2%, 2%, 0);
            }
          }

          @keyframes scanlineShift {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(16px);
            }
          }

          @keyframes projectorSweep {
            0% {
              transform: translateX(-15%) rotate(7deg);
              opacity: 0;
            }
            20% {
              opacity: 0.5;
            }
            80% {
              opacity: 0.5;
            }
            100% {
              transform: translateX(280%) rotate(7deg);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default InitialLoader;
