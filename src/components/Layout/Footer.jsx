import { Link } from "react-router-dom";

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
  { label: "Contact", href: "mailto:amritanshu99@gmail.com" },
];

const Footer = () => {
  return (
    <footer className="w-full mt-10 border-t border-slate-700/70 bg-slate-950/95 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <section>
            <h2 className="text-white text-lg font-semibold tracking-tight">Amiverse</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Production-ready AI experiences focused on transparency, reliability, and user
              safety.
            </p>
          </section>

          <nav aria-label="Company links">
            <h3 className="text-sm font-semibold text-white uppercase tracking-[0.14em]">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("mailto:") ? (
                    <a className="hover:text-cyan-300 transition-colors" href={link.href}>
                      {link.label}
                    </a>
                  ) : (
                    <Link className="hover:text-cyan-300 transition-colors" to={link.href}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Product links">
            <h3 className="text-sm font-semibold text-white uppercase tracking-[0.14em]">Product</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link className="hover:text-cyan-300 transition-colors" to={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h3 className="text-sm font-semibold text-white uppercase tracking-[0.14em]">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link className="hover:text-cyan-300 transition-colors" to={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-800 text-xs sm:text-sm text-slate-400 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Amiverse. All rights reserved.</p>
          <p>Use of this site is subject to our Terms and Privacy Policy.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
