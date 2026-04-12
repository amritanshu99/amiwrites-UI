import React, { useEffect, useRef, useState } from "react";
import { Bot, SendHorizontal, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

const GREETINGS = [
  {
    sender: "bot",
    text: "Hello! I'm AmiBot, here to reflect the world of Amritanshu Mishra.",
  },
  {
    sender: "bot",
    text: "Namaste! I'm AmiBot, your guide to everything Amritanshu Mishra.",
  },
  {
    sender: "bot",
    text: "Hey there! Curious about Amritanshu Mishra? Just ask me.",
  },
  {
    sender: "bot",
    text: "AmiBot is ready. Ask about projects, skills, writing, or goals.",
  },
];

const PROMPT_SUGGESTIONS = [
  "Tell me about Amritanshu's projects",
  "What are his strongest skills?",
  "How does he approach learning and growth?",
  "What goals is he focused on right now?",
];

const HIGHLIGHTS = [
  {
    eyebrow: "Projects",
    value: "Products, experiments, and practical problem-solving.",
  },
  {
    eyebrow: "Writing",
    value: "Blogs, technical reflections, and ideas worth exploring.",
  },
  {
    eyebrow: "Mindset",
    value: "Goals, discipline, and the way he keeps improving.",
  },
];

const Amibot = () => {
  const { pathname } = useLocation();
  const [messages, setMessages] = useState(() => [
    GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    if ((messages.length > 1 || loading) && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [loading, messages]);

  const handleSuggestionClick = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const query = input.trim();
    if (!query || loading) return;

    const userMessage = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://amiwrites-backend-app-2lp5.onrender.com/api/amibot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );

      const data = await response.json();

      const botReply = data?.botResponse?.response
        ? data.botResponse.response
        : "Hmm, I'm not sure how to answer that. Can you rephrase it?";

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <section className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden bg-[linear-gradient(180deg,rgba(252,254,255,1)_0%,rgba(241,248,255,0.98)_42%,rgba(235,245,255,0.96)_100%)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-slate-900 transition-colors duration-300 dark:bg-[linear-gradient(180deg,rgba(2,6,23,1)_0%,rgba(2,6,23,0.98)_35%,rgba(0,0,0,1)_100%)] dark:text-zinc-100 sm:px-5 sm:pb-5 sm:pt-4 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.85),transparent_28%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.45),transparent_24%),radial-gradient(circle_at_bottom,rgba(224,242,254,0.72),transparent_38%)] dark:hidden" />
        <div className="absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_28%)]" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-sky-200/70 blur-[120px] dark:bg-cyan-400/15" />
        <div className="absolute -right-10 top-16 h-80 w-80 rounded-full bg-cyan-100/80 blur-[140px] dark:bg-blue-500/12" />
        <div className="absolute bottom-[-9rem] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-blue-100/70 blur-[170px] dark:bg-cyan-300/10" />
        <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-[0.16] dark:[background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-5.5rem)] max-w-7xl flex-col gap-3 lg:h-[calc(100dvh-5.5rem)] lg:min-h-0 lg:flex-row lg:gap-4">
        <aside className="relative overflow-hidden rounded-[30px] border border-white/85 bg-[linear-gradient(155deg,rgba(255,255,255,0.96),rgba(247,251,255,0.94),rgba(236,246,255,0.92))] p-4 shadow-[0_32px_80px_-46px_rgba(15,23,42,0.22)] ring-1 ring-sky-100/70 backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(10,15,30,0.92),rgba(3,7,18,0.98),rgba(2,6,23,1))] dark:ring-white/5 dark:shadow-[0_32px_90px_-42px_rgba(0,0,0,0.94)] sm:p-5 lg:flex lg:w-[360px] lg:max-w-[380px] lg:flex-col">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent dark:via-cyan-300/80" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.45)] dark:bg-cyan-300 dark:shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                AmiBot
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-200/80 bg-white/75 text-sky-700 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-cyan-100">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2rem]">
              Meet AmiBot
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-zinc-300 sm:text-[15px]">
              A more refined assistant experience for exploring the work, story,
              and growth of{" "}
              <span className="font-semibold text-sky-700 dark:text-cyan-200">
                Amritanshu Mishra
              </span>
              . Clean in light mode, crisp in dark mode, and easier to use
              across laptop and mobile screens.
            </p>
          </div>

          <div className="relative mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
              Suggested prompts
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {PROMPT_SUGGESTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSuggestionClick(prompt)}
                  className="rounded-2xl border border-white/85 bg-white/80 px-3.5 py-3 text-left text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-sky-50/95 hover:text-sky-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:shadow-none dark:hover:border-cyan-300/30 dark:hover:bg-cyan-300/10 dark:hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-5 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.eyebrow}
                className="rounded-2xl border border-white/85 bg-white/72 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
                  {item.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="relative mt-5 rounded-[24px] border border-sky-100/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,249,255,0.92))] p-4 shadow-[0_18px_40px_-30px_rgba(56,189,248,0.35)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(10,15,30,0.92),rgba(4,9,20,0.98))] dark:shadow-[0_20px_48px_-34px_rgba(0,0,0,0.88)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-200">
              Experience
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-200">
              Faster scanning, better contrast, roomier chat space, and a more
              premium visual rhythm throughout the interface.
            </p>
          </div>
        </aside>

        <div className="relative flex min-h-[68dvh] flex-1 flex-col overflow-hidden rounded-[30px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,252,255,0.92),rgba(242,249,255,0.9))] shadow-[0_32px_90px_-46px_rgba(15,23,42,0.22)] ring-1 ring-sky-100/70 backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(5,10,24,0.96),rgba(2,6,23,0.97),rgba(0,0,0,0.98))] dark:ring-white/5 dark:shadow-[0_32px_100px_-44px_rgba(0,0,0,0.96)] lg:min-h-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/75 to-transparent dark:via-white/30" />

          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 dark:border-white/10 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-sky-200 bg-white/85 text-sky-700 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-cyan-100">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
                  Live Conversation
                </p>
                <h2 className="truncate text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
                  AmiBot Personal Chat Assistant
                </h2>
                <p className="hidden text-sm text-slate-500 dark:text-zinc-400 sm:block">
                  Ask about projects, writing, skills, goals, or personal
                  growth.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)] dark:bg-emerald-300 dark:shadow-[0_0_14px_rgba(134,239,172,0.75)]" />
              Online
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.2),transparent_32%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_32%)]" />

            <div
              aria-live="polite"
              className="relative flex h-full flex-col gap-4 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6"
              role="log"
            >
              {messages.map((message, index) => {
                const isUser = message.sender === "user";

                return (
                  <div
                    key={`${message.sender}-${index}`}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[94%] sm:max-w-[82%] md:max-w-[72%]">
                      <div
                        className={`mb-1.5 flex items-center gap-2 ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">
                          {isUser ? "You" : "AmiBot"}
                        </span>
                      </div>

                      <div
                        className={`rounded-[24px] border px-4 py-3 text-sm leading-7 sm:px-5 sm:text-[15px] ${
                          isUser
                            ? "border-sky-300/30 bg-gradient-to-br from-sky-400 via-cyan-400 to-cyan-500 text-slate-950 shadow-[0_22px_50px_rgba(56,189,248,0.24)]"
                            : "border-white/85 bg-white/88 text-slate-700 shadow-[0_18px_45px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-100 dark:shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[94%] sm:max-w-[82%] md:max-w-[72%]">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">
                        AmiBot
                      </span>
                    </div>
                    <div className="rounded-[24px] border border-white/85 bg-white/88 px-4 py-3 text-slate-700 shadow-[0_18px_45px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300 [animation-delay:-0.3s] dark:bg-cyan-200" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s] dark:bg-cyan-300" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 dark:bg-cyan-400" />
                        </div>
                        <span className="text-sm text-slate-500 dark:text-zinc-300">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          <form
            className="border-t border-slate-200/80 bg-white/65 px-2.5 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/45 sm:px-5 sm:py-4"
            onSubmit={handleSubmit}
          >
            <div className="rounded-[24px] border border-white/85 bg-white/85 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden h-12 w-12 items-center justify-center rounded-[18px] border border-sky-200 bg-white/80 text-sm font-semibold uppercase tracking-[0.3em] text-sky-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-cyan-100 sm:flex">
                  AI
                </div>

                <input
                  ref={inputRef}
                  aria-label="Type your message"
                  autoComplete="off"
                  className="h-12 flex-1 rounded-[18px] border border-transparent bg-transparent px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300/60 focus:outline-none focus:ring-4 focus:ring-sky-100 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/25 dark:focus:ring-cyan-300/15 sm:px-4 sm:text-base"
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask AmiBot anything..."
                  type="text"
                  value={input}
                />

                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-sky-500 via-cyan-500 to-cyan-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(14,165,233,0.28)] transition duration-200 hover:from-sky-600 hover:via-cyan-600 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-55 dark:text-slate-950 sm:px-5 sm:text-base"
                  disabled={!canSend}
                  type="submit"
                >
                  <SendHorizontal className="h-4 w-4" />
                  <span>{loading ? "Sending..." : "Send"}</span>
                </button>
              </div>
            </div>

            <p className="px-2 pt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
              Ask about projects, writing, skills, goals, or personal growth.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Amibot;
