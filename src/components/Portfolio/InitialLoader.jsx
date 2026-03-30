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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(160,160,160,0.2),rgba(0,0,0,0)_45%)] animate-[pulse_5s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(120,120,120,0.18),rgba(0,0,0,0)_40%)] animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),rgba(0,0,0,1)_70%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black" />
      <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl animate-[loaderSweep_3.8s_ease-in-out_infinite]" />

      <div className="relative z-10 space-y-6 px-6 py-16 text-center">
        <div className="relative mx-auto w-fit">
          <img
            src="/favicon.ico"
            alt="AmiVerse Logo"
            loading="eager"
            className="mx-auto h-16 w-16 animate-[pulse_2.2s_ease-in-out_infinite] opacity-95 drop-shadow-[0_0_36px_rgba(255,255,255,0.45)] md:h-20 md:w-20"
          />
          <span className="absolute inset-0 scale-125 animate-[ping_2.4s_ease-in-out_infinite] rounded-full border border-white/30" />
          <span className="absolute inset-0 scale-[1.45] rounded-full border border-white/10" />
        </div>

        <h1 className="font-cinzel text-4xl uppercase tracking-[0.35em] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.85)] md:text-6xl lg:text-7xl">
          AmiVerse
        </h1>

        <div className="h-px w-44 md:w-60 mx-auto bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        <p className="mx-auto max-w-3xl font-cinzel text-sm italic tracking-[0.16em] text-gray-300 md:text-lg lg:text-xl">
          {randomQuote}
        </p>

        <div className="mx-auto flex w-fit items-center gap-2 pt-3">
          <span className="h-2 w-2 rounded-full bg-white/80 animate-[pulse_1s_ease-in-out_infinite]" />
          <span className="h-2 w-2 rounded-full bg-white/55 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
          <span className="h-2 w-2 rounded-full bg-white/35 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>

      <style>
        {`
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
        `}
      </style>
    </div>
  );
};

export default InitialLoader;
