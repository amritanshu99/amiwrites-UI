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
    <footer className="relative w-full overflow-hidden bg-[radial-gradient(circle_at_12%_-10%,rgba(96,165,250,0.30),transparent_46%),radial-gradient(circle_at_88%_4%,rgba(56,189,248,0.28),transparent_44%),linear-gradient(135deg,rgba(248,252,255,0.99),rgba(236,246,255,0.98),rgba(224,242,254,0.96))] text-slate-700 backdrop-blur-xl dark:bg-[radial-gradient(circle_at_14%_-10%,rgba(24,24,27,0.45),transparent_45%),radial-gradient(circle_at_90%_8%,rgba(10,10,10,0.45),transparent_44%),linear-gradient(145deg,rgba(0,0,0,1),rgba(3,3,3,0.99),rgba(8,8,8,0.99))] dark:text-zinc-300">
      <div className="pointer-events-none absolute inset-0 opacity-75 dark:opacity-95">
        <div className="absolute -left-24 top-6 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl dark:bg-zinc-900/55" />
        <div className="absolute right-[-4.5rem] top-20 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl dark:bg-zinc-950/50" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl dark:bg-black/70" />
      </div>
      <div className="relative w-full px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-12 lg:gap-2.5">
          <section className="rounded-2xl border border-white/70 bg-white/70 p-2 shadow-lg shadow-slate-300/20 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/65 dark:shadow-black/30 sm:p-2.5 lg:col-span-5">
            <div className="flex items-center gap-2">
              <img
                src="/favicon.ico"
                alt="Amiverse logo"
                className="h-6 w-6 rounded-lg object-contain ring-1 ring-black/10 shadow-sm dark:ring-white/15"
                draggable="false"
              />
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white sm:text-base">
                Amiverse
              </h2>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-400 sm:text-xs sm:leading-[1.05rem]">
              Amiverse is the digital space of Amritanshu Mishra—a place where technology,
              innovation, and continuous growth come together. It features his projects, ideas, and
              practical solutions, reflecting his journey as a builder, learner, and creator, with a
              vision to create meaningful impact through thoughtful and forward-looking work.
            </p>
          </section>

          <nav
            aria-label="Company links"
            className="rounded-2xl border border-white/75 bg-white/65 p-2 shadow-md shadow-slate-300/20 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/60 sm:p-2.5 lg:col-span-2"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Company
            </h3>
            <ul className="mt-1 grid grid-cols-2 gap-1 text-[11px] sm:grid-cols-1 sm:text-xs">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="inline-flex rounded-md px-2 py-0.5 text-slate-700 transition-colors hover:bg-cyan-50/80 hover:text-cyan-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
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
                  className="inline-flex rounded-md px-2 py-0.5 text-slate-700 transition-colors hover:bg-cyan-50/80 hover:text-cyan-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
                  onClick={handleContactClick}
                >
                  Contact
                </button>
              </li>
            </ul>
          </nav>

          <nav
            aria-label="Product links"
            className="rounded-2xl border border-white/75 bg-white/65 p-2 shadow-md shadow-slate-300/20 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/60 sm:p-2.5 lg:col-span-2"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Product
            </h3>
            <ul className="mt-1 grid grid-cols-2 gap-1 text-[11px] sm:grid-cols-1 sm:text-xs">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="inline-flex rounded-md px-2 py-0.5 text-slate-700 transition-colors hover:bg-cyan-50/80 hover:text-cyan-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
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
            className="rounded-2xl border border-white/75 bg-white/65 p-2 shadow-md shadow-slate-300/20 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/60 sm:p-2.5 lg:col-span-3"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-white">
              Legal
            </h3>
            <ul className="mt-1 grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-2 sm:text-xs lg:grid-cols-1">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="inline-flex w-full items-center rounded-lg border border-slate-200/90 bg-white/88 px-2 py-0.5 text-slate-700 shadow-sm shadow-slate-300/40 backdrop-blur-md transition-all hover:border-cyan-500/70 hover:bg-cyan-50/90 hover:text-cyan-800 hover:shadow-cyan-200/40 dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-100 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-black dark:hover:text-white sm:px-2.5 sm:py-1"
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

        <div className="mt-1.5 flex flex-col gap-0.5 border-t border-slate-300/70 pt-1 text-[10px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-500 sm:mt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:pt-1.5 sm:text-[11px]">
          <p>© {new Date().getFullYear()} Amiverse. All rights reserved.</p>
          <p className="text-slate-500 dark:text-zinc-500">Made with love by Amritanshu Mishra.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
