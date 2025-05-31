import { useEffect, useState } from "react";

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <footer
      className={`w-full border-t border-zinc-300 bg-zinc-100 text-zinc-700 px-6 py-5 shadow-[0_-1px_4px_rgba(0,0,0,0.05)] transition-all duration-700 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-center text-sm sm:text-base gap-1 sm:gap-0">
        <p className="font-medium tracking-wide">
          Built with <span className="text-pink-500 animate-pulse">❤️</span> by AI
        </p>
        <p className="text-zinc-500 font-light">
          © {new Date().getFullYear()} Amiverse. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
