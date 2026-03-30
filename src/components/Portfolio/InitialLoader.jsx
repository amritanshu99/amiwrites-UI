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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#030303] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.2),rgba(0,0,0,0)_42%)] animate-[nebulaPulse_6.5s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.2),rgba(0,0,0,0)_45%)] animate-[nebulaPulse_7.2s_ease-in-out_infinite_reverse]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),rgba(0,0,0,1)_68%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_45%,rgba(129,140,248,0.08)_75%,transparent)] animate-[filmGrain_3.6s_steps(12)_infinite]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black" />
      <div className="absolute -left-1/2 top-0 h-full w-1/2 rotate-[8deg] bg-gradient-to-r from-transparent via-white/15 to-transparent blur-2xl animate-[loaderSweep_2.8s_cubic-bezier(.28,.11,.32,.98)_infinite]" />
      <div className="absolute inset-0 opacity-40 mix-blend-screen animate-[starField_4.5s_linear_infinite] [background-image:radial-gradient(circle,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:3px_3px]" />

      <div className="relative z-10 space-y-6 px-6 py-16 text-center animate-[revealUp_0.9s_ease-out_forwards]">
        <div className="relative mx-auto w-fit animate-[floatLogo_3.2s_ease-in-out_infinite]">
          <img
            src="/favicon.ico"
            alt="AmiVerse Logo"
            loading="eager"
            className="mx-auto h-16 w-16 animate-[pulse_2.1s_ease-in-out_infinite] opacity-95 drop-shadow-[0_0_40px_rgba(255,255,255,0.5)] md:h-20 md:w-20"
          />
          <span className="absolute inset-0 scale-125 animate-[echoRing_2.2s_ease-in-out_infinite] rounded-full border border-white/35" />
          <span className="absolute inset-0 scale-[1.5] animate-[echoRing_2.2s_ease-in-out_0.7s_infinite] rounded-full border border-indigo-300/35" />
          <span className="absolute inset-0 scale-[1.75] rounded-full border border-white/10" />
        </div>

        <h1 className="font-cinzel text-4xl uppercase tracking-[0.35em] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.85)] md:text-6xl lg:text-7xl animate-[titleGlow_2.8s_ease-in-out_infinite]">
          AmiVerse
        </h1>

        <div className="h-px w-44 md:w-60 mx-auto bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        <p className="mx-auto max-w-3xl font-cinzel text-sm italic tracking-[0.16em] text-gray-300 md:text-lg lg:text-xl">
          {randomQuote}
        </p>

        <div className="mx-auto flex w-fit items-center gap-2 pt-3">
          <span className="h-2 w-2 rounded-full bg-white/80 animate-[pulse_1s_ease-in-out_infinite]" />
          <span className="h-2 w-2 rounded-full bg-indigo-200/75 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
          <span className="h-2 w-2 rounded-full bg-white/40 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>

      <style>
        {`
          @keyframes revealUp {
            0% {
              transform: translateY(18px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
          @keyframes titleGlow {
            0%,
            100% {
              text-shadow: 0 8px 32px rgba(0, 0, 0, 0.9), 0 0 14px rgba(255, 255, 255, 0.22);
            }
            50% {
              text-shadow: 0 8px 36px rgba(0, 0, 0, 0.9), 0 0 22px rgba(255, 255, 255, 0.42);
            }
          }
          @keyframes floatLogo {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-7px);
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
          @keyframes nebulaPulse {
            0%,
            100% {
              transform: scale(1);
              opacity: 0.65;
            }
            50% {
              transform: scale(1.09);
              opacity: 0.95;
            }
          }
          @keyframes filmGrain {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-2%, 2%, 0);
            }
          }
          @keyframes loaderSweep {
            0% {
              transform: translateX(-20%) rotate(8deg);
              opacity: 0;
            }
            20% {
              opacity: 0.45;
            }
            80% {
              opacity: 0.45;
            }
            100% {
              transform: translateX(260%) rotate(8deg);
              opacity: 0;
            }
          }
          @keyframes starField {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-40px, 25px, 0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default InitialLoader;
