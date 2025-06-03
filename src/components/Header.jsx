import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";
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

  const location = useLocation();
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    if (token) {
      const decoded = parseJwt(token);
      setUsername(decoded?.username || null);
    } else {
      setUsername(null);
    }
  }, [loginOpen, signupOpen]);

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

  const navLinks = [
    { name: "My Portfolio", to: "/" },
    { name: "My Blog", to: "/blog" },
    { name: "AI Chat", to: "/ai-chat" },
    { name: "Tech Byte", to: "/tech-byte" },
  ];

  const handleLogout = async () => {
    if (!setLoading) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setUsername(null);
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
      <header className="bg-gradient-to-r from-sky-100 via-rose-100 to-lime-100 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50 px-6 py-3 w-full">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight hover:scale-105 hover:text-sky-600 transition cursor-pointer select-none"
          >
            AmiVerse
          </Link>

          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className={`relative text-base font-medium transition duration-300 pb-1 ${
                  isActive(link.to)
                    ? "text-sky-700 after:scale-x-100"
                    : "text-gray-700 hover:text-sky-600"
                } after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-sky-500 after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative ml-4" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="p-2 rounded-full hover:bg-gray-200 transition text-gray-800"
                  aria-label="User menu"
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
                      className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 origin-top-right"
                    >
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        Hi, <span className="font-medium">{username}</span>!
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-x-2 ml-4">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => setSignupOpen(true)}
                  className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-700 hover:text-sky-700 transition ml-3"
              aria-label="Toggle menu"
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
              className="md:hidden bg-white border-t border-gray-200 px-6 pb-4 pt-2 origin-top"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 text-base font-medium rounded-md transition ${
                    isActive(link.to)
                      ? "text-sky-700 bg-sky-100"
                      : "text-gray-700 hover:text-sky-600"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
