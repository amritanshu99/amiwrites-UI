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
    <footer className="w-full mt-10 border-t border-slate-200/80 bg-slate-100/95 text-slate-700 dark:border-slate-700/70 dark:bg-slate-950/95 dark:text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          <section>
            <h2 className="text-slate-900 dark:text-white text-lg font-semibold tracking-tight">Amiverse</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Production-ready AI experiences focused on transparency, reliability, and user
              safety.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
              Designed with an accessibility-first approach, clean legal readability, and dependable
              support pathways for every user.
            </p>
          </section>

          <nav aria-label="Company links">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-[0.14em]">
              Company
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="text-slate-700 hover:text-cyan-700 transition-colors dark:text-slate-300 dark:hover:text-cyan-300"
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
                  className="text-slate-700 hover:text-cyan-700 transition-colors dark:text-slate-300 dark:hover:text-cyan-300"
                  onClick={handleContactClick}
                >
                  Contact
                </button>
              </li>
            </ul>
          </nav>

          <nav aria-label="Product links">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-[0.14em]">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="text-slate-700 hover:text-cyan-700 transition-colors dark:text-slate-300 dark:hover:text-cyan-300"
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-[0.14em]">
              Legal
            </h3>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="inline-flex w-full items-center rounded-md border border-slate-300/90 bg-white px-3 py-2 text-slate-700 shadow-sm shadow-slate-200/40 hover:border-cyan-500/70 hover:bg-cyan-50 hover:text-cyan-800 transition-colors dark:border-slate-700/90 dark:bg-slate-900 dark:text-slate-200 dark:shadow-none dark:hover:border-cyan-400/80 dark:hover:bg-black dark:hover:text-cyan-200"
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

        <div className="mt-8 pt-5 border-t border-slate-300 dark:border-slate-800 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Amiverse. All rights reserved.</p>
          <p className="text-slate-500 dark:text-slate-500">
            Use of this site is subject to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
