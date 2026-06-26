import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  History,
  LogIn,
  MessageSquareText,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wifi,
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

const surfaceClassName =
  "border border-white/85 bg-white/88 shadow-[0_26px_70px_-46px_rgba(15,23,42,0.45)] ring-1 ring-sky-100/70 backdrop-blur-2xl dark:border-zinc-900 dark:bg-black/92 dark:ring-white/[0.06] dark:shadow-[0_26px_80px_-44px_rgba(0,0,0,0.98)]";

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
  compact = false,
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
      className={`group inline-flex items-center gap-2 border border-slate-200/80 bg-white/82 text-left font-semibold text-slate-700 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950/86 dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-white dark:focus-visible:ring-white/10 motion-reduce:transform-none ${
        compact
          ? "min-h-10 min-w-[13.5rem] flex-none rounded-xl px-3 py-2 text-xs"
          : "min-h-[46px] rounded-2xl px-3.5 py-3 text-sm"
      }`}
    >
      <MessageSquareText className="h-4 w-4 shrink-0 text-sky-600 transition group-hover:text-sky-700 dark:text-cyan-100" />
      <span className="line-clamp-2">{prompt}</span>
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
      <div className="max-w-[92%] sm:max-w-[82%] lg:max-w-[46rem]">
        <div
          className={`mb-1.5 flex flex-wrap items-center gap-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
            {isUser ? "You" : "AmiBot"}
          </span>
          <MessageBadge message={message} />
        </div>

        <div
          className={`whitespace-pre-wrap break-words rounded-2xl border px-3.5 py-2.5 text-sm leading-6 [overflow-wrap:anywhere] sm:px-4 sm:py-3 sm:text-[15px] sm:leading-7 ${
            isUser
              ? "border-sky-300/35 bg-[linear-gradient(135deg,#0284c7,#06b6d4)] text-white shadow-[0_18px_44px_rgba(14,165,233,0.22)]"
              : "border-white/85 bg-white/92 text-slate-700 shadow-[0_16px_42px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-[0_16px_42px_rgba(0,0,0,0.34)]"
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
      <div className="max-w-[92%] sm:max-w-[82%] lg:max-w-[46rem]">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
            AmiBot
          </span>
        </div>
        <div className="rounded-2xl border border-white/85 bg-white/92 px-3.5 py-3 text-slate-700 shadow-[0_16px_42px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:shadow-[0_16px_42px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300 [animation-delay:-0.3s] dark:bg-cyan-200" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s] dark:bg-cyan-300" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 dark:bg-cyan-400" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-zinc-300">
              Checking data...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

function StatusTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/72 p-3 text-sm text-slate-700 dark:border-zinc-800 dark:bg-zinc-950/72 dark:text-zinc-200">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-100">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">
            {label}
          </p>
          <p className="truncate font-semibold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

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
  const formRef = useRef(null);

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

  const handleInputKeyDown = useCallback((event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, []);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const authAction = isAuthenticated ? (
    <button
      type="button"
      onClick={handleClearHistory}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/82 px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700"
      disabled={loading || historyLoading}
    >
      <Trash2 className="h-4 w-4" />
      <span>Clear history</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={handleOpenLogin}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-sky-700 dark:bg-cyan-300 dark:text-zinc-950 dark:hover:bg-cyan-200"
    >
      <LogIn className="h-4 w-4" />
      <span>Login</span>
    </button>
  );

  return (
    <section className="amiverse-premium-light-page relative isolate min-h-[calc(100svh-4rem)] overflow-hidden px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-slate-900 transition-colors duration-300 dark:bg-black dark:text-zinc-100 sm:px-5 sm:py-5 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="amiverse-premium-light-overlay absolute inset-0 dark:bg-[linear-gradient(180deg,#000_0%,#09090b_54%,#000_100%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(245,248,250,0.46),rgba(245,248,250,0))] dark:bg-transparent" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-[0.08] dark:[background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100svh-5.5rem)] w-full min-w-0 max-w-7xl gap-3 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:gap-4">
        <aside className={`hidden min-h-0 flex-col overflow-hidden rounded-2xl p-4 lg:flex ${surfaceClassName}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.45)] dark:bg-cyan-300 dark:shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
              AmiBot
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200/80 bg-white/75 text-sky-700 shadow-sm dark:border-zinc-800 dark:bg-black dark:text-cyan-100">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
              Data-grounded chat
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-zinc-300">
              Answers stay tied to AmiVerse knowledge, with saved history for signed-in users.
            </p>
          </div>

          <div className="mt-5 grid gap-2">
            <StatusTile icon={Database} label="Source" value="Uploaded files" />
            <StatusTile
              icon={History}
              label="Session"
              value={isAuthenticated ? "History on" : "Guest chat"}
            />
            <StatusTile icon={ShieldCheck} label="Fallback" value="Admin review" />
          </div>

          {historyError ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {historyError}
            </div>
          ) : null}

          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">
              Prompt starters
            </p>
            <div className="mt-3 grid gap-2">
              {PROMPT_SUGGESTIONS.map((prompt) => (
                <PromptSuggestionButton
                  key={prompt}
                  onSelect={handleSuggestionClick}
                  prompt={prompt}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">{authAction}</div>
        </aside>

        <div className={`flex min-h-[calc(100svh-5.75rem)] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl lg:min-h-0 ${surfaceClassName}`}>
          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-3.5 py-3.5 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-white/85 text-sky-700 shadow-sm dark:border-zinc-800 dark:bg-black dark:text-cyan-100">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-500">
                    Live chat
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-100">
                    <Wifi className="h-3 w-3" />
                    Online
                  </span>
                </div>
                <h2 className="truncate text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
                  AmiBot Knowledge Chat
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white/74 px-3 text-xs font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {isAuthenticated ? "History active" : "Guest mode"}
              </span>
              <div className="lg:hidden">{authAction}</div>
            </div>
          </div>

          <div className="min-w-0 max-w-full overflow-hidden border-b border-slate-200/80 px-3 py-2 dark:border-zinc-900 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PROMPT_SUGGESTIONS.map((prompt) => (
                <PromptSuggestionButton
                  compact
                  key={prompt}
                  onSelect={handleSuggestionClick}
                  prompt={prompt}
                />
              ))}
            </div>
          </div>

          {historyError ? (
            <div className="mx-3 mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100 sm:mx-5 lg:hidden">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {historyError}
            </div>
          ) : null}

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(224,242,254,0.26),rgba(255,255,255,0)_34%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0)_34%)]" />

            <div
              aria-live="polite"
              className="relative flex h-full flex-col gap-3 overflow-y-auto px-3 py-3 sm:gap-4 sm:px-6 sm:py-5"
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
            ref={formRef}
            className="border-t border-slate-200/80 bg-white/70 px-2.5 py-2.5 backdrop-blur-xl dark:border-zinc-900 dark:bg-black/82 sm:px-5 sm:py-4"
            onSubmit={handleSubmit}
          >
            <div className="rounded-2xl border border-white/85 bg-white/88 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-2">
              <div className="flex items-end gap-1.5 sm:gap-3">
                <textarea
                  ref={inputRef}
                  aria-label="Type your message"
                  autoComplete="off"
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-transparent bg-transparent px-2.5 py-2.5 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:border-sky-300/60 focus:outline-none focus:ring-4 focus:ring-sky-100 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-white/10 sm:min-h-12 sm:px-4 sm:text-base"
                  maxLength={2000}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask AmiBot from uploaded data..."
                  rows={1}
                  value={input}
                />

                <button
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#0284c7,#06b6d4)] px-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(14,165,233,0.26)] transition duration-200 hover:-translate-y-0.5 hover:from-sky-600 hover:to-cyan-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-55 dark:focus-visible:ring-cyan-300/20 motion-reduce:transform-none sm:h-12 sm:gap-2 sm:px-5 sm:text-base"
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

            <div className="flex items-center justify-between gap-3 px-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">
              <span>
                {isAuthenticated ? "Admin follow-up enabled" : "Login for saved history"}
              </span>
              <span>{input.length}/2000</span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AmiBot;
