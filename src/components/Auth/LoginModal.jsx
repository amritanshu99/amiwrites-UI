import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "./Modal";
import ResetPasswordForm from "./ResetPasswordForm";
import Loader from "../Loader/Loader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff } from "lucide-react";

export default function LoginModal({ isOpen, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const rememberedUsername = localStorage.getItem("rememberedUsername");
      if (rememberedUsername) {
        setUsername(rememberedUsername);
        setRememberMe(true);
      }
    } else {
      setUsername("");
      setPassword("");
      setRememberMe(false);
      setError("");
      setInfo("");
      setShowResetForm(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleLogin = async () => {
    setError("");
    setInfo("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://amiwrites-backend-app-1.onrender.com/api/auth/login",
        { username, password }
      );

      const { token } = response.data;
      localStorage.setItem("token", token);

      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      toast.success("Login successful! Welcome back.");
      window.dispatchEvent(new Event("tokenChanged"));
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Invalid username or password.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (email) => {
    setError("");
    setInfo("");

    try {
      await axios.post(
        "https://amiwrites-backend-app-1.onrender.com/api/auth/request-reset",
        { email }
      );

      toast.success("Reset link sent. Check your email.");
      setShowResetForm(false);
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to send reset link.";
      setError(message);
      toast.error("Failed to send reset link.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !showResetForm) {
      handleLogin();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showResetForm ? "Reset Password" : "Login"}
    >
      {showResetForm ? (
        <ResetPasswordForm
          onBack={() => {
            setShowResetForm(false);
            setError("");
            setInfo("");
          }}
          onSubmit={handleResetPasswordSubmit}
        />
      ) : (
        <div
          className="space-y-5 px-2 py-1"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Username
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="accent-blue-600"
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-gray-800 dark:text-gray-300"
            >
              Remember Me
            </label>
          </div>

          {/* Error / Info */}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          {/* Login Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogin}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              disabled={isLoading}
            >
              Login
            </button>
            {isLoading && <Loader />}
          </div>

          {/* Forgot Password */}
          <div className="text-center">
            <button
              onClick={() => {
                setShowResetForm(true);
                setError("");
                setInfo("");
              }}
              className="text-sm text-blue-500 hover:underline mt-1"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
