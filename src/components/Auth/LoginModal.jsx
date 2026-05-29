import { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./Modal";
import ResetPasswordForm from "./ResetPasswordForm";
import Loader from "../Loader/Loader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff } from "lucide-react";
import { apiUrl } from "../../config/api";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 shadow-inner shadow-slate-100/70 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/50 dark:focus:bg-white/[0.08] dark:focus:ring-cyan-300/10";

const labelClass =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-200";

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
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleLogin = async (e) => {
    e?.preventDefault();

    if (isLoading) return;

    setError("");
    setInfo("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        apiUrl("/api/auth/login"),
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
        apiUrl("/api/auth/request-reset"),
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
      throw new Error(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showResetForm ? "Reset Password" : "Login"}
      closeDisabled={isLoading}
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
        <form className="space-y-5" onSubmit={handleLogin} noValidate>
          <div>
            <label htmlFor="login-username" className={labelClass}>
              Username
            </label>
            <input
              id="login-username"
              type="text"
              className={inputClass}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="login-password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`${inputClass} pr-11`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-1.5 right-2 inline-flex w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-cyan-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-slate-300 accent-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20"
            />
            <label
              htmlFor="rememberMe"
              className="text-sm font-medium text-slate-700 dark:text-zinc-300"
            >
              Remember Me
            </label>
          </div>

          <div aria-live="polite" className="min-h-5">
            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {info}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/15"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Loader size="small" label="Logging in" />
                <span>Logging in</span>
              </>
            ) : (
              "Login"
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowResetForm(true);
                setError("");
                setInfo("");
              }}
              className="rounded-lg px-2 py-1 text-sm font-medium text-sky-700 transition hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-cyan-200 dark:hover:text-cyan-100 dark:focus-visible:ring-cyan-300"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
