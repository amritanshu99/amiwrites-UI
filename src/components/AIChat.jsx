import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, User, Sparkles } from "lucide-react";
import AIChatHeader from "./AIChatHeader";

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const AIChat = () => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("Mental Well-being");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.username) {
        setUsername(decoded.username);
        setIsLoggedIn(true);
        return;
      }
    }
    setUsername("");
    setIsLoggedIn(false);
  }, [token]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setToken(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onTokenChanged = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("tokenChanged", onTokenChanged);
    return () => window.removeEventListener("tokenChanged", onTokenChanged);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = {
      role: "user",
      content: `(${category}) ${input.trim()}`,
    };
    // Mock AI reply - replace with real API call
    const aiReply = {
      role: "ai",
      content: `Here's a response for "${category}":\nStay calm and take deep breaths. (mock response)`,
    };
    setMessages((prev) => [...prev, userMessage, aiReply]);
    setInput("");
  };

  if (!isLoggedIn) {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
          <Sparkles className="mx-auto text-purple-600 animate-pulse" size={36} />
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
            Welcome to AI Chat
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Please log in to start chatting.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200">
      <div className="mt-10 mb-2 px-4 max-w-5xl mx-auto w-full">
        <AIChatHeader
          category={category}
          setCategory={setCategory}
          onPromptClick={(prompt) => setInput(prompt)}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mt-6 px-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-800 dark:text-white leading-tight">
            Making Machines Think for You
          </h1>
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 mt-1 max-w-md mx-auto">
            Your personal AI-powered well-being companion
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="
            w-full
            bg-white dark:bg-zinc-900
            p-4 sm:p-6 md:p-8
            rounded-3xl
            shadow-2xl
            flex flex-col
            h-[45vh] sm:h-[50vh] md:h-[55vh] lg:h-[60vh]
            max-h-[600px]
          "
        >
          <div className="text-center text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 mb-2">
            <User size={18} />
            Logged in as <span className="font-medium truncate max-w-xs">{username}</span>
          </div>

          <div
            className="
              flex-1
              overflow-y-auto
              p-4
              bg-zinc-50 dark:bg-zinc-800
              rounded-xl
              space-y-4
              scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-transparent
              scroll-smooth
            "
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`whitespace-pre-wrap px-4 py-3 rounded-xl text-sm md:text-base max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 self-end ml-auto"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 self-start mr-auto"
                }`}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="mt-4 flex flex-row items-center gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="
                flex-shrink-0
                flex-grow
                px-4 py-2
                rounded-full
                border border-gray-300 dark:border-gray-700
                bg-white dark:bg-zinc-800
                text-gray-800 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-purple-400
                text-sm
                sm:text-base
              "
              autoFocus
              aria-label="Type your message"
            />
            <button
              type="submit"
              className="
                bg-purple-500 hover:bg-purple-600 text-white
                w-10 h-10
                rounded-full
                transition
                flex items-center justify-center
                flex-shrink-0
              "
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AIChat;
