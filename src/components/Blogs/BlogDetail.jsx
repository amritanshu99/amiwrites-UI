// src/components/BlogDetails/BlogDetails.jsx
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "../../utils/api";
import Loader from "../Loader/Loader";
import { applySEO, SITE_URL } from "../../utils/seo";
import {
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Clock,
  Share2,
  Sparkles,
  UserRound,
} from "lucide-react";

const SummaryMarkdown = lazy(() => import("./SummaryMarkdown"));

const SummaryMarkdownFallback = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-4 w-1/3 bg-slate-200 dark:bg-zinc-900 rounded" />
    <div className="h-3 w-full bg-slate-200 dark:bg-zinc-900 rounded" />
    <div className="h-3 w-11/12 bg-slate-200 dark:bg-zinc-900 rounded" />
  </div>
);

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  // Summary states
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // Trending badge state
  const [isTrending, setIsTrending] = useState(false);

  // Ref to the summary section for smooth scrolling
  const summaryRef = useRef(null);

  // --- RL Tracking refs ---
  const readStartRef = useRef(null);
  const maxScrollRef = useRef(0);
  const sentReadEndRef = useRef(false);
  const lastPostIdRef = useRef(null);
  const startedRef = useRef(false); // TRUE only after we started real session

  // NEW: impression dedupe (in-memory only)
  const impressionGuardRef = useRef(new Set());

  // ref for the article content so we can inspect images / measure after render
  const articleRef = useRef(null);

  // Memoized fetch function
  const fetchBlog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://amiwrites-backend-app-2lp5.onrender.com/api/blogs/${id}`
      );
      setBlog(res.data);
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Clean plain text from blog HTML content (memoized)
  const plainTextContent = useMemo(() => {
    if (!blog?.content) return "";
    const temp = document.createElement("div");
    temp.innerHTML = blog.content;
    return (temp.textContent || temp.innerText || "").trim();
  }, [blog?.content]);

  const readingMinutes = useMemo(() => {
    if (!plainTextContent) return 1;
    const words = plainTextContent.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
  }, [plainTextContent]);

  const publishedLabel = useMemo(() => {
    const rawDate = blog?.date || blog?.createdAt;
    if (!rawDate) return "Date unavailable";

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [blog?.createdAt, blog?.date]);

  useEffect(() => {
    const fallbackDescription =
      "Read this AmiVerse blog for actionable engineering insights and practical learning takeaways.";
    const description = plainTextContent
      ? `${plainTextContent.slice(0, 155).trim()}${plainTextContent.length > 155 ? "..." : ""}`
      : fallbackDescription;

    applySEO({
      title: blog?.title ? `${blog.title} | AmiVerse Blog` : "Blog Details | AmiVerse",
      description,
      path: `/blogs/${id}`,
      type: "article",
      keywords: blog?.tags?.join(", "),
      structuredData: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog?.title || "AmiVerse Blog",
        description,
        mainEntityOfPage: `${SITE_URL}/blogs/${id}`,
        url: `${SITE_URL}/blogs/${id}`,
        author: {
          "@type": "Person",
          name: blog?.author || "Amritanshu Mishra",
        },
        datePublished: blog?.createdAt,
        dateModified: blog?.updatedAt || blog?.createdAt,
        publisher: {
          "@type": "Organization",
          name: "AmiVerse",
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/og-image.jpg`,
          },
        },
      },
    });
  }, [blog, id, plainTextContent]);

  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // fallback: scroll the window
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  useEffect(() => {
    if (!blog?.content || !articleRef.current) return;

    const images = articleRef.current.querySelectorAll(".blog-content img");
    images.forEach((img, index) => {
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      if (index > 0) img.setAttribute("fetchpriority", "low");
    });
  }, [blog?.content]);

  const currentURL = useMemo(
    () => (typeof window !== "undefined" ? window.location.href : ""),
    [pathname]
  );

  // Summarize handler
  const handleSummarize = useCallback(async () => {
    if (!plainTextContent) return;

    setSummarizing(true);
    setSummaryError("");
    setSummary("");

    try {
      const res = await axios.post(
        "https://amiwrites-backend-app-2lp5.onrender.com/api/gemini/generate",
        {
          // Backend returns { response: string }
          prompt: `Summarize this blog titled "${blog.title}" in clear, helpful language:\n\n${plainTextContent}`,
        }
      );

      const aiText = res?.data?.response || "";
      setSummary(aiText);
    } catch (err) {
      console.error("Summary error:", err);
      setSummaryError("Failed to generate summary. Please try again.");
    } finally {
      setSummarizing(false);
    }
  }, [blog?.title, plainTextContent]);

  // Scroll ONLY when summary is ready (no scroll on loading or error)
  useEffect(() => {
    if (summary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [summary]);

  // Copy summary helper
  const handleCopySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // noop
    }
  }, [summary]);

  // --- RL: Impression on page view (DEDUPED & POST-CONTENT via double rAF) ---
  useEffect(() => {
    const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com";
    const postId = blog?._id || id;

    // require a valid id and content in DOM to consider it a view
    if (!postId || !blog?.content) return;

    // Already sent during this component lifecycle?
    if (impressionGuardRef.current.has(postId)) return;

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;

    // Wait for layout/paint to settle without long debounces (Strict Mode safe)
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(async () => {
        if (cancelled) return;
        try {
          await axios.post(`${API_BASE}/api/trending-rl/events/impression`, { postId });
          impressionGuardRef.current.add(postId);
          // eslint-disable-next-line no-console
          console.log("TrendingRL: impression sent (double rAF)", { postId });
        } catch (e) {
          // silent
        }
      });
    });

    return () => {
      cancelled = true;
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [blog?.content, blog?._id, id]);

  // --- RL: Read-end analytics (start only AFTER blog.content is present & layout measurable) ---
  useEffect(() => {
    if (!blog?.content) {
      startedRef.current = false;
      lastPostIdRef.current = null;
      return;
    }

    const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com";
    const postId = blog?._id || id;

    const findScrollContainer = () => {
      const selectors = [
        ".h-screen.overflow-y-scroll.relative",
        "[data-scroll-container]",
        ".app-scroll-container",
        "main",
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return window;
    };
    const container = findScrollContainer();

    const computeScrollDepth = () => {
      try {
        if (container === window) {
          const doc = document.documentElement;
          const body = document.body;
          const total = Math.max(
            doc.scrollHeight || 0,
            body.scrollHeight || 0,
            doc.offsetHeight || 0,
            body.offsetHeight || 0
          );
          const visible = window.innerHeight || doc.clientHeight || 0;
          const scrollTop = window.scrollY || window.pageYOffset || doc.scrollTop || 0;
          if (!total) return 0;
          if (total <= visible) return 1;
          const reached = (scrollTop + visible) / total;
          return Math.min(1, Math.max(0, reached));
        } else {
          const total = container.scrollHeight || 0;
          const visible = container.clientHeight || 0;
          const scrollTop = container.scrollTop || 0;
          if (!total) return 0;
          if (total <= visible) return 1;
          const reached = (scrollTop + visible) / total;
          return Math.min(1, Math.max(0, reached));
        }
      } catch {
        return 0;
      }
    };

    let aborted = false;
    const waitForContentReady = async (timeoutMs = 1500) => {
      if (aborted) return false;

      if (!articleRef.current) {
        await new Promise((r) => setTimeout(r, 50));
      }

      const layoutMeasurable = () => {
        const { total, visible } =
          container === window
            ? {
                total: Math.max(
                  document.documentElement.scrollHeight || 0,
                  document.body.scrollHeight || 0
                ),
                visible: window.innerHeight || 0,
              }
            : {
                total: container && container.scrollHeight ? container.scrollHeight : 0,
                visible: container && container.clientHeight ? container.clientHeight : 0,
              };
        return total > 0 && visible > 0;
      };

      if (layoutMeasurable()) return true;

      const imgs = articleRef.current ? Array.from(articleRef.current.querySelectorAll("img")) : [];
      if (imgs.length === 0) {
        let elapsed = 0;
        const step = 50;
        while (!aborted && elapsed < timeoutMs) {
          if (layoutMeasurable()) return true;
          await new Promise((r) => setTimeout(r, step));
          elapsed += step;
        }
        return layoutMeasurable();
      }

      await new Promise((resolve) => {
        let settled = false;
        const to = setTimeout(() => {
          if (!settled) {
            settled = true;
            removeListeners();
            resolve();
          }
        }, timeoutMs);

        const onLoadOrError = () => {
          if (imgs.every((i) => i.complete)) {
            if (!settled) {
              settled = true;
              clearTimeout(to);
              removeListeners();
              resolve();
            }
          }
        };
        const removeListeners = () => {
          imgs.forEach((img) => {
            img.removeEventListener("load", onLoadOrError);
            img.removeEventListener("error", onLoadOrError);
          });
        };

        imgs.forEach((img) => {
          img.addEventListener("load", onLoadOrError);
          img.addEventListener("error", onLoadOrError);
        });

        onLoadOrError();
      });

      return layoutMeasurable();
    };

    const wordsForTimer = plainTextContent
      ? Math.max(50, plainTextContent.trim().split(/\s+/).length)
      : blog?.words
      ? Math.max(50, Number(blog.words) || 50)
      : 200;
    const expectedMs = (Math.max(50, wordsForTimer) / 200) * 60 * 1000;

    const TIMER_MIN_MS = 10000;
    const TIMER_MAX_MS = 120000;
    const timerDelay = Math.min(TIMER_MAX_MS, Math.max(TIMER_MIN_MS, Math.round(expectedMs * 0.6)));

    let timer = null;

    async function sendReadEnd(reason = "manual") {
      if (sentReadEndRef.current) {
        console.log("TrendingRL: sendReadEnd skipped (already sent)", { reason, postId });
        return;
      }
      sentReadEndRef.current = true;

      const start = readStartRef.current || performance.now();
      const dwell_ms = Math.max(0, Math.round(performance.now() - start));

      let scroll_depth =
        typeof maxScrollRef.current === "number" ? maxScrollRef.current : computeScrollDepth();

      const total =
        container === window
          ? Math.max(document.documentElement.scrollHeight || 0, document.body.scrollHeight || 0)
          : (container && container.scrollHeight) || 0;
      const visible =
        container === window ? window.innerHeight || 0 : (container && container.clientHeight) || 0;

      if (total <= visible) {
        scroll_depth = dwell_ms < 5000 ? 0 : 1;
      } else {
        scroll_depth = Math.min(1, Math.max(0, Number(scroll_depth) || 0));
      }

      console.log("TrendingRL: sendReadEnd -> payload", {
        reason,
        postId,
        dwell_ms,
        scroll_depth,
        wordsForTimer,
        expectedMs,
        timerDelay,
        maxScrollSeen: maxScrollRef.current,
      });

      try {
        await axios.post(`${API_BASE}/api/trending-rl/events/read-end`, {
          postId,
          dwell_ms,
          scroll_depth,
        });
        console.log("TrendingRL: read-end POST success", { postId });
      } catch (err) {
        console.warn("TrendingRL: read-end POST failed", err?.message || err);
      }
    }

    const onScroll = () => {
      const sc = computeScrollDepth();
      if (sc > maxScrollRef.current) {
        maxScrollRef.current = sc;
        console.log("TrendingRL: scroll update", { sc, maxSeen: maxScrollRef.current });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendReadEnd("visibility");
    };
    const onBeforeUnload = () => sendReadEnd("beforeunload");

    let attached = false;
    let localAborted = false;

    (async () => {
      const ready = await waitForContentReady();
      if (localAborted) return;

      const isNewPost = lastPostIdRef.current !== postId;
      if (isNewPost) {
        lastPostIdRef.current = postId;
        readStartRef.current = performance.now();
        maxScrollRef.current = 0;
        sentReadEndRef.current = false;
        console.log("TrendingRL: starting session after content ready", { postId, ready });
      } else {
        console.log("TrendingRL: session already started for post (no restart)", { postId });
      }

      if (container === window) {
        window.addEventListener("scroll", onScroll, { passive: true });
      } else {
        container.addEventListener("scroll", onScroll, { passive: true });
      }
      document.addEventListener("visibilitychange", onVisibilityChange);
      // FIX: use the correctly cased handler name
      window.addEventListener("beforeunload", onBeforeUnload);

      attached = true;

      try {
        const immediate = computeScrollDepth();
        if (immediate > maxScrollRef.current) maxScrollRef.current = immediate;
        console.log("TrendingRL: initial scroll sample (post-layout)", {
          immediate,
          maxNow: maxScrollRef.current,
          postId,
        });
      } catch {
        // noop
      }

      startedRef.current = true;

      if (!sentReadEndRef.current) {
        console.log("TrendingRL: timer set", { timerDelay, wordsForTimer, expectedMs, postId });
        timer = setTimeout(() => sendReadEnd("timer"), timerDelay);
      }
    })();

    return () => {
      localAborted = true;
      aborted = true;
      if (timer) clearTimeout(timer);

      try {
        if (attached) {
          if (container === window) {
            window.removeEventListener("scroll", onScroll);
          } else {
            container.removeEventListener("scroll", onScroll);
          }
          document.removeEventListener("visibilitychange", onVisibilityChange);
          window.removeEventListener("beforeunload", onBeforeUnload);
        }
      } catch {
        // ignore
      }

      if (startedRef.current && !sentReadEndRef.current) {
        sendReadEnd("unmount");
      } else {
        console.log(
          "TrendingRL: cleanup - session not started or already sent; skipping unmount send",
          {
            postId,
            started: startedRef.current,
            alreadySent: sentReadEndRef.current,
          }
        );
      }
    };
  }, [blog?.content, id, plainTextContent]);

  // --- Trending badge: check if this blog is currently in the rail ---
  useEffect(() => {
    if (!blog?._id) return;
    const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com";
    const url = `${API_BASE}/api/trending-rl/trending?limit=2&all=1`;

    (async () => {
      try {
        const { data } = await axios.get(url);
        const items = Array.isArray(data?.items) ? data.items : [];
        const found = items.some(
          (p) => String(p?._id) === String(blog._id) || (blog.slug && p?.slug === blog.slug)
        );
        setIsTrending(found);
      } catch {
        setIsTrending(false);
      }
    })();
  }, [blog?._id, blog?.slug]);

  if (loading)
    return (
      <div className="amiverse-premium-light-page flex min-h-screen items-center justify-center p-6 dark:bg-none dark:bg-black">
        <Loader />
      </div>
    );

  if (!blog)
    return (
      <div className="amiverse-premium-light-page flex min-h-screen items-center justify-center p-6 dark:bg-none dark:bg-black">
        <p className="rounded-2xl border border-red-200 bg-white/90 px-5 py-4 text-xl font-semibold text-red-600 shadow-sm dark:border-red-900/60 dark:bg-black dark:text-red-300">
          Blog not found.
        </p>
      </div>
    );

  return (
    <main className="amiverse-premium-light-page flex min-h-screen justify-center px-3 pb-28 pt-8 dark:bg-none dark:bg-black sm:px-6 sm:pb-16 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
      <article
        ref={articleRef}
        className="animate-fadeIn w-full max-w-4xl overflow-hidden rounded-[1.35rem] border border-white/90 bg-white/95 p-5 text-black shadow-[0_34px_90px_-54px_rgba(15,23,42,0.38)] ring-1 ring-sky-100/80 backdrop-blur dark:border-zinc-900 dark:bg-black dark:text-zinc-50 dark:ring-white/5 dark:shadow-[0_34px_90px_-54px_rgba(0,0,0,0.98)] sm:rounded-[1.7rem] sm:p-8 md:p-12"
      >
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
            AmiVerse Blog
          </span>
          {isTrending && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800/80 dark:bg-amber-900/35 dark:text-amber-200"
              title="This post is currently in the trending rail"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 0s1 2.5 1 5.5C14.5 10 10 11 10 15c0 2.761 2.239 5 5 5 3.314 0 6-2.686 6-6 0-4-3-6-3-9 0-2 1-5 1-5s-3 1-5.5 5C12 3 13.5 0 13.5 0z"/>
              </svg>
              Trending
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-6 break-words font-sans text-3xl font-bold leading-tight text-slate-900 dark:text-cyan-200 sm:text-4xl sm:leading-tight">
          {blog.title}
        </h1>

        {/* Meta + Actions */}
        <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600 shadow-sm dark:border-zinc-900 dark:bg-zinc-950/45 dark:text-zinc-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <time dateTime={blog.date || blog.createdAt} className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-sky-600 dark:text-cyan-300" />
              {publishedLabel}
            </time>
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-sky-600 dark:text-cyan-300" />
              <span>
                By{" "}
                <span className="font-semibold text-sky-700 dark:text-cyan-200">
                  Amritanshu
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-600 dark:text-cyan-300" />
              {readingMinutes} min read
            </span>
          </div>

          {/* Summary Button Group */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              onClick={handleSummarize}
              disabled={summarizing || !plainTextContent}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.8)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_22px_44px_-26px_rgba(15,23,42,0.9)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-300 dark:text-zinc-950 dark:hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:focus-visible:ring-cyan-300/20 motion-reduce:transform-none"
              aria-label="Generate AI summary"
              type="button"
            >
              {summarizing ? (
                <>
                  <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      opacity="0.25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Summary
                </>
              )}
            </button>

            <button
              onClick={handleCopySummary}
              disabled={!summary}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-black dark:text-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:focus-visible:ring-white/10 motion-reduce:transform-none"
              aria-label="Copy AI summary"
              title={summary ? "Copy summary" : "No summary to copy yet"}
              type="button"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Copy
            </button>
          </div>
        </div>

        {/* Blog Content (HTML from CMS) */}
        <div
          className="blog-content max-w-none overflow-hidden text-slate-800 dark:text-zinc-100"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* AI Summary Section */}
        {(summary || summarizing || summaryError) && (
          <section
            ref={summaryRef}
            className="mt-12 rounded-[1.25rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))] p-5 shadow-[0_22px_58px_-44px_rgba(15,23,42,0.36)] dark:border-zinc-900 dark:bg-none dark:bg-black sm:p-7"
            aria-live="polite"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-cyan-200 sm:text-2xl">
                  AI Summary
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-300">
                  Quick, helpful overview generated from this article.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {summary && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready
                  </span>
                )}
                {summarizing && (
                  <span className="rounded-full border border-indigo-200/70 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
                    Generating...
                  </span>
                )}
              </div>
            </div>

            {summaryError && (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/20 dark:text-red-300">{summaryError}</p>
            )}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-black sm:p-6">
              {summarizing && (
                // Lightweight skeleton loading
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-zinc-900 rounded"></div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-zinc-900 rounded"></div>
                  <div className="h-3 w-11/12 bg-slate-200 dark:bg-zinc-900 rounded"></div>
                  <div className="h-3 w-10/12 bg-slate-200 dark:bg-zinc-900 rounded"></div>
                </div>
              )}

              {!summarizing && !summary && !summaryError && (
                <p className="text-slate-600 dark:text-zinc-200">
                  Click <span className="font-medium">AI Summary</span> above to generate a quick overview of this article.
                </p>
              )}

              {summary && (
                <div className="summary-content max-w-none leading-relaxed text-slate-800 dark:text-zinc-50">
                  <Suspense fallback={<SummaryMarkdownFallback />}>
                    <SummaryMarkdown summary={summary} />
                  </Suspense>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Social Share Buttons */}
        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-6 dark:border-zinc-900">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
            <Share2 className="h-4 w-4" />
            Share
          </span>
          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              currentURL
            )}&text=${encodeURIComponent(blog.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-zinc-800 dark:bg-black dark:text-cyan-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-950 motion-reduce:transform-none"
            aria-label="Share on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.07V8A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
            <span className="hidden sm:inline">Tweet</span>
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              currentURL
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-zinc-800 dark:bg-black dark:text-cyan-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-950 motion-reduce:transform-none"
            aria-label="Share on Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 12a10 10 0 10-11 9.95v-7.04H8.6v-2.9h2.4v-2.2c0-2.4 1.4-3.8 3.6-3.8 1 0 2 .07 2 .07v2.3h-1.1c-1.1 0-1.4.68-1.4 1.38v1.7h2.4l-.38 2.9h-2.02V22A10 10 0 0022 12z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </a>
        </div>
      </article>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
        .blog-content {
          font-size: 1.04rem;
          line-height: 1.85;
        }
        .blog-content > * + * {
          margin-top: 1.15rem;
        }
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4 {
          color: #0f172a;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-weight: 750;
          line-height: 1.2;
          margin-top: 2rem;
          overflow-wrap: anywhere;
        }
        .blog-content h1 { font-size: 2.35rem; }
        .blog-content h2 { font-size: 1.85rem; }
        .blog-content h3 { font-size: 1.45rem; }
        .blog-content p,
        .blog-content li {
          overflow-wrap: anywhere;
        }
        .blog-content a,
        .summary-content a {
          color: #0369a1;
          font-weight: 650;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 4px;
        }
        .blog-content ul,
        .blog-content ol,
        .summary-content ul,
        .summary-content ol {
          padding-left: 1.35rem;
        }
        .blog-content li + li,
        .summary-content li + li {
          margin-top: 0.45rem;
        }
        .blog-content img {
          border-radius: 1rem;
          box-shadow: 0 24px 64px -42px rgba(15, 23, 42, 0.42);
          height: auto;
          max-width: 100%;
        }
        .blog-content blockquote {
          border-left: 4px solid #38bdf8;
          background: rgba(240, 249, 255, 0.74);
          border-radius: 0 1rem 1rem 0;
          color: #334155;
          font-style: italic;
          padding: 1rem 1.15rem;
        }
        .blog-content pre,
        .summary-content pre {
          background: #0f172a;
          border-radius: 1rem;
          color: #e2e8f0;
          overflow-x: auto;
          padding: 1rem;
        }
        .blog-content code,
        .summary-content code {
          overflow-wrap: anywhere;
        }
        .blog-content table {
          display: block;
          max-width: 100%;
          overflow-x: auto;
          white-space: nowrap;
        }
        .summary-content > * + * {
          margin-top: 0.9rem;
        }
        .summary-content h1,
        .summary-content h2,
        .summary-content h3 {
          color: #0f172a;
          font-weight: 750;
          line-height: 1.25;
        }
        .dark .blog-content h1,
        .dark .blog-content h2,
        .dark .blog-content h3,
        .dark .blog-content h4,
        .dark .summary-content h1,
        .dark .summary-content h2,
        .dark .summary-content h3 {
          color: #a5f3fc;
        }
        .dark .blog-content a,
        .dark .summary-content a {
          color: #67e8f9;
        }
        .dark .blog-content blockquote {
          background: rgba(24, 24, 27, 0.8);
          border-left-color: #67e8f9;
          color: #d4d4d8;
        }
        @media (max-width: 640px) {
          .blog-content {
            font-size: 1rem;
            line-height: 1.78;
          }
          .blog-content h1 { font-size: 1.85rem; }
          .blog-content h2 { font-size: 1.5rem; }
          .blog-content h3 { font-size: 1.25rem; }
          .blog-content > * + * {
            margin-top: 1rem;
          }
        }
      `}</style>
    </main>
  );
};

export default BlogDetails;
