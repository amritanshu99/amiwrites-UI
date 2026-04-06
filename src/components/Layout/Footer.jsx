import { Link } from "react-router-dom";
import { useCallback } from "react";

const productLinks = [
  { label: "AI Chat", href: "/ai-chat" },
  { label: "AI Tools", href: "/ai-tools" },
  { label: "Task Manager", href: "/task-manager" },
  { label: "Amibot", href: "/amibot" },
  { label: "Tech Byte", href: "/tech-byte" },
  { label: "Blogs", href: "/blogs" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
  { label: "Terms of Service", href: "/legal/terms-of-service" },
  { label: "Cookie Policy", href: "/legal/cookie-policy" },
  { label: "Acceptable Use", href: "/legal/acceptable-use" },
  { label: "Security", href: "/legal/security" },
  { label: "Accessibility", href: "/legal/accessibility" },
];

const companyLinks = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/" },
];

const Footer = () => {
  const scrollToTop = useCallback(() => {
    const appShell = document.querySelector(".h-screen.overflow-y-scroll");
    if (appShell) {
      appShell.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleContactClick = useCallback(() => {
    scrollToTop();
    window.dispatchEvent(new Event("open-contact-modal"));
  }, [scrollToTop]);

  return (
    <footer className="relative mt-10 w-full overflow-hidden border-t border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(14,165,233,0.18),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.97),rgba(248,250,252,0.96),rgba(236,254,255,0.94))] text-slate-700 shadow-[0_-16px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.20),transparent_40%),radial-gradient(circle_at_95%_25%,rgba(56,189,248,0.20),transparent_38%),linear-gradient(145deg,rgba(2,6,23,0.98),rgba(2,8,23,0.96),rgba(6,10,25,0.96))] dark:text-slate-300 dark:shadow-[0_-20px_60px_-35px_rgba(6,182,212,0.22)]">
      <div className="pointer-events-none absolute inset-0 opacity-75 dark:opacity-95">
        <div className="absolute -left-24 top-6 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-700/30" />
        <div className="absolute right-[-4.5rem] top-20 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-800/35" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-300/15 blur-3xl dark:bg-indigo-900/25" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          <section className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-lg shadow-slate-300/20 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/55 dark:shadow-cyan-950/10 sm:p-5 lg:col-span-5">
            <div className="flex items-center gap-2">
              <img
                src="/favicon.ico"
                alt="Amiverse logo"
                className="h-7 w-7 rounded-lg object-contain ring-1 ring-black/10 shadow-sm dark:ring-white/15"
                draggable="false"
              />
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Amiverse
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Amiverse is the digital space of Amritanshu Mishra—a place where technology,
              innovation, and continuous growth come together. It features his projects, ideas, and
              practical solutions, reflecting his journey as a builder, learner, and creator, with a
              vision to create meaningful impact through thoughtful and forward-looking work.
            </p>
          </section>

          <nav
            aria-label="Company links"
            className="rounded-2xl border border-white/75 bg-white/65 p-4 shadow-md shadow-slate-300/20 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/50 sm:p-5 lg:col-span-2"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Company
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-1">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="inline-flex rounded-md px-2 py-1.5 text-slate-700 transition-colors hover:bg-cyan-50/80 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-200"
                    to={link.href}
                    onClick={scrollToTop}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="inline-flex rounded-md px-2 py-1.5 text-slate-700 transition-colors hover:bg-cyan-50/80 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-200"
                  onClick={handleContactClick}
                >
                  Contact
                </button>
              </li>
            </ul>
          </nav>

          <nav
            aria-label="Product links"
            className="rounded-2xl border border-white/75 bg-white/65 p-4 shadow-md shadow-slate-300/20 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/50 sm:p-5 lg:col-span-2"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Product
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-1">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="inline-flex rounded-md px-2 py-1.5 text-slate-700 transition-colors hover:bg-cyan-50/80 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-200"
                    to={link.href}
                    onClick={scrollToTop}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            aria-label="Legal links"
            className="rounded-2xl border border-white/75 bg-white/65 p-4 shadow-md shadow-slate-300/20 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/50 sm:p-5 lg:col-span-3"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Legal
            </h3>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="inline-flex w-full items-center rounded-lg border border-slate-200/90 bg-white/88 px-3 py-2 text-slate-700 shadow-sm shadow-slate-300/40 backdrop-blur-md transition-all hover:border-cyan-500/70 hover:bg-cyan-50/90 hover:text-cyan-800 hover:shadow-cyan-200/40 dark:border-slate-700/90 dark:bg-slate-900/85 dark:text-slate-100 dark:shadow-none dark:hover:border-cyan-400/80 dark:hover:bg-black dark:hover:text-cyan-200"
                    to={link.href}
                    onClick={scrollToTop}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-300/70 pt-4 text-xs text-slate-500 dark:border-slate-700/70 dark:text-slate-400 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-5 sm:text-sm">
          <p>© {new Date().getFullYear()} Amiverse. All rights reserved.</p>
          <p className="text-slate-500 dark:text-slate-400">Made with love by Amritanshu Mishra.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
