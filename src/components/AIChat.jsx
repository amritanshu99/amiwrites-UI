import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
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
        setMessages([
          {
            role: "ai",
            content: `Hello! ${decoded.username}, how can I help you today?`,
          },
        ]);
        return;
      }
    }
    setUsername("");
    setIsLoggedIn(false);
    setMessages([{ role: "ai", content: "Hello! How can I help you today?" }]);
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: `(${category}) ${input.trim()}`,
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Call your API with prompt as the input (without category prefix)
      const response = await fetch(
        "https://amiwrites-backend-app-1.onrender.com/api/gemini/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: input.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response message
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.response || "Sorry, I didn't get a response.",
        },
      ]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Sorry, something went wrong while fetching the response. Please try again later.",
        },
      ]);
    }
  };

  if (!isLoggedIn) {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
          <Sparkles className="mx-auto text-purple-600 animate-pulse" size={36} />
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-white">
            Welcome to AI Chat
          </h1>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            Please log in to start chatting.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200">
      <div className="mt-8 mb-2 px-4 max-w-5xl mx-auto w-full">
        <AIChatHeader
          category={category}
          setCategory={setCategory}
          onPromptClick={(prompt) => setInput(prompt)}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mt-4 px-2"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-800 dark:text-white leading-tight">
            Making Machines Think for You
          </h1>
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-4 w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-white dark:bg-zinc-900 p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col h-[30vh] sm:h-[35vh] md:h-[40vh] max-h-[40vh] overflow-y-auto"
        >
          <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700 scrollbar-thumb-rounded">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`px-4 py-2 rounded-xl max-w-[80%] text-xs sm:text-sm md:text-base whitespace-pre-line break-words ${
                  msg.role === "user"
                    ? "bg-blue-100 dark:bg-blue-700 text-blue-900 dark:text-white self-end"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-white self-start"
                }`}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </motion.div>

        {/* AI Disclaimer */}
        <p className="mt-2 text-center text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 max-w-xl">
          ⚠️ <strong>Disclaimer:</strong> This AI chat is for informational purposes only and not a substitute for professional advice.
        </p>

        {/* Input + Send */}
        <div className="mt-4 w-full max-w-5xl flex flex-col items-center">
          <div className="w-full flex items-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-full px-3 py-2 shadow-md">
            <input
              className="flex-1 bg-transparent outline-none px-3 py-2 text-xs sm:text-sm md:text-base text-zinc-800 dark:text-white placeholder-zinc-500"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              aria-label="Chat input"
            />
            <button
              onClick={handleSend}
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
