import React, { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../Loader/Loader"; // imported Loader
import "react-toastify/dist/ReactToastify.css"; // in case not imported globally
import { Eye, EyeOff } from "lucide-react";

export default function SignUpModal({ isOpen, onClose }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setError("");
    setIsSubmitting(false);
  };

  const handleOverlayClick = () => {
    onClose();
    resetForm();
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!email || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(
        "https://amiwrites-backend-app-2lp5.onrender.com/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username, password }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      localStorage.setItem("token", data.token);
      toast.success("Signup successful! Welcome aboard.");
      window.dispatchEvent(new Event("tokenChanged"));
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
        onClick={handleOverlayClick}
      />
      <div
        className="fixed inset-0 flex justify-center items-center z-50 p-4"
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 relative"
          onClick={handleModalClick}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 text-center">
            Signup
          </h2>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 dark:text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-gray-700 dark:text-gray-300 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
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

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end pt-2 space-x-3 items-center">
              <button
                type="button"
                onClick={handleOverlayClick}
                className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader /> : "Signup"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
