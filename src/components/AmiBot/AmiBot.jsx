import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  History,
  LoaderCircle,
  LogIn,
  MessageSquareText,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wifi,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
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

const thinkingTexts = [
  "Thinking…",
  "Reasoning through this…",
  "Analyzing your request…",
  "Understanding the context…",
  "Breaking this down…",
  "Connecting the dots…",
  "Working through the logic…",
  "Planning the best response…",
  "Reviewing possible answers…",
  "Building a clear answer…",
  "Evaluating the options…",
  "Structuring the response…",
  "Finding the simplest explanation…",
  "Preparing a helpful answer…",
  "Checking assumptions…",
  "Thinking carefully…",
  "Refining the answer…",
  "Looking for the key insight…",
  "Validating the logic…",
  "Pulling everything together…",
];

const surfaceClassName =
  "rounded-lg border border-slate-200/80 bg-white/[0.96] shadow-sm dark:border-white/10 dark:bg-zinc-950/[0.96] lg:bg-white/[0.9] lg:shadow-[0_24px_70px_-46px_rgba(15,23,42,0.32)] lg:backdrop-blur-xl lg:dark:bg-zinc-950/[0.9] lg:dark:shadow-[0_30px_90px_-52px_rgba(0,0,0,0.95)]";

function isCoarseInputDevice() {
  return Boolean(
    typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)")?.matches
  );
}

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64Payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64Payload)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
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
      className={`group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 text-left font-semibold text-slate-700 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:border-cyan-300/30 dark:hover:bg-cyan-300/10 dark:hover:text-white dark:focus-visible:ring-cyan-300/10 ${
        compact
          ? "min-h-10 min-w-[13.5rem] flex-none px-3 py-2 text-xs"
          : "min-h-11 px-3 py-2 text-sm"
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

  if (metadata.answerSource === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-100">
        <CheckCircle2 className="h-3 w-3" />
        Admin answer
      </span>
    );
  }

  if (metadata.pendingQuestionId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-300/10 dark:text-amber-100">
        <Clock3 className="h-3 w-3" />
        Sent to admin
      </span>
    );
  }

  if (metadata.answeredFromKnowledge) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-100">
        <Database className="h-3 w-3" />
        Knowledge
      </span>
    );
  }

  return null;
});

const SourceList = React.memo(function SourceList({ sources = [] }) {
  const visibleSources = Array.isArray(sources)
    ? sources.filter((source) => source?.sourceName).slice(0, 3)
    : [];

  if (!visibleSources.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200/70 pt-3 dark:border-white/10">
      {visibleSources.map((source, index) => (
        <span
          key={`${source.sourceName}-${index}`}
          className="inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300"
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-cyan-700 dark:text-cyan-200" />
          <span className="truncate">{source.sourceName}</span>
        </span>
      ))}
    </div>
  );
});

const ChatMessage = React.memo(function ChatMessage({ message }) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[92%] overflow-hidden rounded-lg border px-4 py-3 shadow-sm sm:max-w-[78%] lg:max-w-[46rem] ${
          isUser
            ? "border-cyan-500/20 bg-cyan-600 text-white shadow-cyan-900/10"
            : "border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100"
        }`}
      >
        <div
          className={`mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold ${
            isUser ? "justify-end text-cyan-50" : "text-slate-500 dark:text-zinc-400"
          }`}
        >
          <span>
            {isUser ? "You" : "AmiBot"}
          </span>
          <MessageBadge message={message} />
        </div>

        <div
          className={`break-words text-sm leading-6 [overflow-wrap:anywhere] sm:text-[15px] ${
            isUser
              ? "whitespace-pre-wrap text-white"
              : "text-slate-800 dark:text-zinc-100"
          }`}
        >
          {isUser ? (
            message.text
          ) : (
            <ReactMarkdown components={markdownComponents}>
              {message.text}
            </ReactMarkdown>
          )}
        </div>
        {!isUser && <SourceList sources={message.metadata?.sources} />}
      </article>
    </div>
  );
});

