import { useEffect, useState } from "react";

const quickLinks = [
  { label: "Privacy Hub", href: "#privacy-hub" },
  { label: "Data Use", href: "#data-use" },
  { label: "Cookies", href: "#cookies" },
  { label: "Trust & Safety", href: "#trust-safety" },
  { label: "Contact", href: "mailto:amritanshu99@gmail.com" },
];

const policyHighlights = [
  {
    id: "privacy-hub",
    title: "Privacy Hub",
    details:
      "Amiverse only collects account, usage, and feedback data needed to run core features, improve AI quality, and secure the platform.",
  },
  {
    id: "data-use",
    title: "How We Use Data",
    details:
      "Your activity signals help us personalize recommendations, detect abuse, and improve model responses. Sensitive fields are minimized and protected.",
  },
  {
    id: "cookies",
    title: "Cookies & Storage",
    details:
      "Cookies/local storage keep you signed in, remember preferences, and power analytics that help us fix bugs and ship better product updates.",
  },
  {
    id: "trust-safety",
    title: "Trust & Safety",
    details:
      "Security reviews, encrypted traffic, and moderation pipelines are used to protect user content and keep the Amiverse community safe.",
  },
];

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <footer
      className={`w-full px-6 py-8 sm:py-10
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
      <div className="max-w-7xl mx-auto space-y-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 text-center lg:text-left">
            <p className="text-xl font-semibold tracking-tight text-white">Amiverse</p>
            <p className="text-sm text-gray-200/90 max-w-xl">
              Building practical AI experiences with transparency, responsible data use,
              and user-first design.
            </p>
          </div>

          <nav aria-label="Footer quick links" className="flex flex-wrap justify-center lg:justify-end gap-2">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm bg-white/10 hover:bg-white/20
                  border border-white/20 hover:border-white/35 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {policyHighlights.map((item) => (
            <section
              id={item.id}
              key={item.id}
              className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-xs sm:text-sm text-gray-200/90 leading-relaxed">{item.details}</p>
            </section>
          ))}
        </div>

        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-sm font-medium tracking-wide text-center sm:text-left">
          <p className="flex items-center gap-1">
            Built with
            <span className="text-pink-400 animate-pulse" role="img" aria-label="heart">
              ❤️
            </span>
            by AI
          </p>
          <p className="text-gray-200/90 sm:text-right">
            © {new Date().getFullYear()} Amiverse. Privacy-first by design.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
