import React, { useEffect, useState } from 'react';

const InitialLoader = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');

  useEffect(() => {
    const quotes = [
      'Written, Designed & Directed by Amritanshu Mishra',
      'A vision brought to life by Amritanshu Mishra',
      'Crafted with soul by Amritanshu Mishra',
      'From imagination to execution — Amritanshu Mishra',
      'By the mind and heart of Amritanshu Mishra',
      'Created with intent by Amritanshu Mishra',
      'The journey begins with Amritanshu Mishra',
      'Ideas that breathe, from Amritanshu Mishra',
      'Where thought meets form — Amritanshu Mishra',
      'A storyteller, a maker — Amritanshu Mishra',
      'Ink, pixels, and passion — Amritanshu Mishra',
      'One vision. Infinite stories. Amritanshu Mishra',
    ];

    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);

    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');

    const fadeOutTimer = setTimeout(() => setFadeOut(true), 1400);
    const finishTimer = setTimeout(() => {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center overflow-hidden bg-black text-white z-[9999] transition-opacity duration-700 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(80,80,80,0.22),rgba(0,0,0,1)_65%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black" />

      <div className="relative z-10 text-center px-6 py-16 space-y-6 animate-pulse">
        <div className="relative mx-auto w-fit">
          <img
            src="/favicon.ico"
            alt="AmiVerse Logo"
            loading="eager"
            className="mx-auto w-16 h-16 md:w-20 md:h-20 opacity-90 drop-shadow-[0_0_30px_rgba(255,255,255,0.25)]"
          />
          <span className="absolute inset-0 rounded-full border border-white/20 scale-125" />
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-cinzel tracking-[0.35em] text-white uppercase drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)]">
          AmiVerse
        </h1>

        <div className="h-px w-44 md:w-60 mx-auto bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        <p className="text-sm md:text-lg lg:text-xl text-gray-300 font-cinzel italic tracking-[0.16em] max-w-3xl mx-auto">
          {randomQuote}
        </p>
      </div>
    </div>
  );
};

export default InitialLoader;
