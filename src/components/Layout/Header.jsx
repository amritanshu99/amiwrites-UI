import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  UserCircle,
  MoonStar,
  SunMedium,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SignupModal from "../Auth/SignupModal";
import LoginModal from "../Auth/LoginModal";
import { toast } from "react-toastify";

function parseJwt(token) {
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// a11y-friendly animated pill
const ActivePill = motion.create("span");

export default function Header({ setLoading }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [mounted, setMounted] = useState(false);

  // For md screen tab scrolling
  const navScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Theme: localStorage + system preference
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const location = useLocation();
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const userButtonRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Apply theme class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const updateAuthStateFromToken = () => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    if (token) {
      const decoded = parseJwt(token);
      setUsername(decoded?.username || null);
    } else {
      setUsername(null);
    }
  };

  useEffect(() => {
    updateAuthStateFromToken();
  }, [loginOpen, signupOpen]);

  useEffect(() => {
    const handleTokenChanged = () => updateAuthStateFromToken();
    window.addEventListener("tokenChanged", handleTokenChanged);
    return () => window.removeEventListener("tokenChanged", handleTokenChanged);
  }, []);

  // Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        !userButtonRef.current?.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change / ESC
  useEffect(() => {
    setUserMenuOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [menuOpen]);

  // Track scrollability of the md+ tab bar
  const updateScrollButtons = () => {
    const el = navScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = navScrollRef.current;
    if (!el) return;
    const onScroll = () => updateScrollButtons();
    el.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => updateScrollButtons();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollTabs = (dir) => {
    const el = navScrollRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.6) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const navLinks = [
    { name: "My Portfolio", to: "/" },
    { name: "My Blogs", to: "/blogs" },
    { name: "AmiBot", to: "/amibot" },
    { name: "Tech Byte", to: "/tech-byte" },
    { name: "AI Tools", to: "/ai-tools" },
    { name: "Task Manager", to: "/task-manager" },
    { name: "AI Chat", to: "/ai-chat" },
  ];

  const handleLogout = async () => {
    if (!setLoading) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("tokenChanged"));
      setUserMenuOpen(false);
      setMenuOpen(false);
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Skip link for a11y */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] bg-black text-white rounded px-3 py-2"
      >
        Skip to content
      </a>

      <header
        className="
          sticky top-0 z-50 w-full
          border-b border-black/5 dark:border-white/10
          bg-gradient-to-r from-sky-50 via-fuchsia-50 to-emerald-50
          supports-[backdrop-filter]:bg-white/60 backdrop-blur-md
          dark:bg-black dark:bg-none dark:supports-[backdrop-filter]:bg-black dark:backdrop-blur-none
        "
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Brand */}
            <Link
              to="/"
              className="group flex items-center gap-3 min-w-0"
              aria-label="AmiVerse Home"
            >
              <img
                src="/favicon.ico"
                alt="AmiVerse logo"
                className="h-9 w-9 rounded-xl object-contain ring-1 ring-black/10 dark:ring-white/15 shadow-sm transition-transform duration-300 group-hover:rotate-3 group-hover:scale-[1.03]"
                draggable="false"
              />
              {/* Always show name when there's room; truncate if tight */}
              <span
                className="
                  text-xl font-semibold tracking-tight
                  text-gray-900 dark:text-white
                  group-hover:text-sky-700 dark:group-hover:text-cyan-300 transition-colors
                  whitespace-nowrap truncate
                  max-w-[40vw] sm:max-w-[45vw] md:max-w-[20rem]
                "
                title="AmiVerse"
              >
                AmiVerse
              </span>
            </Link>

            {/* md+ nav with horizontal scroll; remove pill bg in dark */}
            <div className="relative hidden md:flex items-center max-w-full flex-1 justify-center">
              {/* Left gradient fade */}
              {canScrollLeft && (
                <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white/90 to-transparent dark:from-black z-10" />
              )}

              {/* Left nudge */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollTabs("left")}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/90 dark:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 backdrop-blur-sm hover:bg-white dark:hover:bg-white/15 transition hidden sm:flex items-center justify-center"
                  aria-label="Scroll tabs left"
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                </button>
              )}

              <nav
                ref={navScrollRef}
                className="
                  flex items-center gap-1 rounded-full
                  bg-gray-50/60 dark:bg-transparent
                  p-1 dark:p-0
                  ring-1 ring-black/5 dark:ring-0
                  overflow-x-auto whitespace-nowrap scroll-px-2
                  snap-x snap-mandatory
                  [-ms-overflow-style:none] [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden
                  max-w-full
                "
                onScroll={updateScrollButtons}
                role="tablist"
              >
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={({ isActive }) =>
                      `relative rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sky-500/60
                       text-[13px] md:text-sm px-3 md:px-3.5 py-2 snap-center
                       ${
                         isActive
                           ? "text-sky-800 dark:text-cyan-200"
                           : "text-gray-700 hover:text-sky-700 dark:text-gray-300 dark:hover:text-cyan-300"
                       }`
                    }
                    role="tab"
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10">{link.name}</span>
                        {isActive && (
                          <ActivePill
                            layoutId="active-pill"
                            className="absolute inset-0 rounded-full bg-sky-200/70 dark:bg-white/10 ring-1 ring-sky-300/60 dark:ring-white/10"
                            transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.7 }}
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              {/* Right gradient fade */}
              {canScrollRight && (
                <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white/90 to-transparent dark:from-black z-10" />
              )}

              {/* Right nudge */}
              {canScrollRight && (
                <button
                  onClick={() => scrollTabs("right")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/90 dark:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 backdrop-blur-sm hover:bg-white dark:hover:bg-white/15 transition hidden sm:flex items-center justify-center"
                  aria-label="Scroll tabs right"
                  type="button"
                >
                  <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                </button>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
                aria-label="Toggle Dark Mode"
                type="button"
              >
                {mounted &&
                  (darkMode ? (
                    <SunMedium className="h-5 w-5 text-amber-300" />
                  ) : (
                    <MoonStar className="h-5 w-5 text-gray-800 dark:text-white" />
                  ))}
              </button>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    ref={userButtonRef}
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 text-gray-900 dark:text-white"
                    aria-label="User menu"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-controls="user-menu"
                    type="button"
                  >
                    <UserCircle className="h-6 w-6" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        key="dropdown"
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        id="user-menu"
                        role="menu"
                        aria-labelledby="user-menu-button"
                        className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl bg-white dark:bg-black shadow-lg ring-1 ring-black/10 dark:ring-white/10"
                      >
                        <div className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-black/5 dark:border-white/10">
                          Hi, <span className="font-medium">{username}</span>!
                        </div>
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-900 flex items-center gap-2"
                          type="button"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex gap-2">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm ring-1 ring-sky-700/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500/80"
                    type="button"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setSignupOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm ring-1 ring-emerald-700/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500/80"
                    type="button"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Mobile burger */}
              <button
                onClick={() => setMenuOpen((p) => !p)}
                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 text-gray-800 dark:text-gray-200"
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                type="button"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              ref={mobileMenuRef}
              key="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              id="mobile-menu"
              className="md:hidden border-t border-black/5 dark:border-white/10 bg-white/90 dark:bg-black dark:backdrop-blur-0"
              role="menu"
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
                <div className="grid grid-cols-1 gap-1.5">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.name}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `block w-full rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                          isActive
                            ? "bg-sky-100 text-sky-800 dark:bg-white/10 dark:text-cyan-100 ring-1 ring-sky-300/50 dark:ring-white/10"
                            : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-900"
                        }`
                      }
                      role="menuitem"
                    >
                      {link.name}
                    </NavLink>
                  ))}

                  {!isAuthenticated && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setLoginOpen(true);
                          setMenuOpen(false);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm ring-1 ring-sky-700/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500/80"
                        type="button"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setSignupOpen(true);
                          setMenuOpen(false);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm ring-1 ring-emerald-700/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500/80"
                        type="button"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
