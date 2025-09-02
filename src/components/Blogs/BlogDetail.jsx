// src/components/BlogDetails/BlogDetails.jsx
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "../../utils/api";
import Loader from "../Loader/Loader";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  // Summary states
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // Trending badge state (ADD)
  const [isTrending, setIsTrending] = useState(false);

  // Ref to the summary section for smooth scrolling
  const summaryRef = useRef(null);

  // --- RL Tracking refs (already added) ---
  const readStartRef = useRef(null);
  const maxScrollRef = useRef(0);
  const sentReadEndRef = useRef(false);

  // Memoized fetch function to satisfy react-hooks/exhaustive-deps
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

  useEffect(() => {
    document.title = "Blog Details";
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, []);

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

  const currentURL = typeof window !== "undefined" ? window.location.href : "";

  // Clean plain text from blog HTML content (memoized)
  const plainTextContent = useMemo(() => {
    if (!blog?.content) return "";
    const temp = document.createElement("div");
    temp.innerHTML = blog.content;
    return (temp.textContent || temp.innerText || "").trim();
  }, [blog]);

  // Summarize handler
  const handleSummarize = async () => {
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
  };

  // Scroll ONLY when summary is ready (no scroll on loading or error)
  useEffect(() => {
    if (summary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [summary]);

  // Copy summary helper
  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // noop if clipboard fails
    }
  };

  // --- RL: Impression on page view ---
  useEffect(() => {
    const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com";
    if (!blog?._id && !id) return; // need an identifier
    const postId = blog?._id || id; // controller accepts _id or slug-like ref

    (async () => {
      try {
        await axios.post(`${API_BASE}/api/trending-rl/events/impression`, { postId });
      } catch (e) {
        // silent fail is fine
      }
    })();
  }, [blog?._id, id]);

 // --- RL: Read-end analytics (dwell + scroll) ---
useEffect(() => {
  const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com";
  if (!blog?._id && !id) return;
  const postId = blog?._id || id;

  // initialize session refs
  readStartRef.current = performance.now();
  maxScrollRef.current = 0;
  sentReadEndRef.current = false;

  // pick scroll container
  const container =
    document.querySelector(".h-screen.overflow-y-scroll.relative") || window;

  const onScroll = () => {
    const total = container.scrollHeight || document.documentElement.scrollHeight;
    const visible = container.clientHeight || window.innerHeight;
    const scrollTop =
      container.scrollTop !== undefined ? container.scrollTop : window.scrollY;

    let scrolled = 0;
    if (total > visible) {
      scrolled = Math.min(1, (scrollTop + visible) / Math.max(1, total));
    }
    if (scrolled > maxScrollRef.current) {
      maxScrollRef.current = scrolled;
    }
  };

  const sendReadEnd = async (reason = "manual") => {
    if (sentReadEndRef.current) return; // guard against duplicates
    sentReadEndRef.current = true;

    const start = readStartRef.current || performance.now();
    const dwell_ms = Math.max(0, Math.round(performance.now() - start));

    let scroll_depth = Math.max(0, Math.min(1, maxScrollRef.current || 0));
    const total = container.scrollHeight || document.documentElement.scrollHeight;
    const visible = container.clientHeight || window.innerHeight;

    // handle short blogs
    if (total <= visible && dwell_ms < 5000) {
      scroll_depth = 0;
    } else if (total <= visible) {
      scroll_depth = 1;
    }

    console.log(`📤 Sending read-end [${reason}]`, { dwell_ms, scroll_depth });

    try {
      await axios.post(`${API_BASE}/api/trending-rl/events/read-end`, {
        postId,
        dwell_ms,
        scroll_depth,
      });
    } catch {}
  };

  // attach listeners
  container.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendReadEnd("visibility");
  });
  window.addEventListener("beforeunload", () => sendReadEnd("beforeunload"));

  // single timer snapshot
  const timer = setTimeout(() => sendReadEnd("timer10s"), 10000);

  return () => {
    clearTimeout(timer);
    container.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", () => sendReadEnd("visibility"));
    window.removeEventListener("beforeunload", () => sendReadEnd("beforeunload"));

    // unmount safety
    sendReadEnd("unmount");
  };
}, [id]); // 👈 only depend on id, not blog._id




  // --- Trending badge: check if this blog is currently in the rail (ADD) ---
  useEffect(() => {
    if (!blog?._id) return;
    const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com";
    // bump limit to reduce false negatives (diversity + randomness)
    const url = `${API_BASE}/api/trending-rl/trending?limit=2`;

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-900">
        <Loader />
      </div>
    );

  if (!blog)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-900">
        <p className="text-red-500 dark:text-red-400 text-xl font-medium">
          Blog not found.
        </p>
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-900 py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
      <article className="bg-white dark:bg-zinc-800 text-black dark:text-zinc-100 max-w-4xl w-full rounded-2xl shadow-xl p-6 sm:p-10 md:p-14 animate-fadeIn border border-slate-200 dark:border-zinc-700">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold leading-snug text-slate-800 dark:text-cyan-300 mb-6 font-sans">
          {blog.title}
          {isTrending && (
            <span
              className="ml-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                         bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border
                         border-amber-200/60 dark:border-amber-800 align-middle"
              title="This post is currently in the trending rail"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 0s1 2.5 1 5.5C14.5 10 10 11 10 15c0 2.761 2.239 5 5 5 3.314 0 6-2.686 6-6 0-4-3-6-3-9 0-2 1-5 1-5s-3 1-5.5 5C12 3 13.5 0 13.5 0z"/>
              </svg>
              Trending
            </span>
          )}
        </h1>

        {/* Meta + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-slate-500 dark:text-zinc-400 text-sm mb-10 gap-4">
          <div>
            <time dateTime={blog.date} className="italic">
              Published on{" "}
              {new Date(blog.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <p className="mt-2">
              By{" "}
              <span className="text-blue-600 dark:text-cyan-400 font-semibold">
                Amritanshu
              </span>
            </p>
          </div>

          {/* Summary Button Group */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSummarize}
              disabled={summarizing || !plainTextContent}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white dark:from-cyan-500 dark:to-cyan-600 dark:text-zinc-900 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 dark:focus-visible:ring-cyan-300"
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
                  Summarizing…
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 3h14a2 2 0 012 2v10l-4-3-4 3-4-3-4 3V5a2 2 0 012-2z" />
                  </svg>
                  AI Summary
                </>
              )}
            </button>

            <button
              onClick={handleCopySummary}
              disabled={!summary}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-600 border border-slate-200 dark:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300 dark:focus-visible:ring-zinc-400"
              aria-label="Copy AI summary"
              title={summary ? "Copy summary" : "No summary to copy yet"}
              type="button"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4a2 2 0 00-2 2v12h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z" />
              </svg>
              Copy
            </button>
          </div>
        </div>

        {/* Blog Content (HTML from CMS) */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-slate-800 dark:prose-headings:text-cyan-300 prose-a:text-blue-600 dark:prose-a:text-cyan-400 prose-a:hover:text-blue-700 dark:prose-a:hover:text-cyan-200 prose-img:rounded-xl prose-img:shadow-md"
          style={{ fontFamily: "'Georgia', serif" }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* AI Summary Section */}
        {(summary || summarizing || summaryError) && (
          <section
            ref={summaryRef}
            className="mt-12 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-gradient-to-b from-slate-50/90 to-white dark:from-zinc-900/60 dark:to-zinc-800/60 p-6 sm:p-8 shadow-sm"
            aria-live="polite"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-cyan-300">
                  AI Summary
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Quick, helpful overview generated from this article.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {summary && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                    Ready
                  </span>
                )}
                {summarizing && (
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                    Generating…
                  </span>
                )}
              </div>
            </div>

            {summaryError && (
              <p className="text-red-600 dark:text-red-400 mb-4">{summaryError}</p>
            )}

            <div className="rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-4 sm:p-6">
              {summarizing && (
                // Lightweight skeleton loading
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-zinc-700 rounded"></div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-zinc-700 rounded"></div>
                  <div className="h-3 w-11/12 bg-slate-200 dark:bg-zinc-700 rounded"></div>
                  <div className="h-3 w-10/12 bg-slate-200 dark:bg-zinc-700 rounded"></div>
                </div>
              )}

              {!summarizing && !summary && !summaryError && (
                <p className="text-slate-600 dark:text-zinc-300">
                  Click <span className="font-medium">AI Summary</span> above to generate a quick overview of this article.
                </p>
              )}

              {summary && (
                // NOTE: No className on ReactMarkdown in v9+.
                // Style via a wrapper and the `components` map.
                <div className="prose max-w-none dark:prose-invert leading-relaxed text-slate-800 dark:text-zinc-100">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, children, ...props }) => (
                        <a
                          className="text-blue-600 dark:text-cyan-400 hover:underline"
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                      code: ({ inline, children, ...props }) =>
                        inline ? (
                          <code
                            className="px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-700"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 overflow-x-auto">
                            <code {...props}>{children}</code>
                          </pre>
                        ),
                      h1: ({ node, children, ...props }) => (
                        <h1 className="mt-0" {...props}>
                          {children}
                        </h1>
                      ),
                    }}
                  >
                    {summary.replace(/\r\n/g, "\n")}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Social Share Buttons */}
        <div className="mt-12 flex flex-wrap gap-4 items-center">
          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              currentURL
            )}&text=${encodeURIComponent(blog.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-blue-500 dark:text-cyan-400 hover:text-blue-600 dark:hover:text-cyan-200 transition"
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
            className="flex items-center space-x-2 text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-200 transition"
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
      `}</style>
    </main>
  );
};

export default BlogDetails;
