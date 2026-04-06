import { Link } from "react-router-dom";
import { useCallback } from "react";

const productLinks = [
  { label: "AI Chat", href: "/ai-chat" },
  { label: "AI Tools", href: "/ai-tools" },
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
    <footer className="relative mt-10 w-full overflow-hidden border-t border-slate-200/70 bg-gradient-to-br from-white/95 via-slate-50/95 to-cyan-50/70 text-slate-700 backdrop-blur-xl dark:border-slate-700/60 dark:from-slate-950/95 dark:via-black dark:to-cyan-950/40 dark:text-slate-300">
      <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-90">
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-800/30" />
        <div className="absolute -right-24 bottom-2 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-900/30" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <section>
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

          <nav aria-label="Company links">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Company
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="text-slate-700 transition-colors hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
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
                  className="text-slate-700 transition-colors hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
                  onClick={handleContactClick}
                >
                  Contact
                </button>
              </li>
            </ul>
          </nav>

          <nav aria-label="Product links">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="text-slate-700 transition-colors hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
                    to={link.href}
                    onClick={scrollToTop}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Legal
            </h3>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="inline-flex w-full items-center rounded-lg border border-slate-200/90 bg-white/85 px-3 py-2 text-slate-700 shadow-sm shadow-slate-300/40 backdrop-blur-md transition-all hover:border-cyan-500/70 hover:bg-cyan-50/90 hover:text-cyan-800 hover:shadow-cyan-200/40 dark:border-slate-700/90 dark:bg-slate-900/85 dark:text-slate-200 dark:shadow-none dark:hover:border-cyan-400/80 dark:hover:bg-black dark:hover:text-cyan-200"
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

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-300/80 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-sm">
          <p>© {new Date().getFullYear()} Amiverse. All rights reserved.</p>
          <p className="text-slate-500 dark:text-slate-500">Made with love by Amritanshu Mishra.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
