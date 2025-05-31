import { useState } from "react";
import axios from "axios";
import Modal from "./Modal";
import ResetPasswordForm from "./ResetPasswordForm";

export default function LoginModal({ isOpen, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [info, setInfo] = useState("");

  const handleLogin = async () => {
    setError("");
    setInfo("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });

      const { token } = response.data;
      localStorage.setItem("token", token);
      onClose();
    } catch (err) {
      // axios error message extraction
      const message =
        err.response?.data?.message || err.message || "Invalid username or password";
      setError(message);
    }
  };

  const handleResetPasswordSubmit = async (email) => {
    setError("");
    setInfo("");
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", { email });
      setInfo("Reset link sent to your email.");
      setShowResetForm(false);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to send reset link";
      setError(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowResetForm(false);
        setError("");
        setInfo("");
        onClose();
      }}
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
        <div className="space-y-4 p-2">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Username</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
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
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {info && <p className="text-green-600 text-sm">{info}</p>}

          <button
            onClick={handleLogin}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>

          <div className="text-center">
            <button
              onClick={() => {
                setShowResetForm(true);
                setError("");
                setInfo("");
              }}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
