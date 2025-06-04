import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
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

  // Decode token and update login state & messages
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

  // Listen to localStorage 'token' changes (from other tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setToken(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Listen for custom 'tokenChanged' event in the same tab (optional)
  useEffect(() => {
    const onTokenChanged = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("tokenChanged", onTokenChanged);
    return () => window.removeEventListener("tokenChanged", onTokenChanged);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Compose prompt including category for expert-like answers
    const expertPrompt = `Think like a ${category} expert. Respond in detail: ${input.trim()}`;

    // Add user message with prompt
    const userMessage = {
      role: "user",
      content: expertPrompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
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
      const fullText = data.response || "Sorry, I didn't get a response.";

      let index = 0;
      let currentText = "";

      // Simulate typing animation for AI response
      const typingInterval = setInterval(() => {
        if (index < fullText.length) {
          currentText += fullText[index++];
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[updated.length - 1]?.role === "typing") {
              updated[updated.length - 1].content = currentText;
            } else {
              updated.push({ role: "typing", content: currentText });
            }
            return updated;
          });
        } else {
          clearInterval(typingInterval);
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[updated.length - 1]?.role === "typing") {
              updated[updated.length - 1] = { role: "ai", content: fullText };
            }
            return updated;
          });
        }
      }, 20);
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
          <Sparkles
            className="mx-auto text-purple-600 animate-pulse"
            size={36}
          />
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
      <div className="mt-8 px-4 max-w-5xl mx-auto w-full">
        <AIChatHeader
          category={category}
          setCategory={setCategory}
          onPromptClick={(prompt) => setInput(prompt)}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mt-4"
        >
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
            Making Machines Think for You
          </h1>
        </motion.div>
      </div>

      <div className="flex flex-col px-4 py-6 max-w-5xl mx-auto flex-grow overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-2xl max-w-[75%] whitespace-pre-wrap break-words
              ${
                message.role === "user"
                  ? "bg-blue-400 text-white self-end shadow-md"
                  : "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-gray-100 self-start shadow-lg"
              }`}
            style={{ wordBreak: "break-word" }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-base leading-relaxed mb-2">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 dark:bg-zinc-600 px-1 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                li: ({ children }) => (
                  <li className="ml-6 list-disc text-base">{children}</li>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 max-w-5xl mx-auto w-full flex gap-2 items-center bg-white/50 backdrop-blur-md rounded-t-xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask something..."
          className="flex-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 px-4 py-2 rounded-xl text-sm outline-none text-white"
        />

        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AIChat;
