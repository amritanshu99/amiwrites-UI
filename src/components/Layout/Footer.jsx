import { useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpRight, Heart, Mail, Sparkles } from "lucide-react";

const productLinks = [
  { label: "AI Chat", href: "/ai-chat" },
  { label: "AI Tools", href: "/ai-tools" },
  { label: "Task Manager", href: "/task-manager" },
  { label: "AmiBot", href: "/amibot" },
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

const panelClass = "amiverse-chrome-panel rounded-2xl p-3";
const sectionHeadingClass =
  "text-xs font-bold uppercase tracking-[0.18em] text-sky-800 dark:text-cyan-200";
const footerLinkClass =
  "group inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-[background-color,color,transform] duration-200 hover:-translate-y-px hover:bg-white/72 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/45 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white dark:focus-visible:ring-cyan-200/65";

const FooterLink = ({ href, label, onClick }) => (
  <Link className={footerLinkClass} to={href} onClick={onClick}>
    <span>{label}</span>
    <ArrowUpRight
      className="h-3.5 w-3.5 shrink-0 opacity-45 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-80"
      aria-hidden="true"
    />
  </Link>
);

const Footer = () => {
  const scrollToTop = useCallback(() => {
    const appShell = document.querySelector(".amiverse-app-shell");
    if (appShell) {
      appShell.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleContactClick = useCallback(() => {
    window.dispatchEvent(new Event("open-contact-modal"));
  }, []);

  return (
    <footer className="amiverse-site-chrome relative isolate w-full shrink-0 overflow-hidden border-t border-sky-900/[0.12] text-slate-600 dark:border-cyan-100/[0.11] dark:text-slate-300">
      <div
        className="amiverse-site-chrome-glow pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-700/25 to-transparent dark:via-cyan-200/20"
        aria-hidden="true"
      />

      <div
        className="relative mx-auto w-full max-w-[90rem] px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pt-4 lg:px-5"
        data-testid="footer-content"
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          <section className={`${panelClass} amiverse-chrome-panel--strong sm:col-span-2 lg:col-span-4`}>
            <div className="flex items-center gap-3">
              <img
                src="/icons/icon-96x96.png"
                alt="AmiVerse logo"
                width="96"
                height="96"
                loading="lazy"
                decoding="async"
                className="h-11 w-11 rounded-2xl bg-white/80 object-contain shadow-[0_10px_24px_rgba(15,23,42,0.14)] ring-1 ring-sky-900/10 dark:bg-white/[0.08] dark:ring-cyan-100/15"
                draggable="false"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                    AmiVerse
                  </h2>
                  <Sparkles className="h-4 w-4 text-sky-600 dark:text-cyan-300" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-800/75 dark:text-cyan-200/70">
                  Build / Learn / Create
                </p>
              </div>
            </div>

            <p className="mt-2 max-w-xl text-sm leading-5 text-slate-600 dark:text-slate-300">
              A digital space where Amritanshu Mishra shares thoughtful products,
              practical AI work, engineering ideas, and a journey of continuous growth.
            </p>

            <div className="mt-2 flex flex-col gap-2 min-[380px]:flex-row">
              <button
                type="button"
                onClick={handleContactClick}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-800 to-teal-700 px-4 py-2 text-sm font-bold text-white shadow-[0_12px_28px_rgba(14,116,144,0.22)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(14,116,144,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:from-cyan-300 dark:to-emerald-300 dark:text-slate-950 dark:shadow-[0_12px_28px_rgba(34,211,238,0.1)]"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Start a conversation
              </button>
              <a
                href="mailto:amritanshu99@gmail.com"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-sky-900/10 bg-white/55 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white/85 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/45 dark:border-cyan-100/10 dark:bg-white/[0.055] dark:text-slate-200 dark:hover:bg-white/[0.1] dark:hover:text-white dark:focus-visible:ring-cyan-200/65"
              >
                Email directly
              </a>
            </div>
          </section>

          <nav aria-label="Company links" className={`${panelClass} lg:col-span-2`}>
            <h3 className={sectionHeadingClass}>Company</h3>
            <ul className="mt-2 grid grid-cols-2 gap-1 min-[380px]:grid-cols-3 sm:grid-cols-1">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} onClick={scrollToTop} />
                </li>
              ))}
              <li>
                <button type="button" className={footerLinkClass} onClick={handleContactClick}>
                  <span>Contact</span>
                  <Mail className="h-3.5 w-3.5 opacity-55" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </nav>

          <nav aria-label="Product links" className={`${panelClass} lg:col-span-3`}>
            <h3 className={sectionHeadingClass}>Explore</h3>
            <ul className="mt-2 grid grid-cols-2 gap-1">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} onClick={scrollToTop} />
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links" className={`${panelClass} sm:col-span-2 lg:col-span-3`}>
            <h3 className={sectionHeadingClass}>Legal</h3>
            <ul className="mt-2 grid grid-cols-2 gap-1">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} onClick={scrollToTop} />
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-2 flex flex-col gap-2 border-t border-sky-900/10 pt-2 text-xs text-slate-500 dark:border-cyan-100/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {new Date().getFullYear()} AmiVerse. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <p className="inline-flex items-center gap-1.5">
              <span>Made with</span>
              <span className="sr-only">love</span>
              <Heart
                className="amiverse-footer-heart h-3.5 w-3.5 fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.34)]"
                aria-hidden="true"
                strokeWidth={2.4}
              />
              <span>by Amritanshu Mishra.</span>
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="mr-16 inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-900/10 bg-white/55 px-3.5 py-2 font-semibold text-slate-700 transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/85 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/45 dark:border-cyan-100/10 dark:bg-white/[0.055] dark:text-slate-200 dark:hover:bg-white/[0.1] dark:hover:text-white dark:focus-visible:ring-cyan-200/65 sm:mr-0"
              aria-label="Back to top"
            >
              Back to top <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
