import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  History,
  LogIn,
  SendHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { apiUrl } from "../../config/api";

const GREETINGS = [
  {
    sender: "bot",
    text: "Hello! I am AmiBot. Ask me anything covered by the uploaded AmiVerse knowledge.",
  },
  {
    sender: "bot",
    text: "Namaste! I can answer from the PDF and Excel knowledge shared with me.",
  },
  {
    sender: "bot",
    text: "AmiBot is ready. I will stay grounded in the data uploaded by the admin.",
  },
];

const PROMPT_SUGGESTIONS = [
  "Summarize the uploaded knowledge",
  "What details are available about Amritanshu?",
  "Which projects are mentioned in the data?",
  "What skills are listed in the uploaded files?",
];

function parseJwt(token) {
  try {
    const base64Payload = token.split(".")[1];
    return JSON.parse(atob(base64Payload));
  } catch {
    return null;
  }
}

function getAuthToken() {
  const token = localStorage.getItem("token");
  return token && parseJwt(token) ? token : "";
}

function randomGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

function getBotResponsePayload(data = {}) {
  const botResponse = data.botResponse || {};
  return {
    text: data.response || botResponse.response || "",
    metadata: {
      answeredFromKnowledge:
        data.answeredFromKnowledge ?? botResponse.answeredFromKnowledge ?? null,
      pendingQuestionId:
        data.pendingQuestionId || botResponse.pendingQuestionId || null,
      sources: data.sources || botResponse.sources || [],
    },
  };
}

function sourceSummary(sources = []) {
  if (!Array.isArray(sources) || !sources.length) return "";
  return sources
    .map((source) => source.sourceName)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

const PromptSuggestionButton = React.memo(function PromptSuggestionButton({
  onSelect,
  prompt,
}) {
  const handleClick = useCallback(() => {
    onSelect(prompt);
  }, [onSelect, prompt]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-[46px] rounded-2xl border border-white/85 bg-white/80 px-3.5 py-3 text-left text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-sky-50/95 hover:text-sky-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:border-zinc-800 dark:bg-black dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-950 dark:hover:text-white dark:focus-visible:ring-white/10 motion-reduce:transform-none"
    >
      {prompt}
    </button>
  );
});

const MessageBadge = React.memo(function MessageBadge({ message }) {
  if (message.sender === "user") return null;

  const metadata = message.metadata || {};
  const sources = sourceSummary(metadata.sources);

  if (metadata.answerSource === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-100">
        <CheckCircle2 className="h-3 w-3" />
        Admin answer
      </span>
    );
  }

  if (metadata.pendingQuestionId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-300/10 dark:text-amber-100">
        <Clock3 className="h-3 w-3" />
        Sent to admin
      </span>
    );
  }

  if (metadata.answeredFromKnowledge) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-100">
        <Database className="h-3 w-3" />
        <span className="truncate">{sources || "Uploaded data"}</span>
      </span>
    );
  }

  return null;
});