const TypingIndicator = React.memo(function TypingIndicator() {
  const [thinkingTextIndex, setThinkingTextIndex] = useState(0);
  const thinkingText = thinkingTexts[thinkingTextIndex];

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReducedMotion) return undefined;

    const intervalId = window.setInterval(() => {
      setThinkingTextIndex((index) => (index + 1) % thinkingTexts.length);
    }, 1750);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex justify-start">
      <article className="max-w-[92%] rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200 sm:max-w-[78%] lg:max-w-[46rem]">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-300/15">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          </span>
          <span className="min-w-0">
            <span className="mr-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
              AmiBot
            </span>
            <span aria-live="polite" className="text-slate-600 dark:text-zinc-300">
              {thinkingText}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-600" />
        </div>
      </article>
    </div>
  );
});

function StatusTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-100">
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
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const forceScrollRef = useRef(true);

  const refreshAuthState = useCallback(() => {
    setIsAuthenticated(Boolean(getAuthToken()));
  }, []);

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
    const nextHeight = Math.min(Math.max(inputElement.scrollHeight, 48), 128);
    inputElement.style.height = `${nextHeight}px`;
    inputElement.style.overflowY = inputElement.scrollHeight > 128 ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("tokenChanged", refreshAuthState);
    return () => window.removeEventListener("tokenChanged", refreshAuthState);
  }, [refreshAuthState]);

  useEffect(() => {
    if (!forceScrollRef.current && !shouldAutoScrollRef.current) return;

    scrollMessagesToBottom("auto");
    forceScrollRef.current = false;
  }, [historyLoading, loading, messages, scrollMessagesToBottom]);

  useEffect(() => {
    resizeComposer();
  }, [input, resizeComposer]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setHistoryError("");
      forceScrollRef.current = true;
      shouldAutoScrollRef.current = true;
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

        forceScrollRef.current = true;
        shouldAutoScrollRef.current = true;
        setMessages(historyMessages.length ? historyMessages : [randomGreeting()]);
      } catch (error) {
        if (error.name === "AbortError") return;
        setHistoryError(error.message || "Unable to load chat history");
        forceScrollRef.current = true;
        shouldAutoScrollRef.current = true;
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
    window.requestAnimationFrame(() => inputRef.current?.focus());
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
      forceScrollRef.current = true;
      shouldAutoScrollRef.current = true;
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
    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;
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

      forceScrollRef.current = true;
      shouldAutoScrollRef.current = true;
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
      forceScrollRef.current = true;
      shouldAutoScrollRef.current = true;
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
      if (!isCoarseInputDevice()) {
        inputRef.current?.focus();
      }
    }
  }, [input, loading]);

  const handleInputKeyDown = useCallback((event) => {
    if (isCoarseInputDevice()) return;

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent?.isComposing
    ) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, []);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const authAction = isAuthenticated ? (
    <button
      type="button"
      onClick={handleClearHistory}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.1] dark:focus-visible:ring-cyan-300/10"
      disabled={loading || historyLoading}
      aria-label="Clear AmiBot history"
    >
      <Trash2 className="h-4 w-4" />
      <span>Clear history</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={handleOpenLogin}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.9)] transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/10"
      aria-label="Login for AmiBot history"
    >
      <LogIn className="h-4 w-4" />
      <span>Login</span>
    </button>
  );

  return (
    <section className="h-full min-h-0 w-screen max-w-full overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#e0f2fe_46%,#ecfdf5_100%)] p-2 text-slate-900 dark:bg-[linear-gradient(180deg,#050505_0%,#0b1115_58%,#000000_100%)] dark:text-zinc-100 sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto grid h-full w-full min-w-0 max-w-7xl gap-0 overflow-hidden lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-5">
        <aside className={`relative hidden w-full min-w-0 max-w-full overflow-hidden p-4 sm:p-5 lg:sticky lg:top-24 lg:block lg:self-start ${surfaceClassName}`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0891b2,#10b981,#f59e0b)]" />

          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-cyan-200 shadow-sm dark:bg-cyan-300 dark:text-slate-950">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                AmiBot
              </p>
              <h1 className="mt-1 text-xl font-bold leading-7 text-slate-950 dark:text-white sm:text-2xl">
                Knowledge chat
              </h1>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-zinc-300">
                Ask from uploaded AmiVerse files.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <StatusTile icon={Database} label="Source" value="Uploaded files" />
            <StatusTile
              icon={History}
              label="Session"
              value={isAuthenticated ? "History on" : "Guest chat"}
            />
            <StatusTile icon={ShieldCheck} label="Review" value="Admin fallback" />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                Prompt starters
              </p>
              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-zinc-300">
                {isAuthenticated ? "Synced" : "Guest"}
              </span>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-1 lg:overflow-visible lg:pb-0">
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
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{historyError}</span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {authAction}
          </div>
        </aside>

        <section className={`flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden lg:h-[calc(100svh-8.5rem)] ${surfaceClassName}`}>
          <header className="border-b border-slate-200 bg-white/[0.94] px-3 py-3 dark:border-white/10 dark:bg-white/[0.04] sm:px-5 sm:py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-cyan-200 shadow-sm dark:bg-cyan-300 dark:text-slate-950 sm:h-10 sm:w-10">
                  <Bot className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                    <span>AmiBot</span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200">
                      <Wifi className="h-3.5 w-3.5" />
                      Online
                    </span>
                  </div>
                  <h2 className="mt-0.5 truncate text-lg font-bold leading-6 text-slate-950 dark:text-white sm:mt-1 sm:text-2xl sm:leading-7">
                    AmiBot Knowledge Chat
                  </h2>
                </div>
              </div>

              <div className="hidden grid-cols-2 gap-2 text-xs text-slate-600 dark:text-zinc-300 min-[390px]:grid sm:flex">
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold dark:border-white/10 dark:bg-white/[0.06]">
                  <History className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" />
                  {isAuthenticated ? "History active" : "Guest mode"}
                </span>
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 font-semibold text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Grounded
                </span>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-200 bg-white/[0.9] px-3 py-2 dark:border-white/10 dark:bg-zinc-950/[0.88] lg:hidden">
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

          <div
            ref={messagesContainerRef}
            aria-live="polite"
            aria-relevant="additions text"
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain bg-slate-50/70 px-3 py-3 [-webkit-overflow-scrolling:touch] dark:bg-black/30 sm:px-5 sm:py-5"
            onScroll={handleMessagesScroll}
            role="log"
          >
            {historyLoading ? (
              <div className="flex min-h-full items-center justify-center text-slate-500 dark:text-zinc-300">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                  <History className="h-4 w-4 animate-pulse" />
                  Loading history...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={`${message.sender}-${index}-${(message.text || "").slice(0, 16)}`}
                    message={message}
                  />
                ))}
                {loading && <TypingIndicator />}
                <div aria-hidden="true" className="h-px" />
              </div>
            )}
          </div>

          <div className="min-w-0 max-w-full overflow-hidden border-t border-slate-200 bg-white/[0.96] px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 dark:border-white/10 dark:bg-zinc-950/[0.96] sm:p-4">
            <form
              ref={formRef}
              className="flex w-full min-w-0 max-w-full items-end gap-2"
              onSubmit={handleSubmit}
            >
              <textarea
                ref={inputRef}
                aria-label="Type your message"
                autoComplete="off"
                className="min-h-12 max-h-32 w-0 min-w-0 flex-1 resize-none overflow-y-hidden rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-950 shadow-inner shadow-slate-100/70 outline-none transition-colors placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/10 sm:px-4 sm:text-base"
                maxLength={2000}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask about uploaded knowledge..."
                rows={1}
                value={input}
              />

              <button
                aria-label="Send message"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-0 text-white shadow-[0_16px_28px_-20px_rgba(15,23,42,0.95)] transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/10"
                disabled={!canSend}
                title="Send message"
                type="submit"
              >
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <SendHorizontal className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {loading ? "Sending..." : "Send"}
                </span>
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between gap-3 px-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 sm:mt-2 sm:text-xs">
              <span>{isAuthenticated ? "History active" : "Guest mode"}</span>
              <span>{input.length}/2000</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default AmiBot;
