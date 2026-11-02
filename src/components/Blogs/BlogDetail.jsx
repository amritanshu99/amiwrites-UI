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
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "../../utils/api";
import { applySEO, SITE_URL } from "../../utils/seo";
import { sanitizeBlogHtml, sanitizedHtmlToText } from "../../utils/sanitizeHtml";
import {
  createTrendingEventId,
  sendTrendingEvent,
} from "../../utils/trendingAnalytics";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Link2,
  TrendingUp,
  CheckCircle2,
  Clipboard,
  Clock,
  Share2,
  Sparkles,
} from "lucide-react";

import { useTrendingBlogs } from "../../hooks/useTrendingBlogs";
import { articleOutline, blogPublicationDate } from "./blogPresentation";
import "./blogs.css";

const SummaryMarkdown = lazy(() => import("./SummaryMarkdown"));
const MAX_DWELL_MS = 6 * 60 * 60 * 1000;
const MAX_TRACKING_WORDS = 120000;
const MAX_NONTERMINAL_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

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
  const [loadError, setLoadError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState("");
  const { pathname } = useLocation();

  // Summary states
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const { items: trendingItems } = useTrendingBlogs(Boolean(blog?._id));
  const isTrending = trendingItems.some((item) => String(item._id) === String(blog?._id));

  // Ref to the summary section for smooth scrolling
  const summaryRef = useRef(null);

  const articleRef = useRef(null);
  const fetchGenerationRef = useRef(0);
  const summaryGenerationRef = useRef(0);
  const summaryControllerRef = useRef(null);
  const sharedRef = useRef(false);
  const flushReadEndRef = useRef(null);

  const sanitizedBlogContent = useMemo(
    () => sanitizeBlogHtml(blog?.content),
    [blog?.content],
  );

  const outline = useMemo(() => articleOutline(sanitizedBlogContent), [sanitizedBlogContent]);

  // Derive summary text only from the same sanitized HTML that is rendered.
  const plainTextContent = useMemo(() => {
    return sanitizedHtmlToText(sanitizedBlogContent);
  }, [sanitizedBlogContent]);

  const readingMinutes = useMemo(() => {
    if (!plainTextContent) return 1;
    const words = plainTextContent.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
  }, [plainTextContent]);

  const trackingWords = useMemo(() => {
    const serverWords = Number(blog?.words);
    if (Number.isFinite(serverWords) && serverWords > 0) {
      return Math.min(MAX_TRACKING_WORDS, Math.max(50, serverWords));
    }

    const fallbackWords = plainTextContent
      ? plainTextContent.split(/\s+/).filter(Boolean).length
      : 0;
    return Math.min(MAX_TRACKING_WORDS, Math.max(50, fallbackWords));
  }, [blog?.words, plainTextContent]);

  const publishedLabel = useMemo(() => {
    const rawDate = blogPublicationDate(blog);
    if (!rawDate) return "Date unavailable";

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [blog]);

  useEffect(() => {
    if (loading) return;

    if (!blog) {
      applySEO({
        title:
          loadError === "not-found"
            ? "Blog Post Not Found | AmiVerse"
            : "Blog Temporarily Unavailable | AmiVerse",
        description:
          loadError === "not-found"
            ? "The requested AmiVerse blog post could not be found."
            : "This AmiVerse blog post is temporarily unavailable. Please try again shortly.",
        path: `/blogs/${id}`,
        noindex: loadError === "not-found",
      });
      return;
    }

    const fallbackDescription =
      "Read this AmiVerse blog for actionable engineering insights and practical learning takeaways.";
    const description = plainTextContent
      ? `${plainTextContent.slice(0, 155).trim()}${plainTextContent.length > 155 ? "..." : ""}`
      : fallbackDescription;

    const publishedTime = blog.publishedAt || blog.date || blog.createdAt;
    const modifiedTime = blog.updatedAt || publishedTime;
    const articleUrl = `${SITE_URL}/blogs/${id}`;
    const articleImage =
      blog.image || blog.imageUrl || blog.coverImage || `${SITE_URL}/og-image.jpg`;

    applySEO({
      title: `${blog.title} | AmiVerse Blog`,
      description,
      path: `/blogs/${id}`,
      image: articleImage,
      imageAlt: `${blog.title} – AmiVerse blog by Amritanshu Mishra`,
      type: "article",
      keywords: blog?.tags?.join(", "),
      publishedTime,
      modifiedTime,
      section: blog.category || "Software Engineering",
      tags: blog.tags || [],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        headline: blog.title,
        description,
        mainEntityOfPage: { "@id": `${articleUrl}#webpage` },
        url: articleUrl,
        image: articleImage,
        author: { "@id": `${SITE_URL}/#person` },
        publisher: { "@id": `${SITE_URL}/#person` },
        datePublished: publishedTime,
        dateModified: modifiedTime,
        inLanguage: "en-IN",
        articleSection: blog.category || "Software Engineering",
        keywords: Array.isArray(blog.tags) ? blog.tags.join(", ") : undefined,
        wordCount: blog.words || plainTextContent.split(/\s+/).filter(Boolean).length,
      },
    });
  }, [blog, id, loadError, loading, plainTextContent]);

  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "auto",
      });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname]);

  useEffect(() => {
    const controller = new AbortController();
    const generation = fetchGenerationRef.current + 1;
    fetchGenerationRef.current = generation;

    setLoading(true);
    setBlog(null);
    setLoadError("");
    setCopyFeedback("");
    summaryGenerationRef.current += 1;
    summaryControllerRef.current?.abort();
    summaryControllerRef.current = null;
    setSummary("");
    setSummarizing(false);
    setSummaryError("");

    (async () => {
      try {
        const response = await axios.get(`/api/blogs/${id}`, {
          signal: controller.signal,
          timeout: 15000,
        });
        if (!controller.signal.aborted && fetchGenerationRef.current === generation) {
          setBlog(response.data);
        }
      } catch (error) {
        const cancelled = controller.signal.aborted || error?.code === "ERR_CANCELED";
        if (!cancelled && fetchGenerationRef.current === generation) {
          setBlog(null);
          setLoadError(
            [400, 404].includes(error?.response?.status)
              ? "not-found"
              : "unavailable",
          );
        }
      } finally {
        if (!controller.signal.aborted && fetchGenerationRef.current === generation) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
      summaryControllerRef.current?.abort();
    };
  }, [id, retryVersion]);

  useEffect(() => {
    if (!sanitizedBlogContent || !articleRef.current) return;

    const images = articleRef.current.querySelectorAll(".blog-content img");
    images.forEach((img, index) => {
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      if (index > 0) img.setAttribute("fetchpriority", "low");
    });
  }, [sanitizedBlogContent]);

  const currentURL = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}${pathname}` : ""),
    [pathname]
  );

  // Summarize handler
  const handleSummarize = useCallback(async () => {
    if (!plainTextContent || !blog?._id) return;

    summaryControllerRef.current?.abort();
    const controller = new AbortController();
    const generation = summaryGenerationRef.current + 1;
    summaryGenerationRef.current = generation;
    summaryControllerRef.current = controller;

    setSummarizing(true);
    setSummaryError("");
    setSummary("");

    try {
      const res = await axios.post(
        "/api/gemini/generate",
        {
          // Backend returns { response: string }
          prompt: `Summarize this blog titled "${blog.title}" in clear, helpful language:\n\n${plainTextContent}`,
        },
        { signal: controller.signal },
      );

      if (controller.signal.aborted || summaryGenerationRef.current !== generation) return;
      const aiText = res?.data?.response || "";
      setSummary(aiText);
    } catch (err) {
      const cancelled = controller.signal.aborted || err?.code === "ERR_CANCELED";
      if (cancelled || summaryGenerationRef.current !== generation) return;
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message;
      setSummaryError(apiMessage || "Failed to generate summary. Please try again.");
    } finally {
      if (!controller.signal.aborted && summaryGenerationRef.current === generation) {
        setSummarizing(false);
        if (summaryControllerRef.current === controller) summaryControllerRef.current = null;
      }
    }
  }, [blog?._id, blog?.title, plainTextContent]);

  // Scroll ONLY when summary is ready (no scroll on loading or error)
  useEffect(() => {
    if (summary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  }, [summary]);

  // Copy summary helper
  const handleCopySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyFeedback("Summary copied.");
    } catch {
      setCopyFeedback("Couldn’t copy. Please select and copy the text.");
    }
  }, [summary]);

  const handleShare = useCallback(() => {
    sharedRef.current = true;
    const request = flushReadEndRef.current?.();
    if (request && typeof request.catch === "function") request.catch(() => {});
  }, []);

  useEffect(() => {
    const postId = blog?._id;
    const article = articleRef.current;
    if (!postId || !blog?.content || !article) {
      flushReadEndRef.current = null;
      return undefined;
    }

    const explicitContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative",
    );
    const container = explicitContainer || window;
    const thresholdMs = Math.min(
      MAX_DWELL_MS,
      Math.round((trackingWords / 200) * 60 * 1000 * 0.6),
    );
    const eventId = createTrendingEventId();
    const now = () => performance.now();
    const clamp = (value) => Math.min(1, Math.max(0, Number(value) || 0));

    let visibleDwellMs = 0;
    let visibleStartedAt = document.visibilityState === "hidden" ? null : now();
    let maxScrollDepth = 0;
    let thresholdTimer = null;
    let retryTimer = null;
    let retryPending = false;
    let completed = false;
    let terminalStarted = false;
    let disposed = false;
    let inFlight = null;
    let nonterminalAttempts = 0;
    let retryDelayMs = RETRY_BASE_DELAY_MS;

    sharedRef.current = false;

    const currentDwellMs = () =>
      visibleDwellMs +
      (visibleStartedAt === null ? 0 : Math.max(0, now() - visibleStartedAt));

    const computeArticleScrollDepth = () => {
      const currentArticle = articleRef.current;
      if (!currentArticle) return 0;

      const articleRect = currentArticle.getBoundingClientRect();
      const articleHeight = Math.max(
        0,
        articleRect.height || currentArticle.scrollHeight || currentArticle.offsetHeight || 0,
      );
      if (!articleHeight) return 0;

      let viewportBottom;
      if (container === window) {
        viewportBottom = window.innerHeight || document.documentElement.clientHeight || 0;
      } else {
        const containerRect = container.getBoundingClientRect();
        viewportBottom =
          containerRect.bottom > containerRect.top
            ? containerRect.bottom
            : containerRect.top + (container.clientHeight || 0);
      }

      return clamp((viewportBottom - articleRect.top) / articleHeight);
    };

    const sampleScrollDepth = () => {
      maxScrollDepth = Math.max(maxScrollDepth, computeArticleScrollDepth());
      return maxScrollDepth;
    };

    const clearThresholdTimer = () => {
      if (thresholdTimer !== null) clearTimeout(thresholdTimer);
      thresholdTimer = null;
    };

    const clearRetryTimer = () => {
      if (retryTimer !== null) clearTimeout(retryTimer);
      retryTimer = null;
    };

    const pauseVisibleTime = () => {
      if (visibleStartedAt !== null) {
        visibleDwellMs += Math.max(0, now() - visibleStartedAt);
        visibleStartedAt = null;
      }
      clearThresholdTimer();
    };

    const buildPayload = () => ({
      postId,
      dwell_ms: Math.min(MAX_DWELL_MS, Math.max(0, Math.round(currentDwellMs()))),
      scroll_depth: clamp(maxScrollDepth),
      shared: Boolean(sharedRef.current),
    });

    const isRetryableDeliveryError = (error) => {
      const status = Number(error?.status ?? error?.response?.status);
      if (!Number.isFinite(status) || status <= 0) return true;
      return status === 408 || status === 429 || status >= 500;
    };

    const armRetryTimer = () => {
      if (disposed || completed || terminalStarted) return;
      clearRetryTimer();
      if (document.visibilityState === "hidden") return;

      retryPending = false;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void deliver(false).catch(() => {});
      }, retryDelayMs);
    };

    const scheduleRetry = (error) => {
      if (
        !isRetryableDeliveryError(error) ||
        nonterminalAttempts >= MAX_NONTERMINAL_ATTEMPTS ||
        disposed ||
        completed ||
        terminalStarted
      ) {
        retryPending = false;
        return;
      }

      retryDelayMs = RETRY_BASE_DELAY_MS * 2 ** Math.max(0, nonterminalAttempts - 1);
      retryPending = true;
      armRetryTimer();
    };

    const deliver = (terminal, payloadOverride) => {
      if (completed) return Promise.resolve();
      if (inFlight) return inFlight;

      clearThresholdTimer();
      if (!terminal) nonterminalAttempts += 1;
      const request = sendTrendingEvent("read-end", payloadOverride || buildPayload(), {
        eventId,
        attempts: terminal ? 2 : 1,
      });
      inFlight = request;

      request.then(
        () => {
          completed = true;
          retryPending = false;
          clearRetryTimer();
          clearThresholdTimer();
        },
        (error) => {
          if (!terminal) scheduleRetry(error);
        },
      ).finally(() => {
        if (inFlight === request) inFlight = null;
      });

      return request;
    };

    const scheduleThresholdTimer = () => {
      clearThresholdTimer();
      if (
        completed ||
        terminalStarted ||
        inFlight ||
        document.visibilityState === "hidden" ||
        visibleStartedAt === null
      ) {
        return;
      }

      const remainingMs = Math.max(0, thresholdMs - currentDwellMs());
      thresholdTimer = setTimeout(() => {
        thresholdTimer = null;
        void deliver(false).catch(() => {});
      }, remainingMs);
    };

    const finalize = () => {
      if (completed || terminalStarted) return;
      terminalStarted = true;
      pauseVisibleTime();
      clearRetryTimer();
      retryPending = false;

      const terminalPayload = buildPayload();
      if (
        terminalPayload.dwell_ms < 1000 &&
        terminalPayload.scroll_depth < 0.05 &&
        !terminalPayload.shared
      ) {
        completed = true;
        return;
      }

      if (inFlight) {
        const pendingRequest = inFlight;
        pendingRequest.then(
          () => {},
          () => {
            if (inFlight === pendingRequest) inFlight = null;
            if (!completed) void deliver(true, terminalPayload).catch(() => {});
          },
        );
        return;
      }

      void deliver(true, terminalPayload).catch(() => {});
    };

    const onScroll = () => sampleScrollDepth();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pauseVisibleTime();
        if (retryTimer !== null) {
          clearRetryTimer();
          retryPending = true;
        }
        return;
      }

      if (visibleStartedAt === null) visibleStartedAt = now();
      if (retryPending) armRetryTimer();
      else scheduleThresholdTimer();
    };
    const onTerminalPageEvent = () => finalize();
    const flushReadEnd = () => deliver(false);

    flushReadEndRef.current = flushReadEnd;
    scheduleThresholdTimer();

    const scrollTarget = container === window ? window : container;
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onTerminalPageEvent);
    window.addEventListener("beforeunload", onTerminalPageEvent);

    return () => {
      disposed = true;
      scrollTarget.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onTerminalPageEvent);
      window.removeEventListener("beforeunload", onTerminalPageEvent);
      clearThresholdTimer();
      clearRetryTimer();
      finalize();
      if (flushReadEndRef.current === flushReadEnd) flushReadEndRef.current = null;
    };
  }, [blog?._id, blog?.content, trackingWords]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentURL);
      setCopyFeedback("Link copied.");
      handleShare();
    } catch {
      setCopyFeedback("Couldn’t copy. Please copy the address from your browser.");
    }
  };

  useEffect(() => {
    if (!copyFeedback) return undefined;
    const timer = setTimeout(() => setCopyFeedback(""), 4000);
    return () => clearTimeout(timer);
  }, [copyFeedback]);

  if (loading) return (
    <div className="journal-page journal-reader-loading" role="status" aria-label="Loading article">
      <div className="journal-reader-skeleton journal-skeleton">
        <div className="journal-skeleton__label" />
        <div className="journal-skeleton__title" />
        <div className="journal-skeleton__title journal-skeleton__short" />
        <div className="journal-skeleton__footer" />
        <div className="journal-skeleton__line" /><div className="journal-skeleton__line" />
        <div className="journal-skeleton__line" /><div className="journal-skeleton__line" />
      </div>
      <span className="sr-only">Loading article…</span>
    </div>
  );

  if (!blog) return (
    <div className="journal-page journal-reader-loading">
      <div className="journal-empty" role="alert">
        <BookOpen size={30} aria-hidden="true" />
        <h1>{loadError === "not-found" ? "Blog not found." : "Blog temporarily unavailable."}</h1>
        <p>{loadError === "not-found" ? "This story may have moved. There’s more to discover in the journal." : "We couldn’t connect to this story. Please try again."}</p>
        <div className="journal-actions">
          {loadError !== "not-found" && <button type="button" className="journal-button" onClick={() => setRetryVersion((value) => value + 1)}>Try again</button>}
          <Link className="journal-button journal-button--primary" to="/blogs">Browse all blog posts <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="journal-page journal-reader">
      <div className="journal-reader-shell">
        <nav aria-label="Breadcrumb" className="journal-breadcrumb">
          <Link to="/blogs"><ArrowLeft size={16} aria-hidden="true" /> All articles</Link>
          <span>The AmiVerse Journal</span>
        </nav>
        <article ref={articleRef}>
          <header className="journal-article-header">
            <div className="journal-article-labels">
              <span className="journal-category">{blog.category || "Perspectives"}</span>
              {isTrending && <span className="journal-trending"><TrendingUp size={14} aria-hidden="true" /> Trending</span>}
            </div>
            <h1>{blog.title}</h1>
            <div className="journal-byline">
              <Link to="/" className="journal-author"><span className="journal-avatar" aria-hidden="true">AM</span><span><strong>Amritanshu Mishra</strong><span>Writer &amp; software engineer</span></span></Link>
              <div className="journal-article-meta">
                <time dateTime={blogPublicationDate(blog)}><CalendarDays size={15} aria-hidden="true" />{publishedLabel}</time>
                <span><Clock size={15} aria-hidden="true" />{readingMinutes} min read</span>
              </div>
            </div>
          </header>

          <div className="journal-reading-tools">
            <span><BookOpen size={17} aria-hidden="true" /> A moment to read. A little more to think about.</span>
            <div className="journal-actions">
              <button onClick={handleSummarize} disabled={summarizing || !plainTextContent}
                className="journal-button journal-button--primary" aria-label="Generate AI summary" type="button">
                <Sparkles size={16} aria-hidden="true" />{summarizing ? "Summarizing…" : "AI Summary"}
              </button>
              <button onClick={handleCopyLink} className="journal-button" aria-label="Copy article link" type="button"><Link2 size={16} aria-hidden="true" /> Copy link</button>
            </div>
          </div>
          <p className="journal-copy-feedback" role="status">{copyFeedback}</p>

          <div className={`journal-reading-layout${outline.headings.length > 1 ? " journal-reading-layout--with-toc" : ""}`}>
            {outline.headings.length > 1 && (
              <aside className="journal-toc">
                <details open>
                  <summary>In this article <ChevronDown size={15} aria-hidden="true" /></summary>
                  <nav aria-label="Table of contents">
                    {outline.headings.map((heading) => <a key={heading.id} href={`#${heading.id}`} className={heading.level === 3 ? "journal-toc__subheading" : undefined}>{heading.title}</a>)}
                  </nav>
                </details>
              </aside>
            )}
            <div className="journal-reading-main">
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: outline.html }} />

              {(summary || summarizing || summaryError) && (
                <section ref={summaryRef} className="journal-summary" aria-live="polite" aria-busy={summarizing}>
                  <div className="journal-summary__header">
                    <div><p className="journal-kicker"><Sparkles size={14} aria-hidden="true" /> THE QUICK READ</p><h2>AI Summary</h2></div>
                    {summary && <button onClick={handleCopySummary} className="journal-button" aria-label="Copy AI summary" type="button"><Clipboard size={15} aria-hidden="true" /> Copy summary</button>}
                  </div>
                  <p className="journal-summary__description">A quick overview generated from this article.</p>
                  {summaryError && <div role="alert" className="journal-summary__error"><p>{summaryError}</p><button className="journal-button" onClick={handleSummarize} type="button">Try summary again</button></div>}
                  {summarizing && <SummaryMarkdownFallback />}
                  {summary && <div className="summary-content"><Suspense fallback={<SummaryMarkdownFallback />}><SummaryMarkdown summary={summary} /></Suspense></div>}
                  {summary && <span className="journal-summary__ready"><CheckCircle2 size={14} aria-hidden="true" /> Summary ready</span>}
                </section>
              )}

              <footer className="journal-article-footer">
                <div><p className="journal-kicker">WORTH SHARING?</p><h2>Pass the perspective on.</h2><p>Know someone who would enjoy this read?</p></div>
                <div className="journal-actions">
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentURL)}&text=${encodeURIComponent(blog.title)}`}
                    onClick={handleShare} target="_blank" rel="noopener noreferrer" className="journal-button" aria-label="Share on Twitter">Share on X <ArrowUpRight size={15} aria-hidden="true" /></a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentURL)}`}
                    onClick={handleShare} target="_blank" rel="noopener noreferrer" className="journal-button" aria-label="Share on Facebook"><Share2 size={15} aria-hidden="true" /> Facebook</a>
                </div>
              </footer>
              <Link to="/blogs" className="journal-back-link"><ArrowLeft size={17} aria-hidden="true" /> Keep exploring the journal <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetails;
