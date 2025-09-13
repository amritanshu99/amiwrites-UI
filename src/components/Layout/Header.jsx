import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, UserCircle } from "lucide-react";
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

export default function Header({ setLoading }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const location = useLocation();
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const userButtonRef = useRef(null);

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
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menus with Escape
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

  const navLinks = [
    { name: "My Portfolio", to: "/" },
    { name: "My Blogs", to: "/blogs" },
    { name: "AmiBot", to: "/amibot" },
    { name: "Tech Byte", to: "/tech-byte" },
    { name: "AI Tools", to: "/ai-tools" },
    { name: "Task Manager", to: "/task-manager" },
    { name: "AI Chat", to: "/ai-chat" },
    // { name: "Reinforcement Learning", to: "/Reinforcement-Learning" },
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

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header
        className="bg-gradient-to-r from-sky-100 via-pink-100 to-lime-100 
       dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-black 
       border-b border-gray-200 dark:border-gray-600 
       shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] 
       sticky top-0 z-50 px-6 py-3 w-full"
      >
        <div className="flex flex-wrap justify-between items-center gap-y-4">
          {/* Brand: favicon + title */}
          <Link
            to="/"
            className="group flex items-center gap-2 select-none cursor-pointer"
            aria-label="AmiVerse Home"
          >
            <img
              src="/favicon.ico"
              alt="AmiVerse logo"
              className="h-10 w-10 sm:h-7 sm:w-7 rounded-xl object-contain 
             ring-1 ring-black/10 dark:ring-white/20 shadow-sm
             transition-transform duration-300 md:group-hover:rotate-6 md:group-hover:scale-[1.05]"
              draggable="false"
            />
            <span
              className="hidden sm:inline text-2xl font-semibold tracking-tight text-gray-900 dark:text-white 
                         transition-colors duration-300 group-hover:text-sky-700 dark:group-hover:text-cyan-300"
            >
              AmiVerse
            </span>
          </Link>

          <nav
            className="hidden md:flex flex-wrap gap-x-6"
            aria-label="Primary"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className={`relative text-base font-medium transition duration-300 pb-1 ${
                  isActive(link.to)
                    ? "text-sky-700 dark:text-cyan-300 after:scale-x-100"
                    : "text-gray-700 hover:text-sky-600 dark:text-gray-300 dark:hover:text-cyan-400"
                } after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-sky-500 after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100`}
                aria-current={isActive(link.to) ? "page" : undefined}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label="Toggle Dark Mode"
              type="button"
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 5a7 7 0 000 14 7 7 0 000-14z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-800 dark:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  ref={userButtonRef}
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-800 dark:text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  aria-label="User menu"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-controls="user-menu"
                  type="button"
                >
                  <UserCircle size={32} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      key="dropdown"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      id="user-menu"
                      role="menu"
                      aria-labelledby="user-menu-button"
                      className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 origin-top-right"
                    >
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        Hi, <span className="font-medium">{username}</span>!
                      </div>
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        type="button"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
                  type="button"
                >
                  Login
                </button>
                <button
                  onClick={() => setSignupOpen(true)}
                  className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
                  type="button"
                >
                  Sign Up
                </button>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-700 dark:text-gray-200 hover:text-sky-700 dark:hover:text-cyan-400 transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              type="button"
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              ref={mobileMenuRef}
              key="mobile-menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              id="mobile-menu"
              className="md:hidden bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-gray-700 px-6 pb-4 pt-2 origin-top"
              role="menu"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 text-base font-medium rounded-md transition ${
                    isActive(link.to)
                      ? "text-sky-700 bg-sky-100 dark:bg-gray-800"
                      : "text-gray-700 dark:text-gray-300 hover:text-sky-600 dark:hover:text-cyan-400"
                  }`}
                  role="menuitem"
                  aria-current={isActive(link.to) ? "page" : undefined}
                >
                  {link.name}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => {
                      setLoginOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
                    type="button"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setSignupOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
                    type="button"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
