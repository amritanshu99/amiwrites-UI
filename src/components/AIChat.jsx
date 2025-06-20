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
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("Mental Well-being");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.username) {
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
    setIsLoggedIn(false);
    setMessages([{ role: "ai", content: "Hello! How can I help you today?" }]);
  }, [token]);

  useEffect(() => {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
    document.title = "AI Chat";
    const onStorage = (e) => {
      if (e.key === "token") setToken(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const onTokenChanged = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("tokenChanged", onTokenChanged);
    return () => window.removeEventListener("tokenChanged", onTokenChanged);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const expertPrompt = `Think like a ${category} expert. Limit answer to 200 words. Respond in detail: ${input.trim()}`;

    const userMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "typing", content: "..." },
    ]);
    setInput("");

    try {
      const response = await fetch(
        "https://amiwrites-backend-app-1.onrender.com/api/gemini/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: expertPrompt }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const fullText = data.response || "Sorry, I didn't get a response.";
      let index = 0;
      let currentText = "";

      const typingInterval = setInterval(() => {
        if (index < fullText.length) {
          currentText += fullText[index++];
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[updated.length - 1]?.role === "typing") {
              updated[updated.length - 1].content = currentText;
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
        ...prev.slice(0, -1),
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
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-black dark:via-black dark:to-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
          <Sparkles
            className="mx-auto text-purple-600 animate-pulse"
            size={36}
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-800">
            Welcome to AI Chat
          </h1>
          <p className="text-xs sm:text-sm text-gray-700">
            Please log in to start chatting.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-black dark:via-black dark:to-black min-h-screen py-10 px-4 sm:px-6 lg:px-8">
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
       <h2 className="text-3xl font-bold text-zinc-500">
            Making Machines Think For YOU
          </h2>
          <span className="text-sm text-gray-600 italic tracking-tight">
            ⚠️ AI-generated content — use discretion.
          </span>
        </motion.div>

        <div className="mt-6 space-y-4 max-h-[50vh] overflow-y-auto p-4 rounded-xl bg-white/80 shadow-inner">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`whitespace-pre-wrap text-sm sm:text-base ${
                msg.role === "ai"
                  ? "text-left text-zinc-800"
                  : "text-right text-blue-700"
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={`Ask something about ${category}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-grow p-3 rounded-full shadow-md focus:outline-none bg-white/90 text-gray-900 text-sm sm:text-base"
          />
          <button
            onClick={handleSend}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
