import { useEffect, useState } from "react";

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <footer
      className={`w-full px-6 py-4
        bg-gradient-to-br from-indigo-900 via-sky-800 to-purple-800
        dark:from-gray-900 dark:via-gray-950 dark:to-black
        bg-opacity-40 dark:bg-opacity-90
        backdrop-blur-lg
        border-t border-white/10 dark:border-gray-700
        shadow-[inset_0_1px_6px_rgba(255,255,255,0.08)]
        text-gray-100 dark:text-gray-300
        transition-all duration-700 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
      style={{
        WebkitBackdropFilter: "blur(16px)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-sm font-medium tracking-wide select-none text-center sm:text-left">
        <p className="flex items-center gap-1">
          Built with
          <span className="text-pink-400 animate-pulse" role="img" aria-label="heart">
            ❤️
          </span>
          by AI
        </p>
        <p className="text-gray-300 dark:text-gray-400 sm:text-right">
          © {new Date().getFullYear()} Amiverse. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
