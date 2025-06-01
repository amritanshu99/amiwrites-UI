import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "./Modal";
import ResetPasswordForm from "./ResetPasswordForm";
import Loader from "./Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginModal({ isOpen, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setUsername("");
      setPassword("");
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
        {
          username,
          password,
        }
      );

      const { token } = response.data;
      localStorage.setItem("token", token);

      toast.success("Login successful! Welcome back.");
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Invalid username or password";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (email) => {
    setError("");
    setInfo("");
    try {
      await axios.post("https://amiwrites-backend-app-1.onrender.com/api/auth/request-reset", { email });

      toast.success("Reset link sent. Check your email.");
      setShowResetForm(false);
      onClose(); // Close modal on success
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to send reset link";
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
    <>
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
          <div className="space-y-4 p-2" onKeyDown={handleKeyDown} tabIndex={-1}>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Username</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {info && <p className="text-green-600 text-sm">{info}</p>}

            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogin}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isLoading}
              >
                Login
              </button>
              {isLoading && <Loader />}
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setShowResetForm(true);
                  setError("");
                  setInfo("");
                }}
                className="text-sm text-blue-600 hover:underline mt-2"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          </div>
        )}
      </Modal>

    </>
  );
}
