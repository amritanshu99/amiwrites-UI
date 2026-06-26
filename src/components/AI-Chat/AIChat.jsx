import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import AIChatHeader from "./AIChatHeader";
import { apiUrl } from "../../config/api";

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

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-950 dark:text-white">
      {children}
    </strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-cyan-700 underline underline-offset-2 dark:text-cyan-200"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-900 dark:bg-white/10 dark:text-zinc-100">
      {children}
    </code>
  ),
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";
  const isTyping = message.role === "typing";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[92%] overflow-hidden rounded-lg border px-4 py-3 shadow-sm sm:max-w-[78%] ${
          isUser
            ? "border-cyan-500/20 bg-cyan-600 text-white shadow-cyan-900/10"
            : "border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100"
        }`}
      >
        <div
          className={`mb-2 flex items-center gap-2 text-xs font-semibold ${
            isUser
              ? "text-cyan-50"
              : "text-slate-500 dark:text-zinc-400"
          }`}
        >
          {isUser ? (
            <MessageCircle className="h-3.5 w-3.5" />
          ) : isTyping ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Bot className="h-3.5 w-3.5" />
          )}
          <span>{isUser ? "You" : isTyping ? "Ami AI is thinking" : "Ami AI"}</span>
        </div>

        <div
          className={`break-words text-sm leading-6 sm:text-[15px] ${
            isUser ? "text-white" : "text-slate-800 dark:text-zinc-100"
          }`}
        >
          {isTyping && !message.content ? (
            <p>Preparing a thoughtful response...</p>
          ) : (
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </article>
    </div>
  );
};

const openAuthModal = (eventName) => {
  window.dispatchEvent(new Event(eventName));
};

const readGeminiResponse = async (response) => {
  const rawText = await response.text();
  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText };
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.error || data?.message || `HTTP error! Status: ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return data;
};

