import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Loader from "./Loader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ContactMeButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", reason: "" });

  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/message.mp3");
    audioRef.current.load();
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((err) => console.error("Audio play failed:", err));
    }
  };

  const handleOpen = () => {
    playSound();
    setOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "https://amiwrites-backend-app-1.onrender.com/api/contact",
        form
      );
      if (response.status === 200 || response.status === 201) {
        toast.success(
          "Your request is submitted. We will get back to you shortly."
        );
        setForm({ name: "", email: "", reason: "" });
        setOpen(false);
      } else {
        toast.error("Something went wrong, please try again later.");
      }
    } catch (error) {
      console.error("API error:", error);
      toast.error("Failed to send your message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        aria-label="Contact Me"
        className="fixed bottom-5 right-5 z-50 group
             inline-flex items-center justify-center
             px-4 py-2.5 sm:px-5 sm:py-3
             rounded-full
             bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600
             text-white text-sm font-medium tracking-wide
             shadow-md hover:shadow-xl
             border border-white/10
             transition-all duration-300 ease-in-out
             hover:scale-105 active:scale-100
             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300
             dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700
             dark:border-white/20"
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          ✉️ <span>Contact Me</span>
        </span>

        {/* Optional subtle shimmer overlay on hover */}
        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 dark:bg-white/20 blur-sm pointer-events-none"></span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 animate-fadeIn backdrop-blur-xl transition-transform duration-300 scale-95 hover:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-1">
              Let’s Connect
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              I'd love to hear from you. Please fill in your details below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-gray-700 dark:text-gray-200 font-medium"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder:text-gray-400"
                  placeholder="Your Name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-gray-700 dark:text-gray-200 font-medium"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder:text-gray-400"
                  placeholder="you@example.com"
                />
              </div>

              {/* Reason Field */}
              <div>
                <label
                  htmlFor="reason"
                  className="block text-gray-700 dark:text-gray-200 font-medium"
                >
                  Reason to Connect
                </label>
                <textarea
                  name="reason"
                  id="reason"
                  value={form.reason}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  rows="3"
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none placeholder:text-gray-400"
                  placeholder="Your message here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 items-center pt-4">
                {loading && <Loader />}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
