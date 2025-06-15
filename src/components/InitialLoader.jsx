import React, { useEffect, useState } from 'react';

const InitialLoader = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Prevent scroll on mobile
    document.body.style.overflow = 'hidden';

    const fadeOutTimer = setTimeout(() => setFadeOut(true), 5000); // Wait 5s, then fade out
    const finishTimer = setTimeout(() => {
      document.body.style.overflow = ''; // Re-enable scroll
      onComplete();
    }, 6500); // Remove after 6.5s total

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
      document.body.style.overflow = ''; // Clean up
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
          className="mx-auto w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 opacity-80"
        />
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-cinzel tracking-widest text-white uppercase">
          AmiVerse
        </h1>
        <p className="text-md md:text-xl lg:text-2xl text-gray-300 font-cinzel italic tracking-wider">
          Written, Designed & Directed by Amritanshu Mishra
        </p>
      </div>
    </div>
  );
};

export default InitialLoader;