const AIChat = () => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("Mental Well-being");
  const [isResponding, setIsResponding] = useState(false);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const forceScrollRef = useRef(true);

  const isMessagePaneNearBottom = useCallback(() => {
    const messagePane = messagesContainerRef.current;
    if (!messagePane) return true;

    const distanceFromBottom =
      messagePane.scrollHeight - messagePane.scrollTop - messagePane.clientHeight;

    return distanceFromBottom < 96;
  }, []);

  const scrollMessagesToBottom = useCallback((behavior = "auto") => {
    const messagePane = messagesContainerRef.current;
    if (!messagePane) return;

    if (scrollFrameRef.current) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      messagePane.scrollTo({
        top: messagePane.scrollHeight,
        behavior,
      });
      shouldAutoScrollRef.current = true;
    });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    shouldAutoScrollRef.current = isMessagePaneNearBottom();
  }, [isMessagePaneNearBottom]);

  const resizeComposer = useCallback(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;

    inputElement.style.height = "auto";
    inputElement.style.height = `${Math.min(inputElement.scrollHeight, 128)}px`;
  }, []);

  useEffect(() => {
    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;

    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.username) {
        setIsLoggedIn(true);
        setDisplayName(decoded.username);
        setMessages([
          {
            role: "ai",
            content: `Hello ${decoded.username}, what would you like to work through today?`,
          },
        ]);
        return;
      }
    }
    setIsLoggedIn(false);
    setDisplayName("");
    setMessages([{ role: "ai", content: "Hello! How can I help you today?" }]);
  }, [token]);

  useEffect(() => {
    if (!forceScrollRef.current && !shouldAutoScrollRef.current) return;

    scrollMessagesToBottom("auto");
    forceScrollRef.current = false;
  }, [messages, scrollMessagesToBottom]);

  useEffect(() => {
    resizeComposer();
  }, [input, resizeComposer]);

  useEffect(() => {
    const onTokenChanged = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("tokenChanged", onTokenChanged);
    return () => window.removeEventListener("tokenChanged", onTokenChanged);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  const handlePromptClick = (prompt) => {
    setInput(prompt);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isResponding) return;

    const expertPrompt = [
      `Act as a careful ${category} support expert.`,
      "Limit the answer to 200 words.",
      "Be practical, kind, and specific.",
      "If the user mentions self-harm, immediate danger, abuse, or a medical emergency, tell them to contact local emergency services or a trusted person immediately.",
      `User message: ${trimmedInput}`,
    ].join(" ");

    const userMessage = {
      role: "user",
      content: trimmedInput,
    };

    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "typing", content: "" },
    ]);
    setInput("");
    setIsResponding(true);

    try {
      const response = await fetch(apiUrl("/api/gemini/generate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: expertPrompt }),
      });

      const data = await readGeminiResponse(response);
      const fullText = data.response || "Sorry, I did not get a response.";
      let index = 0;
      let currentText = "";

      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }

      typingTimerRef.current = setInterval(() => {
        if (index < fullText.length) {
          currentText += fullText[index++];
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[updated.length - 1]?.role === "typing") {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: currentText,
              };
            }
            return updated;
          });
        } else {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[updated.length - 1]?.role === "typing") {
              updated[updated.length - 1] = { role: "ai", content: fullText };
            }
            return updated;
          });
          setIsResponding(false);
        }
      }, 16);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "ai",
          content: error.status === 429
            ? error.message
            : "Sorry, something went wrong while fetching the response. Please try again later.",
        },
      ]);
      setIsResponding(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent?.isComposing
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!isLoggedIn) {
    return (
      <div
        className="min-h-[calc(100svh-4rem)] bg-[linear-gradient(180deg,#f8fafc_0%,#e0f2fe_46%,#ecfdf5_100%)] px-3 py-6 dark:bg-[linear-gradient(180deg,#050505_0%,#0b1115_58%,#000000_100%)] sm:px-5 sm:py-8 lg:px-8"
      >
        <div className="mx-auto grid w-full max-w-6xl items-center justify-items-start gap-5 sm:justify-items-stretch lg:min-h-[calc(100svh-10rem)] lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.78fr)]">
          <section className="w-full max-w-[22.5rem] min-w-0 overflow-hidden rounded-lg border border-white/80 bg-white/[0.9] p-5 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/[0.9] dark:shadow-[0_30px_90px_-52px_rgba(0,0,0,0.95)] sm:max-w-none sm:p-7 lg:p-9">
            <span className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
              <LockKeyhole className="h-4 w-4" />
              Members only
            </span>
            <h1 className="mt-5 max-w-2xl break-words text-2xl font-bold leading-8 text-slate-950 dark:text-white sm:text-4xl sm:leading-[3rem]">
              Sign in to open your Ami AI wellness chat.
            </h1>
            <p className="mt-4 max-w-2xl break-words text-base leading-7 text-slate-600 dark:text-zinc-300 sm:text-lg sm:leading-8">
              Your chat workspace is ready after login, with focused categories,
              starter prompts, and a cleaner conversation view for every screen.
            </p>

            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openAuthModal("open-login-modal")}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.9)] transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/[0.15] sm:w-auto"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
              <button
                type="button"
                onClick={() => openAuthModal("open-signup-modal")}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.1] dark:focus-visible:ring-white/10 sm:w-auto"
              >
                <UserPlus className="h-4 w-4" />
                Create account
              </button>
            </div>
          </section>

          <section
            aria-label="AI chat preview"
            className="w-full max-w-[22.5rem] min-w-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white/[0.84] p-4 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_28px_80px_-50px_rgba(0,0,0,0.95)] sm:max-w-none sm:p-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-cyan-200 dark:bg-cyan-300 dark:text-slate-950">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Ami AI
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Wellness support
                  </p>
                </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            </div>

            <div className="mt-4 space-y-3">
              <div className="max-w-[88%] break-words rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200">
                Hello, what would you like to work through today?
              </div>
              <div className="ml-auto max-w-[82%] break-words rounded-lg bg-cyan-600 px-3 py-2 text-sm leading-6 text-white shadow-sm">
                I need help calming down before sleep.
              </div>
              <div className="max-w-[74%] break-words rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-950 shadow-sm dark:border-emerald-300/[0.15] dark:bg-emerald-300/10 dark:text-emerald-50 sm:max-w-[90%]">
                Try a slow breathing rhythm, lower the room brightness, and
                write down one worry with one next action for tomorrow.
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100svh-4rem)] bg-[linear-gradient(180deg,#f8fafc_0%,#e0f2fe_46%,#ecfdf5_100%)] px-3 py-4 dark:bg-[linear-gradient(180deg,#050505_0%,#0b1115_58%,#000000_100%)] sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-5">
        <AIChatHeader
          category={category}
          setCategory={setCategory}
          onPromptClick={handlePromptClick}
        />

        <section className="flex min-h-[38rem] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white/[0.9] shadow-[0_24px_70px_-46px_rgba(15,23,42,0.32)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/[0.9] dark:shadow-[0_30px_90px_-52px_rgba(0,0,0,0.95)] lg:h-[calc(100svh-8.5rem)]">
          <header className="border-b border-slate-200 bg-white/[0.86] px-4 py-4 dark:border-white/10 dark:bg-white/[0.04] sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                  <Bot className="h-4 w-4" />
                  <span>{category}</span>
                  <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200">
                    Active session
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-bold leading-8 text-slate-950 dark:text-white sm:text-3xl">
                  {displayName ? `${displayName}'s chat` : "Your chat"}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-zinc-300 sm:flex">
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold dark:border-white/10 dark:bg-white/[0.06]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                  Account session
                </span>
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 font-semibold text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Use discretion
                </span>
              </div>
            </div>
          </header>

          <div
            ref={messagesContainerRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            onScroll={handleMessagesScroll}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 px-3 py-4 dark:bg-black/30 sm:px-5 sm:py-5"
          >
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <MessageBubble key={`${msg.role}-${idx}`} message={msg} />
              ))}
              <div aria-hidden="true" className="h-px" />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white/[0.92] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 dark:border-white/10 dark:bg-zinc-950/[0.92] sm:p-4">
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                AI responses are supportive guidance and are not a substitute
                for professional care or emergency help.
              </p>
            </div>

            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                placeholder={`Ask something about ${category}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                className="min-h-12 max-h-32 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 shadow-inner shadow-slate-100/70 outline-none transition-colors placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/10 sm:text-base"
                aria-label="Message"
              />
              <button
                type="submit"
                disabled={!input.trim() || isResponding}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-[0_16px_28px_-20px_rgba(15,23,42,0.95)] transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/[0.15]"
                aria-label="Send message"
                title="Send message"
              >
                {isResponding ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AIChat;