const ChatMessage = React.memo(function ChatMessage({ message }) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[94%] sm:max-w-[82%] md:max-w-[72%]">
        <div
          className={`mb-1.5 flex items-center gap-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">
            {isUser ? "You" : "AmiBot"}
          </span>
          <MessageBadge message={message} />
        </div>

        <div
          className={`whitespace-pre-wrap break-words rounded-[22px] border px-3.5 py-2.5 text-sm leading-6 [overflow-wrap:anywhere] sm:rounded-[24px] sm:px-5 sm:py-3 sm:text-[15px] sm:leading-7 ${
            isUser
              ? "border-sky-300/30 bg-gradient-to-br from-sky-400 via-cyan-400 to-cyan-500 text-slate-950 shadow-[0_22px_50px_rgba(56,189,248,0.24)]"
              : "border-white/85 bg-white/88 text-slate-700 shadow-[0_18px_45px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:shadow-[0_18px_45px_rgba(0,0,0,0.34)]"
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
});

const TypingIndicator = React.memo(function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[94%] sm:max-w-[82%] md:max-w-[72%]">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">
            AmiBot
          </span>
        </div>
        <div className="rounded-[22px] border border-white/85 bg-white/88 px-3.5 py-2.5 text-slate-700 shadow-[0_18px_45px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-zinc-800 dark:bg-black dark:text-zinc-200 dark:shadow-[0_18px_45px_rgba(0,0,0,0.34)] sm:rounded-[24px] sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300 [animation-delay:-0.3s] dark:bg-cyan-200" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s] dark:bg-cyan-300" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 dark:bg-cyan-400" />
            </div>
            <span className="text-sm text-slate-500 dark:text-zinc-300">
              Checking data...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const AmiBot = () => {
  const { pathname } = useLocation();
  const [messages, setMessages] = useState(() => [randomGreeting()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const refreshAuthState = useCallback(() => {
    setIsAuthenticated(Boolean(getAuthToken()));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("tokenChanged", refreshAuthState);
    return () => window.removeEventListener("tokenChanged", refreshAuthState);
  }, [refreshAuthState]);

  useEffect(() => {
    if ((messages.length > 1 || loading) && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [loading, messages]);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setHistoryError("");
      setMessages([randomGreeting()]);
      return;
    }

    const controller = new AbortController();

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const response = await fetch(apiUrl("/api/amibot/history"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "Unable to load chat history");
        }

        const historyMessages = Array.isArray(data.messages)
          ? data.messages.map((message) => ({
              sender: message.sender === "user" ? "user" : "bot",
              text: message.text,
              metadata: message.metadata || {},
            }))
          : [];

        setMessages(historyMessages.length ? historyMessages : [randomGreeting()]);
      } catch (error) {
        if (error.name === "AbortError") return;
        setHistoryError(error.message || "Unable to load chat history");
        setMessages([randomGreeting()]);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();

    return () => controller.abort();
  }, [isAuthenticated]);

  const handleSuggestionClick = useCallback((prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  }, []);

  const handleOpenLogin = useCallback(() => {
    window.dispatchEvent(new Event("open-login-modal"));
  }, []);

  const handleClearHistory = useCallback(async () => {
    const token = getAuthToken();
    if (!token || loading) return;

    setHistoryError("");

    try {
      const response = await fetch(apiUrl("/api/amibot/history"), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || "Unable to clear history");
      setMessages([randomGreeting()]);
    } catch (error) {
      setHistoryError(error.message || "Unable to clear history");
    }
  }, [loading]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    const query = input.trim();
    if (!query || loading) return;

    const token = getAuthToken();
    const userMessage = { sender: "user", text: query, metadata: {} };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        apiUrl("/api/amibot"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ query }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.dispatchEvent(new Event("tokenChanged"));
        }
        throw new Error(data.error || data.message || "AmiBot could not answer right now");
      }

      const payload = getBotResponsePayload(data);
      const botReply = payload.text || "I do not have this answer in the uploaded AmiBot knowledge yet.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botReply,
          metadata: payload.metadata,
        },
      ]);
    } catch (error) {
      console.error("AmiBot API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: error.message || "Sorry, something went wrong. Please try again later.",
          metadata: { answeredFromKnowledge: false },
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  return (
    <section className="amiverse-premium-light-page relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden px-2 pb-[max(5.75rem,env(safe-area-inset-bottom))] pt-2 text-slate-900 transition-colors duration-300 dark:bg-none dark:bg-black dark:text-zinc-100 sm:px-5 sm:pb-5 sm:pt-4 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="amiverse-premium-light-overlay absolute inset-0 dark:bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(245,248,250,0.44),rgba(245,248,250,0))] dark:bg-transparent" />
        <div className="absolute inset-0 opacity-[0.24] [background-image:linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-[0.08] dark:[background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-5.5rem)] max-w-7xl flex-col gap-2 lg:h-[calc(100dvh-5.5rem)] lg:min-h-0 lg:flex-row lg:gap-4">
        <aside className="relative overflow-hidden rounded-2xl border border-white/85 bg-[linear-gradient(155deg,rgba(255,255,255,0.96),rgba(247,251,255,0.94),rgba(236,246,255,0.92))] p-3.5 shadow-[0_32px_80px_-46px_rgba(15,23,42,0.22)] ring-1 ring-sky-100/70 backdrop-blur-xl dark:border-zinc-900 dark:bg-[linear-gradient(160deg,rgba(0,0,0,0.98),rgba(0,0,0,1),rgba(0,0,0,1))] dark:ring-white/5 dark:shadow-[0_32px_90px_-42px_rgba(0,0,0,0.96)] sm:rounded-[30px] sm:p-5 lg:flex lg:w-[360px] lg:max-w-[380px] lg:min-h-0 lg:max-h-full lg:flex-col lg:overflow-y-auto lg:pr-4">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent dark:via-cyan-300/80" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.45)] dark:bg-cyan-300 dark:shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                AmiBot
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-200/80 bg-white/75 text-sky-700 shadow-sm dark:border-zinc-800 dark:bg-black dark:text-cyan-100">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <h1 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white sm:text-[2rem]">
              Data-Grounded AmiBot
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-zinc-300 sm:text-[15px]">
              Answers come from the uploaded AmiVerse PDF and Excel knowledge. Logged-in users get saved history and admin follow-up when data is missing.
            </p>
          </div>

          <div className="relative mt-5 grid gap-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-3 text-sm text-slate-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200">
              <div className="flex items-center gap-2 font-semibold">
                <Database className="h-4 w-4 text-sky-700 dark:text-cyan-100" />
                Uploaded knowledge only
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-3 text-sm text-slate-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200">
              <div className="flex items-center gap-2 font-semibold">
                <History className="h-4 w-4 text-sky-700 dark:text-cyan-100" />
                {isAuthenticated ? "History enabled" : "Guest session"}
              </div>
            </div>
          </div>

          {historyError ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {historyError}
            </div>
          ) : null}

          <div className="relative mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
              Suggested prompts
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {PROMPT_SUGGESTIONS.map((prompt) => (
                <PromptSuggestionButton
                  key={prompt}
                  onSelect={handleSuggestionClick}
                  prompt={prompt}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                disabled={loading || historyLoading}
              >
                <Trash2 className="h-4 w-4" />
                Clear history
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenLogin}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-sky-700 dark:bg-cyan-300 dark:text-zinc-950 dark:hover:bg-cyan-200"
              >
                <LogIn className="h-4 w-4" />
                Login for history
              </button>
            )}
          </div>
        </aside>

        <div className="relative flex min-h-[60dvh] flex-1 flex-col overflow-hidden rounded-2xl border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,252,255,0.92),rgba(242,249,255,0.9))] shadow-[0_32px_90px_-46px_rgba(15,23,42,0.22)] ring-1 ring-sky-100/70 backdrop-blur-2xl dark:border-zinc-900 dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.98),rgba(0,0,0,1),rgba(0,0,0,1))] dark:ring-white/5 dark:shadow-[0_32px_100px_-44px_rgba(0,0,0,0.98)] sm:rounded-[30px] lg:min-h-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/75 to-transparent dark:via-white/30" />

          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 dark:border-zinc-900 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-sky-200 bg-white/85 text-sky-700 shadow-sm dark:border-zinc-800 dark:bg-black dark:text-cyan-100">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
                  Live Conversation
                </p>
                <h2 className="truncate text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
                  AmiBot Knowledge Chat
                </h2>
                <p className="hidden text-sm text-slate-500 dark:text-zinc-400 sm:block">
                  {isAuthenticated
                    ? "Logged-in chat history is active."
                    : "Guest chats are temporary."}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)] dark:bg-emerald-300 dark:shadow-[0_0_14px_rgba(134,239,172,0.75)]" />
              Online
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(224,242,254,0.26),rgba(255,255,255,0)_34%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0)_34%)]" />

            <div
              aria-live="polite"
              className="relative flex h-full flex-col gap-3 overflow-y-auto px-2.5 py-3 sm:gap-4 sm:px-6 sm:py-6"
              role="log"
            >
              {historyLoading ? (
                <div className="flex flex-1 items-center justify-center text-slate-500 dark:text-zinc-300">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold dark:border-zinc-800 dark:bg-black">
                    <History className="h-4 w-4 animate-pulse" />
                    Loading history...
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatMessage key={`${message.sender}-${index}-${message.text.slice(0, 16)}`} message={message} />
                ))
              )}

              {loading && <TypingIndicator />}

              <div ref={bottomRef} />
            </div>
          </div>

          <form
            className="border-t border-slate-200/80 bg-white/65 px-2 py-2.5 backdrop-blur-xl dark:border-zinc-900 dark:bg-black sm:px-5 sm:py-4"
            onSubmit={handleSubmit}
          >
            <div className="rounded-[20px] border border-white/85 bg-white/85 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-zinc-800 dark:bg-black dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:rounded-[24px] sm:p-2">
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="hidden h-12 w-12 items-center justify-center rounded-[18px] border border-sky-200 bg-white/80 text-sm font-semibold uppercase tracking-[0.3em] text-sky-700 dark:border-zinc-800 dark:bg-black dark:text-cyan-100 sm:flex">
                  AI
                </div>

                <input
                  ref={inputRef}
                  aria-label="Type your message"
                  autoComplete="off"
                  className="h-11 flex-1 rounded-[16px] border border-transparent bg-transparent px-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300/60 focus:outline-none focus:ring-4 focus:ring-sky-100 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-white/10 sm:h-12 sm:rounded-[18px] sm:px-4 sm:text-base"
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask AmiBot from uploaded data..."
                  type="text"
                  value={input}
                />

                <button
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[16px] bg-gradient-to-r from-sky-500 via-cyan-500 to-cyan-600 px-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(14,165,233,0.28)] transition duration-200 hover:-translate-y-0.5 hover:from-sky-600 hover:via-cyan-600 hover:to-cyan-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-55 dark:text-white dark:focus-visible:ring-cyan-300/20 motion-reduce:transform-none sm:h-12 sm:gap-2 sm:rounded-[18px] sm:px-5 sm:text-base"
                  disabled={!canSend}
                  type="submit"
                >
                  <SendHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {loading ? "Sending..." : "Send"}
                  </span>
                </button>
              </div>
            </div>

            <p className="px-2 pt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
              {isAuthenticated
                ? "Missing answers are sent to admin."
                : "Login enables history and admin follow-up."}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AmiBot;
