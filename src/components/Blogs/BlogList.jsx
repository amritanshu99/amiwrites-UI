import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Trash2, Plus, Filter } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../utils/api";
import Loader from "../Loader/Loader";
import PushNotificationButton from "../Floating-buttons/PushNotificationButton";
import { useDebounce } from "../../hooks/useDebounce";

function parseJwt(token) {
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function getPlainTextPreview(content, maxLength = 170) {
  if (!content) return "No preview available.";

  const plainText = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return "No preview available.";
  return plainText.length > maxLength
    ? `${plainText.slice(0, maxLength).trim()}...`
    : plainText;
}

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
      setUsername(token ? parseJwt(token)?.username || null : null);
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    window.addEventListener("storage", checkAuth);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return { isAuthenticated, username };
};

const BlogSkeleton = () => (
  <div className="flex h-[250px] w-full animate-pulse flex-col rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-black sm:h-[270px] sm:p-5">
    <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
      <div className="h-4 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
    </div>
    <div className="mb-2 h-5 w-4/5 rounded bg-zinc-300 dark:bg-zinc-900 sm:mb-3 sm:h-6" />
    <div className="mb-2 h-5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-900 sm:h-6" />
    <div className="space-y-2.5 pt-2 sm:space-y-3">
      <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-3 w-11/12 rounded bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-3 w-3/5 rounded bg-zinc-200 dark:bg-zinc-900" />
    </div>
    <div className="mt-auto h-4 w-24 rounded bg-zinc-300 dark:bg-zinc-900" />
  </div>
);

