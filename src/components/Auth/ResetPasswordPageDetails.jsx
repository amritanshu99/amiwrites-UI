import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../Loader/Loader";
import { apiUrl } from "../../config/api";

export default function ResetPasswordPageDetails({ token }) {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);


  const validatePassword = (pwd) => {
    return (
      pwd.length >= 10 &&
      /[A-Z]/.test(pwd) &&
      /[^A-Za-z0-9]/.test(pwd)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (typeof token !== "string" || !token || token.length > 2048) {
      toast.error("Invalid or expired reset link.");
      navigate("/", { replace: true });
      return;
    }

    if (!validatePassword(password)) {
      toast.error("Password must be 10+ characters, include an uppercase & special character.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        apiUrl("/api/auth/reset"),
        {
          newPassword: password,
          token,
        },
        { timeout: 10000 },
      );

      toast.success("Password reset successful! Please login.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 dark:from-black dark:via-black dark:to-black px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-center text-blue-700 dark:text-white">Reset Your Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-new-password" className="block mb-1 text-sm text-gray-700 dark:text-gray-200 font-medium">
                  New Password
                </label>
                <input
                  id="reset-new-password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label htmlFor="reset-confirm-password" className="block mb-1 text-sm text-gray-700 dark:text-gray-200 font-medium">
                  Confirm Password
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition ${
                    loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Password must be at least 10 characters with 1 uppercase and 1 special character.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
