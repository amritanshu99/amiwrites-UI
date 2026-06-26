import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Loader from "../Loader/Loader";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Home, Mail, MessageCircle, Send } from "lucide-react";
import { apiUrl } from "../../config/api";

export default function ContactMeButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", reason: "" });

  const audioRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const isExpanded = !collapsed || hovered;
  const isAmiBotRoute = pathname === "/amibot" || pathname === "/amibot-admin";

  useEffect(() => {
    audioRef.current = new Audio("/sounds/message.mp3");
    audioRef.current.load();
  }, []);

  useEffect(() => {
    const openFromFooter = () => {
      setOpen(true);
      playSound();
    };

    window.addEventListener("open-contact-modal", openFromFooter);
    return () => window.removeEventListener("open-contact-modal", openFromFooter);
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

  const handleChatWithAmiBot = () => {
    setOpen(false);
    navigate("/amibot");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        apiUrl("/api/contact"),
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

  if (isAmiBotRoute) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Contact Me"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          group fixed bottom-[calc(4.9rem+env(safe-area-inset-bottom))] right-4 z-[90]
          inline-flex min-h-14 items-center overflow-hidden rounded-full
          border border-white/25 bg-slate-950/95 font-semibold text-white
          shadow-[0_18px_42px_rgba(2,6,23,0.28),0_0_0_1px_rgba(255,255,255,0.08)]
          outline-none ring-1 ring-sky-200/25 backdrop-blur-2xl
          transition-all duration-500 ease-out hover:-translate-y-0.5
          hover:shadow-[0_22px_52px_rgba(14,116,144,0.35),0_0_0_1px_rgba(255,255,255,0.16)]
          focus-visible:ring-2 focus-visible:ring-cyan-300 active:translate-y-0
          dark:border-cyan-100/10 dark:bg-slate-950/95 dark:ring-cyan-100/10
          md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] md:right-6
          ${isExpanded ? "w-40 justify-start px-4 py-2.5" : "w-14 justify-center px-0 py-0"}
        `}
        style={{
          transitionProperty: "width, padding, background-color, box-shadow",
        }}
      >
        <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.95),rgba(20,184,166,0.76)_48%,rgba(15,23,42,0.92))] opacity-95 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[linear-gradient(135deg,rgba(7,89,133,0.96),rgba(13,148,136,0.68)_50%,rgba(2,6,23,0.98))] dark:opacity-100" />
        <span className="absolute inset-x-3 top-0 h-px bg-white/[0.55] dark:bg-cyan-100/24" />
        <span className="absolute -inset-1 rounded-full bg-cyan-300/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100 dark:bg-cyan-500/10 dark:group-hover:opacity-80" />
        <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.16] ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-105 dark:bg-black/20 dark:ring-cyan-100/20">
          <MessageCircle size={19} strokeWidth={2.2} />
        </span>

        {isExpanded && (
          <span
            className="relative z-10 ml-2 whitespace-nowrap text-sm tracking-wide text-white opacity-100 transition-opacity duration-300"
            style={{ transitionDelay: "100ms" }}
          >
            Contact Me
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.55] bg-white/[0.92] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 backdrop-blur-2xl transition-transform duration-300 animate-fade-in dark:border-cyan-100/10 dark:bg-zinc-950/[0.92] dark:shadow-[0_30px_90px_rgba(0,0,0,0.68)] dark:ring-white/10 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(14,165,233,0.14),rgba(255,255,255,0))] dark:bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(9,9,11,0))]" />
            <div className="relative mb-6 flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-200/15">
                <Mail size={22} strokeWidth={2.1} />
              </span>
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Let's Connect
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
                  I'd love to hear from you. Please fill in your details below.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-5 text-sm">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block font-medium text-slate-700 dark:text-zinc-200"
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
                  className="w-full rounded-xl border border-slate-200 bg-white/[0.78] px-3.5 py-2.5 text-slate-900 shadow-inner shadow-slate-100/60 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/45 dark:focus:bg-white/[0.08] dark:focus:ring-cyan-300/10"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block font-medium text-slate-700 dark:text-zinc-200"
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
                  className="w-full rounded-xl border border-slate-200 bg-white/[0.78] px-3.5 py-2.5 text-slate-900 shadow-inner shadow-slate-100/60 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/45 dark:focus:bg-white/[0.08] dark:focus:ring-cyan-300/10"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="mb-1.5 block font-medium text-slate-700 dark:text-zinc-200"
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
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white/[0.78] px-3.5 py-2.5 text-slate-900 shadow-inner shadow-slate-100/60 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/45 dark:focus:bg-white/[0.08] dark:focus:ring-cyan-300/10"
                  placeholder="Your message here..."
                />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleChatWithAmiBot}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm font-semibold text-sky-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-100 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-300/15 dark:bg-cyan-300/10 dark:text-cyan-100 dark:hover:bg-cyan-300/15 dark:focus:ring-cyan-300/10"
              >
                <Bot size={17} strokeWidth={2.1} />
                Feeling shy? Chat with AmiBot instead
              </button>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
                {loading && <Loader />}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.1] dark:focus:ring-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_30px_rgba(15,23,42,0.24)] focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus:ring-cyan-300/15"
                >
                  <Send size={15} strokeWidth={2.2} />
                  Submit
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    navigate("/");
                    setOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(5,150,105,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-emerald-300/15"
                >
                  <Home size={15} strokeWidth={2.2} />
                  Home
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
