import React, { useEffect, useState } from 'react';

const InitialLoader = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');

  useEffect(() => {
    // List of random variations or quotes
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


    // Select a random one
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);

    // Lock scrolling during initial load
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');

    const fadeOutTimer = setTimeout(() => setFadeOut(true), 5000);
    const finishTimer = setTimeout(() => {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      onComplete();
    }, 6500);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black text-white z-[9999] transition-opacity duration-[2000ms] ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center animate-fade-in-slow px-6 py-20 space-y-6">
        <img
          src="/favicon.ico"
          alt="AmiVerse Logo"
          loading="eager"
          className="mx-auto w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 opacity-80"
        />
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-cinzel tracking-widest text-white uppercase">
          AmiVerse
        </h1>
        <p className="text-md md:text-xl lg:text-2xl text-gray-300 font-cinzel italic tracking-wider">
          {randomQuote}
        </p>
      </div>
    </div>
  );
};

export default InitialLoader;
