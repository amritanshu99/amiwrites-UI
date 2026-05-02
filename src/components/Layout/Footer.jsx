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

const panelSurfaceClass =
  "rounded-2xl border border-white/70 bg-white/70 p-2 shadow-lg shadow-slate-300/20 backdrop-blur-md dark:border-zinc-800/80 dark:bg-[linear-gradient(155deg,rgba(20,20,20,0.98),rgba(6,6,6,0.98),rgba(0,0,0,1))] dark:shadow-[0_28px_70px_-42px_rgba(0,0,0,0.96)] sm:p-2.5";

const navSurfaceClass =
  "rounded-2xl border border-white/75 bg-white/65 p-2 shadow-md shadow-slate-300/20 backdrop-blur-md dark:border-zinc-800/75 dark:bg-[linear-gradient(160deg,rgba(18,18,18,0.98),rgba(5,5,5,0.98),rgba(0,0,0,1))] dark:shadow-[0_24px_62px_-42px_rgba(0,0,0,0.94)] sm:p-2.5";

const textLinkClass =
  "inline-flex rounded-md px-2 py-0.5 text-slate-700 transition-colors hover:bg-cyan-50/80 hover:text-cyan-700 dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white";

const legalLinkClass =
  "inline-flex w-full items-center rounded-lg border border-slate-200/90 bg-white/88 px-2 py-0.5 text-slate-700 shadow-sm shadow-slate-300/40 backdrop-blur-md transition-all hover:border-cyan-500/70 hover:bg-cyan-50/90 hover:text-cyan-800 hover:shadow-cyan-200/40 dark:border-zinc-800/80 dark:bg-[linear-gradient(145deg,rgba(15,15,15,0.98),rgba(2,2,2,1))] dark:text-zinc-100 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-[linear-gradient(145deg,rgba(28,28,28,0.98),rgba(6,6,6,1))] dark:hover:text-white sm:px-2.5 sm:py-1";

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
    <footer className="relative isolate w-full overflow-hidden border-t border-sky-100/80 bg-[radial-gradient(circle_at_12%_-10%,rgba(96,165,250,0.30),transparent_46%),radial-gradient(circle_at_88%_4%,rgba(56,189,248,0.28),transparent_44%),linear-gradient(135deg,rgba(248,252,255,0.99),rgba(236,246,255,0.98),rgba(224,242,254,0.96))] text-slate-700 ring-1 ring-inset ring-white/35 [background-clip:padding-box] dark:border-white/[0.06] dark:bg-[radial-gradient(circle_at_50%_-30%,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_12%_12%,rgba(39,39,42,0.32),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(24,24,27,0.26),transparent_28%),linear-gradient(180deg,rgba(18,18,18,0.98)_0%,rgba(5,5,5,0.99)_42%,rgba(0,0,0,1)_100%)] dark:text-zinc-300 dark:ring-white/[0.05]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/50 to-transparent dark:via-white/[0.14]" />
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/55 to-transparent dark:from-white/[0.05]" />
      <div className="pointer-events-none absolute inset-0 opacity-75 dark:opacity-100">
        <div className="absolute -left-24 top-6 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl dark:bg-transparent" />
        <div className="absolute right-[-4.5rem] top-20 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl dark:bg-zinc-900/40" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl dark:bg-zinc-950/60" />
      </div>
      <div className="relative w-full px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-12 lg:gap-2.5">
          <section className={`${panelSurfaceClass} lg:col-span-5`}>
            <div className="flex items-center gap-2">
              <img
                src="/icons/icon-96x96.png"
                alt="Amiverse logo"
                className="h-6 w-6 rounded-lg object-contain ring-1 ring-black/10 shadow-sm dark:ring-white/15"
                draggable="false"
              />
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white sm:text-base">
                Amiverse
              </h2>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-400 sm:text-xs sm:leading-[1.05rem]">
              Amiverse is the digital space of Amritanshu Mishra - a place where technology,
              innovation, and continuous growth come together. It features his projects, ideas, and
              practical solutions, reflecting his journey as a builder, learner, and creator, with a
              vision to create meaningful impact through thoughtful and forward-looking work.
            </p>
          </section>

          <nav aria-label="Company links" className={`${navSurfaceClass} lg:col-span-2`}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Company
            </h3>
            <ul className="mt-1 grid grid-cols-2 gap-1 text-[11px] sm:grid-cols-1 sm:text-xs">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link className={textLinkClass} to={link.href} onClick={scrollToTop}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className={textLinkClass}
                  onClick={handleContactClick}
                >
                  Contact
                </button>
              </li>
            </ul>
          </nav>

          <nav aria-label="Product links" className={`${navSurfaceClass} lg:col-span-2`}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Product
            </h3>
            <ul className="mt-1 grid grid-cols-2 gap-1 text-[11px] sm:grid-cols-1 sm:text-xs">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link className={textLinkClass} to={link.href} onClick={scrollToTop}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links" className={`${navSurfaceClass} lg:col-span-3`}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Legal
            </h3>
            <ul className="mt-1 grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-2 sm:text-xs lg:grid-cols-1">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link className={legalLinkClass} to={link.href} onClick={scrollToTop}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-1.5 flex flex-col gap-0.5 border-t border-slate-300/70 pt-1 text-[10px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400 sm:mt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:pt-1.5 sm:text-[11px]">
          <p>Copyright {new Date().getFullYear()} Amiverse. All rights reserved.</p>
          <p className="text-slate-500 dark:text-slate-400">Made with love by Amritanshu Mishra.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
