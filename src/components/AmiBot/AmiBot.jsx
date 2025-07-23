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
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-[#0a0a0a] dark:via-[#111111] dark:to-black p-6 transition-colors duration-500">
      <div className="max-w-2xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-[#1a1a1a] dark:via-[#111111] dark:to-black text-gray-900 dark:text-gray-100 text-center py-5 px-6 rounded-2xl shadow-xl ring-1 ring-black/10 dark:ring-white/10 transition-colors duration-500">
          <h1 className="text-3xl font-bold mb-2 tracking-wide drop-shadow-sm dark:drop-shadow-lg">
            🤖 Meet AmiBot
          </h1>
          <p className="text-base sm:text-lg font-medium leading-relaxed text-gray-800 dark:text-gray-300">
            AmiBot is a digital companion crafted to reflect the life and
            personality of{" "}
            <span className="text-purple-700 dark:text-yellow-300 font-semibold">
              Amritanshu Mishra
            </span>
            .
            <br />
            Questions can be asked about his <em>hobbies</em>, <em>skills</em>,
            <em> dreams</em>, <em>goals</em>, and more.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto h-[50vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-4">
          💬 AmiBot - Personal Chat Assistant
        </h1>

        {/* 💬 Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-xl px-4 py-2 max-w-[75%] text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700 text-gray-800 dark:text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-2 max-w-[75%] text-sm bg-zinc-200 dark:bg-zinc-700 text-gray-800 dark:text-white">
                Typing...
              </div>
            </div>
          )}
          <div ref={bottomRef} /> {/* 🔽 Scroll target */}
        </div>

        {/* 🧾 Input */}
        <div className="flex items-center mt-4">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-l-xl bg-white dark:bg-zinc-800 dark:text-white focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-xl hover:bg-blue-700"
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Amibot;
