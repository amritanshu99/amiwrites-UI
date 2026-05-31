import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  FilePenLine,
  Menu,
  X,
  LogOut,
  UserCircle,
  MoonStar,
  Sun,
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

  // For sm/md screen tab scrolling
  const navScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Theme: localStorage with light mode as the default
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return false;
  });

  const location = useLocation();
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);

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

  useEffect(() => {
    const handleOpenLogin = () => {
      setSignupOpen(false);
      setLoginOpen(true);
    };
    const handleOpenSignup = () => {
      setLoginOpen(false);
      setSignupOpen(true);
    };

    window.addEventListener("open-login-modal", handleOpenLogin);
    window.addEventListener("open-signup-modal", handleOpenSignup);

    return () => {
      window.removeEventListener("open-login-modal", handleOpenLogin);
      window.removeEventListener("open-signup-modal", handleOpenSignup);
    };
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
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !mobileMenuButtonRef.current?.contains(e.target)
      ) {
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
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  // Track scrollability of the sm+/md+ tab bar
  const updateScrollButtons = () => {
    const el = navScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth - clientWidth > 4;

    if (!hasOverflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

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
          sticky left-0 right-0 top-0 z-50 w-full max-w-full overflow-x-clip isolate
          pt-[env(safe-area-inset-top)]
          border-b border-[#475569]/[0.18] dark:border-white/[0.13]
          bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_38%,#EEF2F7_72%,#E2E8F0_100%)]
          backdrop-blur-2xl
          shadow-[0_10px_34px_rgba(71,85,105,0.11)]
          dark:bg-[linear-gradient(90deg,#000000_0%,#111827_100%)] dark:shadow-[0_10px_34px_rgba(0,0,0,0.5)]
        "
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(255,255,255,0.72),transparent_42%,rgba(71,85,105,0.08))] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(110deg,rgba(255,255,255,0.06),transparent_42%,rgba(255,255,255,0.04))]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#475569]/[0.24] to-transparent dark:via-white/[0.18]"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="relative flex h-16 sm:h-[4.25rem] lg:h-[4.5rem] items-center justify-between gap-2 sm:gap-3 flex-nowrap">
            {/* Brand */}
            <Link
              to="/"
              className="group flex min-w-0 max-w-[calc(100%-7rem)] shrink items-center gap-2 rounded-[1.15rem] px-2 py-1.5 transition-colors duration-200 hover:bg-white/64 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475569]/[0.45] dark:hover:bg-white/10 dark:focus-visible:ring-white/70 sm:max-w-none"
              aria-label="AmiVerse Home"
            >
              <img
                src="/icons/icon-96x96.png"
                alt="AmiVerse logo"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-[1.05rem] object-contain bg-white/90 ring-1 ring-[#475569]/[0.10] shadow-[0_8px_22px_rgba(15,23,42,0.2)] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-[1.04] dark:bg-white/[0.08] dark:ring-white/[0.12]"
                draggable="false"
              />
              {/* Always show name; truncate if tight */}
              <span
                className="
                  hidden min-[390px]:inline-block text-[1rem] sm:text-[1.08rem] md:text-xl font-semibold tracking-tight
                  text-[#111827] dark:text-slate-50 dark:drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)]
                  whitespace-nowrap truncate
                  max-w-[28vw] sm:max-w-[24vw] md:max-w-[12rem] lg:max-w-[16rem] xl:max-w-[22rem]
                "
                title="AmiVerse"
              >
                AmiVerse
              </span>
            </Link>

            {/* sm+ nav with horizontal scroll */}
            <div className="relative hidden sm:flex items-center flex-1 basis-0 min-w-0 justify-center">
              {/* Left gradient fade */}
              {canScrollLeft && (
                <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white/95 to-transparent dark:from-black z-10" />
              )}

              {/* Left nudge */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollTabs("left")}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-white/72 text-[#111827] shadow-sm ring-1 ring-[#475569]/[0.12] backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475569]/[0.45] dark:bg-white/[0.16] dark:text-white dark:ring-white/20 dark:hover:bg-white/[0.24] dark:focus-visible:ring-white/70 md:flex"
                  aria-label="Scroll tabs left"
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <nav
                ref={navScrollRef}
                className="
                  flex min-w-0 max-w-full items-center gap-1 rounded-[1.35rem]
                  bg-white/62 dark:bg-white/[0.07]
                  p-1.5
                  ring-1 ring-[#475569]/[0.12] dark:ring-white/[0.18]
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_10px_24px_rgba(71,85,105,0.09)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(0,0,0,0.3)]
                  backdrop-blur-xl
                  overflow-x-auto whitespace-nowrap scroll-px-2
                  snap-x snap-mandatory
                  [-ms-overflow-style:none] [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden
                "
                onScroll={updateScrollButtons}
                role="tablist"
              >
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={({ isActive }) =>
                       `relative inline-flex h-10 items-center rounded-[1rem] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#475569]/[0.45] dark:focus-visible:ring-white/70
                       text-[12.5px] sm:text-[13px] md:text-sm px-3 md:px-3.5 snap-center
                       ${
                         isActive
                           ? "text-[#111827] dark:text-white"
                           : "text-[#475569] hover:bg-white/70 hover:text-[#111827] dark:text-zinc-200/[0.85] dark:hover:bg-white/[0.09] dark:hover:text-white"
                       }`
                    }
                    role="tab"
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10 font-medium">{link.name}</span>
                        {isActive && (
                          <ActivePill
                            layoutId="active-pill"
                            className="absolute inset-0 rounded-[1rem] bg-white/[0.88] ring-1 ring-[#475569]/[0.12] shadow-[0_7px_18px_rgba(71,85,105,0.11)] dark:bg-white/[0.12] dark:ring-white/[0.18] dark:shadow-[0_7px_18px_rgba(15,23,42,0.14)]"
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 40,
                              mass: 0.7,
                            }}
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
                <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#E2E8F0]/95 to-transparent dark:from-[#111827] z-10" />
              )}

              {/* Right nudge */}
              {canScrollRight && (
                <button
                  onClick={() => scrollTabs("right")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-white/72 text-[#111827] shadow-sm ring-1 ring-[#475569]/[0.12] backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475569]/[0.45] dark:bg-white/[0.16] dark:text-white dark:ring-white/20 dark:hover:bg-white/[0.24] dark:focus-visible:ring-white/70 md:flex"
                  aria-label="Scroll tabs right"
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Right actions */}
            <div className="fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] flex shrink-0 items-center justify-end gap-1.5 sm:static sm:right-auto sm:top-auto sm:z-auto sm:gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-[1.05rem] bg-white/72 text-[#111827] shadow-[0_8px_20px_rgba(71,85,105,0.11)] ring-1 ring-[#475569]/[0.12] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475569]/[0.45] dark:bg-white/[0.08] dark:text-white dark:ring-white/20 dark:hover:bg-white/[0.14] dark:focus-visible:ring-white/70"
                aria-label="Toggle Dark Mode"
                type="button"
              >
                {mounted &&
                  (darkMode ? (
                    <Sun className="h-5 w-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.65)] transition-transform duration-300 group-hover:scale-110" />
                  ) : (
                    <MoonStar className="h-5 w-5 text-[#111827] transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(71,85,105,0.35)] group-hover:scale-110" />
                  ))}
              </button>

              {/* Auth (hide on small tablets to keep tabs visible) */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="user-menu-button"
                    ref={userButtonRef}
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[1.05rem] bg-white/72 text-[#111827] shadow-[0_8px_20px_rgba(71,85,105,0.11)] ring-1 ring-[#475569]/[0.12] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475569]/[0.45] dark:bg-white/[0.08] dark:text-white dark:ring-white/20 dark:hover:bg-white/[0.14] dark:focus-visible:ring-white/70"
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
                        className="absolute right-0 mt-3 w-56 max-w-[88vw] overflow-hidden rounded-2xl bg-white/95 shadow-[0_18px_42px_rgba(71,85,105,0.18)] ring-1 ring-[#475569]/[0.12] backdrop-blur-xl dark:bg-zinc-950/95 dark:shadow-[0_18px_42px_rgba(0,0,0,0.48)] dark:ring-white/10"
                      >
                        <div className="px-4 py-3 text-sm text-[#111827] dark:text-gray-200 border-b border-[#475569]/[0.10] dark:border-white/10">
                          Hi, <span className="font-medium">{username}</span>!
                        </div>
                        {username === "amritanshu99" && (
                          <>
                            <Link
                              to="/add-blog"
                              onClick={() => setUserMenuOpen(false)}
                              role="menuitem"
                              className="w-full px-4 py-3 text-sm text-[#111827] dark:text-gray-200 hover:bg-[#475569]/[0.08] dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:bg-[#475569]/[0.08] dark:focus-visible:bg-white/[0.06]"
                            >
                              <FilePenLine className="h-4 w-4" />
                              Create Blog
                            </Link>
                            <Link
                              to="/pulse-settings"
                              onClick={() => setUserMenuOpen(false)}
                              role="menuitem"
                              className="w-full px-4 py-3 text-sm text-[#111827] dark:text-gray-200 hover:bg-[#475569]/[0.08] dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:bg-[#475569]/[0.08] dark:focus-visible:bg-white/[0.06]"
                            >
                              <Activity className="h-4 w-4" />
                              Pulse Settings
                            </Link>
                          </>
                        )}
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full text-left px-4 py-3 text-sm text-[#111827] dark:text-gray-200 hover:bg-[#475569]/[0.08] dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:bg-[#475569]/[0.08] dark:focus-visible:bg-white/[0.06]"
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
                <div className="hidden md:flex gap-1.5 lg:gap-2">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="min-h-10 rounded-[1.05rem] bg-[#111827] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(71,85,105,0.15)] ring-1 ring-[#111827]/[0.10] transition hover:bg-[#475569] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#475569]/[0.50] focus-visible:ring-offset-slate-100 dark:bg-white/[0.92] dark:text-slate-950 dark:hover:bg-white dark:focus-visible:ring-white/80 dark:focus-visible:ring-offset-slate-950"
                    type="button"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setSignupOpen(true)}
                    className="min-h-10 rounded-[1.05rem] bg-white/72 px-3.5 py-2 text-sm font-semibold text-[#111827] shadow-[0_9px_22px_rgba(71,85,105,0.11)] ring-1 ring-[#475569]/[0.12] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#475569]/[0.50] focus-visible:ring-offset-slate-100 dark:bg-white/[0.08] dark:text-white dark:ring-white/[0.24] dark:hover:bg-white/[0.14] dark:focus-visible:ring-white/80 dark:focus-visible:ring-offset-slate-950"
                    type="button"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Mobile burger */}
              <button
                ref={mobileMenuButtonRef}
                onClick={() => setMenuOpen((p) => !p)}
                className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-[1.05rem] bg-white/72 text-[#111827] shadow-[0_8px_20px_rgba(71,85,105,0.11)] ring-1 ring-[#475569]/[0.12] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475569]/[0.45] dark:bg-white/[0.08] dark:text-white dark:ring-white/20 dark:hover:bg-white/[0.14] dark:focus-visible:ring-white/70"
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                type="button"
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
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
              className="sm:hidden border-t border-[#475569]/[0.18] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_38%,#EEF2F7_72%,#E2E8F0_100%)] shadow-[0_16px_42px_rgba(71,85,105,0.11)] supports-[backdrop-filter]:backdrop-blur-2xl dark:border-white/[0.13] dark:bg-[linear-gradient(90deg,#000000_0%,#111827_100%)] dark:shadow-[0_16px_42px_rgba(0,0,0,0.5)]"
              role="menu"
            >
              <div className="mx-auto max-w-7xl px-3.5 sm:px-5 py-3 pb-[calc(0.875rem+env(safe-area-inset-bottom))] max-h-[calc(100svh-4rem)] overflow-y-auto">
                <div className="grid grid-cols-1 gap-1.5 rounded-[1.25rem] bg-white/62 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ring-1 ring-[#475569]/[0.12] backdrop-blur-xl dark:bg-white/[0.07] dark:ring-white/[0.18]">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.name}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `block min-h-11 w-full rounded-[0.95rem] px-3.5 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475569]/[0.45] dark:focus-visible:ring-white/70 ${
                          isActive
                            ? "bg-white text-[#111827] shadow-sm ring-1 ring-[#475569]/[0.12] dark:bg-white/[0.14] dark:text-white dark:ring-white/[0.16]"
                            : "text-[#475569] hover:bg-white/70 hover:text-[#111827] dark:text-zinc-200 dark:hover:bg-white/[0.09] dark:hover:text-white"
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
                        className="min-h-11 rounded-[0.95rem] bg-[#111827] px-3.5 py-2.5 font-semibold text-white shadow-sm ring-1 ring-[#111827]/[0.10] transition hover:bg-[#475569] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#475569]/[0.50] focus-visible:ring-offset-slate-100 dark:bg-white/[0.92] dark:text-slate-950 dark:hover:bg-white dark:focus-visible:ring-white/80 dark:focus-visible:ring-offset-slate-950"
                        type="button"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setSignupOpen(true);
                          setMenuOpen(false);
                        }}
                        className="min-h-11 rounded-[0.95rem] bg-white/72 px-3.5 py-2.5 font-semibold text-[#111827] shadow-sm ring-1 ring-[#475569]/[0.12] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#475569]/[0.50] focus-visible:ring-offset-slate-100 dark:bg-white/[0.08] dark:text-white dark:ring-white/[0.24] dark:hover:bg-white/[0.14] dark:focus-visible:ring-white/80 dark:focus-visible:ring-offset-slate-950"
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
