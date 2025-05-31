import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, [loginOpen, signupOpen]);

  const navLinks = [
    { name: "My Portfolio", to: "/" },
    { name: "My Blog", to: "/blog" },
    { name: "AI Chat", to: "/ai-chat" },
  ];

  if (isAuthenticated) {
    navLinks.push({ name: "Add Blog", to: "/add-blog" });
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="bg-gradient-to-r from-sky-100 via-rose-100 to-lime-100 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50 px-6 py-3 transition-all duration-300 w-full">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-sky-700 hover:text-sky-900 transition duration-300"
          >
            Amritanshu
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

          {/* Auth Buttons */}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 flex items-center gap-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
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

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-6 pb-4 pt-2 animate-fade-in-down">
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
          </div>
        )}
      </header>

      {/* Modals */}
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
