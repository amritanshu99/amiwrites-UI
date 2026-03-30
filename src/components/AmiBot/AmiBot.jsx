import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const Amibot = () => {
  const { pathname } = useLocation();
  const greetings = [
    {
      sender: "bot",
      text: "Hello! I’m AmiBot — here to reflect the world of Amritanshu Mishra.",
    },
    {
      sender: "bot",
      text: "Namaste! I’m AmiBot, your guide to everything Amritanshu Mishra.",
    },
    {
      sender: "bot",
      text: "Hey there! Curious about Amritanshu Mishra? Just ask me.",
    },
    {
      sender: "bot",
      text: "Yo! AmiBot here — your shortcut to knowing Amritanshu better.",
    },
  ];

  const [messages, setMessages] = useState([
    greetings[Math.floor(Math.random() * greetings.length)],
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null); // 🔽 Used to auto-scroll
  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  // 🧭 Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 1 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://amiwrites-backend-app-2lp5.onrender.com/api/amibot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input }),
        }
      );

      const data = await response.json();

      const botReply = data?.botResponse?.response
        ? data.botResponse.response
        : "Hmm, I’m not sure how to answer that. Can you rephrase it?";

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      console.error("API Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <section className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-slate-100 px-3 py-4 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6">
        <header className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-800 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-slate-900/95 dark:to-slate-800/95 dark:shadow-black/30 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
            🤖 Amibot Assistant
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            Meet AmiBot
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            AmiBot is a digital companion crafted to reflect the life and
            personality of{" "}
            <span className="font-semibold text-cyan-700 dark:text-cyan-300">
              Amritanshu Mishra
            </span>
            .
            Ask about hobbies, skills, goals, and more.
          </p>
        </header>

        <div className="flex h-[min(74dvh,760px)] min-h-[440px] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 shadow-xl shadow-slate-200/60 backdrop-blur-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30 sm:h-[min(76dvh,820px)] lg:h-[min(78dvh,860px)]">
          <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
            <h2 className="text-center text-base font-semibold text-slate-800 dark:text-slate-100 sm:text-lg">
              💬 AmiBot — Personal Chat Assistant
            </h2>
          </div>

          {/* 💬 Scrollable Messages Area */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-3 py-4 dark:bg-slate-950/40 sm:px-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md sm:max-w-[82%] md:max-w-[75%] ${
                    msg.sender === "user"
                      ? "bg-cyan-500 text-slate-950"
                      : "border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} /> {/* 🔽 Scroll target */}
          </div>

          {/* 🧾 Input */}
          <div className="border-t border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-5 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 sm:h-12 sm:text-base"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleSend}
                className="h-11 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:hover:bg-cyan-300 sm:h-12 sm:px-6 sm:text-base"
                disabled={loading}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Amibot;