const BlogList = () => {
  const { isAuthenticated, username } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState("latest");
  const [search, setSearch] = useState("");
  const loaderRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const resetRef = useRef(false);
  const fetchedPagesRef = useRef(new Set());
  const debouncedSearch = useDebounce(search, 500);

  const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com";
  const [trendingIds, setTrendingIds] = useState(() => new Set());
  const CLICK_API = `${API_BASE}/api/trending-rl/events/click`;

  const trackClick = (postId) => {
    if (!postId) return;

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("trackClick ->", CLICK_API, postId);
    }

    try {
      fetch(CLICK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
        mode: "cors",
        keepalive: true,
        credentials: "omit",
      }).catch(() => {});
      return;
    } catch (_) {}

    axios.post(CLICK_API, { postId }).catch(() => {});
  };

  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);
  const pageRef = useRef(page);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchBlogs = async (pageNumber, currentSearch, currentFilter) => {
    const searchQuery = currentSearch ?? "";
    const sortOrder = currentFilter ?? "latest";
    const cacheKey = `${pageNumber}-${searchQuery}-${sortOrder}`;

    if (fetchedPagesRef.current.has(cacheKey)) return;
    if (loadingRef.current) return;

    setLoading(true);
    loadingRef.current = true;
    try {
      const res = await axios.get(
        `/api/blogs?page=${pageNumber}&limit=10&search=${encodeURIComponent(
          searchQuery
        )}&sort=${sortOrder}`
      );

      if (res.data.blogs && res.data.blogs.length > 0) {
        setBlogs((prev) =>
          pageNumber === 1
            ? res.data.blogs
            : [
                ...prev,
                ...res.data.blogs.filter((b) => !prev.some((p) => p._id === b._id)),
              ]
        );
        fetchedPagesRef.current.add(cacheKey);
        setHasMore(Boolean(res.data.hasMore));
        hasMoreRef.current = Boolean(res.data.hasMore);
      } else {
        setHasMore(false);
        hasMoreRef.current = false;
      }
    } catch (err) {
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
      loadingRef.current = false;
      try {
        resetObserver();
      } catch (e) {}
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/trending-rl/trending?limit=2&all=1`
        );
        const items = Array.isArray(data?.items) ? data.items : [];
        const set = new Set(items.map((x) => String(x?._id)));
        if (mounted) setTrendingIds(set);
      } catch {
        if (mounted) setTrendingIds(new Set());
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch, filter]);

  const observerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const lastRequestedPageRef = useRef(0);
  const throttleTimeoutRef = useRef(null);

  const findScrollContainer = (startEl) => {
    const explicit = document.querySelector(".h-screen.overflow-y-scroll.relative");
    if (explicit) {
      try {
        const style = getComputedStyle(explicit);
        if (
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          explicit.scrollHeight > explicit.clientHeight
        ) {
          return explicit;
        }
      } catch (e) {}
    }

    if (!startEl) return null;
    let node = startEl.parentElement;
    while (node && node !== document.body) {
      try {
        const style = getComputedStyle(node);
        const overflowY = style.overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight
        ) {
          return node;
        }
      } catch (e) {}
      node = node.parentElement;
    }
    return null;
  };

  const resetObserver = () => {
    if (observerRef.current && loaderRef.current) {
      try {
        observerRef.current.unobserve(loaderRef.current);
      } catch (e) {}
      try {
        observerRef.current.observe(loaderRef.current);
      } catch (e) {}
    }
  };

  const checkAndLoadByScroll = (scroller) => {
    if (loadingRef.current || !hasMoreRef.current) return;

    let distanceToBottom = Infinity;
    if (
      !scroller ||
      scroller === window ||
      scroller === document.documentElement ||
      scroller === document.body
    ) {
      const doc = document.documentElement || document.body;
      const scrollTop = window.scrollY || window.pageYOffset || doc.scrollTop || 0;
      const clientHeight = window.innerHeight || doc.clientHeight;
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    } else {
      distanceToBottom =
        scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
    }

    const thresholdPx = 350;
    if (distanceToBottom <= thresholdPx) {
      const next = Math.max(1, pageRef.current + 1);
      const cacheKey = `${next}-${debouncedSearch}-${filter}`;
      if (
        fetchedPagesRef.current.has(cacheKey) ||
        lastRequestedPageRef.current >= next
      ) {
        return;
      }
      lastRequestedPageRef.current = next;
      setPage(next);
      pageRef.current = next;
    }
  };

  useEffect(() => {
    let mounted = true;
    let scroller = null;
    let onScrollFn = null;

    const build = () => {
      if (!mounted) return;

      if (observerRef.current) {
        try {
          observerRef.current.disconnect();
        } catch (e) {}
        observerRef.current = null;
      }

      scroller = findScrollContainer(loaderRef.current);
      scrollContainerRef.current = scroller;

      const options = {
        root: scroller || null,
        rootMargin: "400px 0px 400px 0px",
        threshold: 0,
      };

      observerRef.current = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          const next = Math.max(1, pageRef.current + 1);
          const cacheKey = `${next}-${debouncedSearch}-${filter}`;
          if (
            fetchedPagesRef.current.has(cacheKey) ||
            lastRequestedPageRef.current >= next
          ) {
            return;
          }
          lastRequestedPageRef.current = next;
          setPage(next);
          pageRef.current = next;
        }
      }, options);

      if (loaderRef.current) {
        try {
          observerRef.current.observe(loaderRef.current);
        } catch (e) {}
      }

      const scrollTarget = scroller || window;
      try {
        const prev = scrollTarget._blogListOnScroll;
        if (prev) scrollTarget.removeEventListener("scroll", prev);
      } catch (e) {}

      onScrollFn = () => {
        if (throttleTimeoutRef.current) return;
        throttleTimeoutRef.current = setTimeout(() => {
          throttleTimeoutRef.current = null;
          try {
            checkAndLoadByScroll(scroller);
          } catch (e) {}
        }, 150);
      };

      try {
        scrollTarget.addEventListener("scroll", onScrollFn, { passive: true });
        scrollTarget._blogListOnScroll = onScrollFn;
      } catch (e) {}
    };

    const t = setTimeout(build, 40);
    const rebuild = () => {
      clearTimeout(t);
      setTimeout(build, 120);
    };

    window.addEventListener("resize", rebuild);
    window.addEventListener("orientationchange", rebuild);

    return () => {
      mounted = false;
      window.removeEventListener("resize", rebuild);
      window.removeEventListener("orientationchange", rebuild);

      if (observerRef.current) {
        try {
          observerRef.current.disconnect();
        } catch (e) {}
        observerRef.current = null;
      }

      const scrollerToCleanup = scrollContainerRef.current || window;
      try {
        const fn = scrollerToCleanup._blogListOnScroll;
        if (fn) scrollerToCleanup.removeEventListener("scroll", fn);
        delete scrollerToCleanup._blogListOnScroll;
      } catch (e) {}

      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
    };
  }, [debouncedSearch, filter]);


  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer)
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  const handleBlogClick = (id) => navigate(`/blogs/${id}?src=list`);

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Login required to delete blog");

    setDeletingId(id);
    try {
      await axios.delete(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Blog deleted");

      fetchedPagesRef.current = new Set();
      setBlogs([]);
      setPage(1);
      pageRef.current = 1;
      setHasMore(true);
      hasMoreRef.current = true;
      lastRequestedPageRef.current = 0;

      fetchBlogs(1);
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    resetRef.current = true;
    setBlogs([]);
    setHasMore(true);
    hasMoreRef.current = true;
    fetchedPagesRef.current = new Set();
    setPage(1);
    pageRef.current = 1;
    lastRequestedPageRef.current = 0;
  }, [debouncedSearch, filter]);

  useEffect(() => {
    if (resetRef.current) {
      fetchBlogs(1, debouncedSearch, filter);
      resetRef.current = false;
      lastRequestedPageRef.current = 1;
      pageRef.current = 1;
    } else {
      if (page <= 0) return;
      const cacheKey = `${page}-${debouncedSearch}-${filter}`;
      if (fetchedPagesRef.current.has(cacheKey)) return;
      fetchBlogs(page, debouncedSearch, filter);
      lastRequestedPageRef.current = Math.max(lastRequestedPageRef.current, page);
      pageRef.current = page;
    }
  }, [page, debouncedSearch, filter]);

  const handleAddBlog = () => navigate("/add-blog");

  const filteredBlogs = blogs;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#edf3f8_35%,_#f8fafc_100%)] px-3 py-3 dark:bg-[linear-gradient(180deg,_#000000_0%,_#050505_52%,_#000000_100%)] sm:px-5 sm:py-4 lg:px-8 lg:py-6">
      <PushNotificationButton />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:gap-4">
        <section className="overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.24)] backdrop-blur-sm dark:border-zinc-900 dark:bg-black dark:shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] sm:rounded-[1.5rem] sm:px-5 sm:py-4 lg:px-6 lg:py-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent dark:via-sky-300/35" />
          <div className="relative">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-100">
                Editorial Notes
              </span>
              <h1 className="mt-2 max-w-2xl text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-[1.35rem] lg:text-[1.65rem]">
                Reinforcement Learning Blogs, optimized for what is trending now.
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-zinc-600 dark:text-zinc-200">
                Trending recommendations are powered by Thompson Sampling, a reinforcement learning strategy that continuously learns from blog engagement.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
          {isAuthenticated && username === "amritanshu99" && (
            <button
              onClick={handleAddBlog}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 sm:py-2.5"
            >
              <Plus className="h-4 w-4" />
              Add Blog
            </button>
          )}
        </div>

        <section className="rounded-[1.2rem] border border-white/70 bg-white/85 p-3 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.2)] backdrop-blur-sm dark:border-zinc-900 dark:bg-black dark:shadow-[0_16px_40px_-32px_rgba(0,0,0,0.9)] sm:rounded-[1.35rem] sm:p-3.5">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-xl">
              <input
                id="blog-search"
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-300/90 bg-white/95 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
              />
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto lg:items-end">
              <div className="w-full sm:w-40">
                <div className="relative">
                  <select
                    id="blog-sort"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="min-h-[42px] w-full appearance-none rounded-xl border border-zinc-300/90 bg-white/95 px-4 py-2.5 pr-11 text-sm font-medium text-zinc-800 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
                  >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <Filter size={16} className="text-zinc-500 dark:text-zinc-300" />
                  </div>
                </div>
              </div>

              <div className="flex items-end">
                <div className="w-full rounded-xl border border-zinc-200/80 bg-zinc-50/90 px-3 py-2.5 text-xs leading-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 sm:px-3.5 sm:text-sm">
                  Infinite scroll enabled.
                </div>
              </div>
            </div>
          </div>
        </section>

        {filteredBlogs.length === 0 && !loading ? (
          <div className="rounded-[1.75rem] border border-dashed border-zinc-300 bg-white/85 px-6 py-16 text-center shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-black">
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-100">
              No blogs available.
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-300">
              Try a different search or check back for new writing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredBlogs.map((blog) => {
              const publishedDate = blog.date
                ? new Date(blog.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Date unavailable";

              const isTrending = trendingIds.has(String(blog._id));
              const previewText = getPlainTextPreview(blog.content);

              return (
                <article
                  key={blog._id}
                  className="group flex min-h-[244px] w-full cursor-pointer flex-col rounded-[1.35rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur-sm transform-gpu transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.01] hover:border-sky-100 hover:shadow-[0_28px_60px_-36px_rgba(15,23,42,0.26)] focus-visible:-translate-y-1 focus-visible:scale-[1.005] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(10,10,10,1)_100%)] dark:hover:border-zinc-700 dark:shadow-[0_20px_46px_-34px_rgba(0,0,0,0.95)] dark:hover:shadow-[0_30px_68px_-36px_rgba(0,0,0,0.98)] sm:min-h-[270px] sm:rounded-[1.5rem] sm:p-5 motion-reduce:transform-none motion-reduce:transition-none"
                  onClick={() => {
                    trackClick(blog._id);
                    handleBlogClick(blog._id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      trackClick(blog._id);
                      handleBlogClick(blog._id);
                    }
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:bg-zinc-900 dark:text-zinc-100">
                        Blog
                      </p>
                      {isTrending && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"
                          title="This post is currently trending"
                          aria-label="Trending"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M13.5 0s1 2.5 1 5.5C14.5 10 10 11 10 15c0 2.761 2.239 5 5 5 3.314 0 6-2.686 6-6 0-4-3-6-3-9 0-2 1-5 1-5s-3 1-5.5 5C12 3 13.5 0 13.5 0z" />
                          </svg>
                          Trending
                        </span>
                      )}
                    </div>

                    {isAuthenticated && username === "amritanshu99" && (
                      <button
                        aria-label={`Delete blog titled ${blog.title}`}
                        className="rounded-full border border-zinc-200 bg-white/90 p-1.5 text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-zinc-800 dark:bg-black dark:text-red-300 dark:hover:border-red-400/40 dark:hover:bg-red-500/15 dark:hover:text-red-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(blog._id);
                        }}
                        disabled={deletingId === blog._id}
                        title={deletingId === blog._id ? "Deleting..." : "Delete blog"}
                      >
                        {deletingId === blog._id ? (
                          <Loader size="small" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex h-full flex-col">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 sm:text-sm sm:normal-case sm:tracking-normal">
                      {publishedDate}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-5 text-zinc-950 transition group-hover:text-sky-700 dark:text-zinc-50 dark:group-hover:text-zinc-200 sm:mt-2.5 sm:text-[1.05rem] sm:leading-6">
                      {blog.title}
                    </h3>

                    <p className="mt-2.5 line-clamp-4 text-sm leading-5 text-zinc-600 dark:text-zinc-300 sm:mt-3 sm:line-clamp-5 sm:leading-6">
                      {previewText}
                    </p>

                    <span className="mt-auto inline-flex items-center pt-4 text-sm font-semibold text-sky-700 transition group-hover:translate-x-1 dark:text-sky-300 sm:pt-5">
                      Read article
                    </span>
                  </div>
                </article>
              );
            })}

            {loading &&
              filteredBlogs.length > 0 &&
              Array.from({ length: 3 }).map((_, i) => (
                <BlogSkeleton key={`skeleton-pag-${i}`} />
              ))}
          </div>
        )}

        {loading && filteredBlogs.length === 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <BlogSkeleton key={`skeleton-init-${i}`} />
            ))}
          </div>
        )}

        <div ref={loaderRef} className="h-10" />
      </div>
    </div>
  );
};

export default BlogList;
