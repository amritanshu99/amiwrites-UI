import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Filter, Plus, Search, Trash2 } from "lucide-react";
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
  <div className="flex h-[250px] w-full animate-pulse flex-col rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-black dark:shadow-[0_24px_60px_-40px_rgba(0,0,0,0.92)] sm:h-[270px] sm:p-5">
    <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
      <div className="h-4 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
    </div>
    <div className="mb-2 h-5 w-4/5 rounded bg-zinc-300 dark:bg-zinc-800 sm:mb-3 sm:h-6" />
    <div className="mb-2 h-5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-900 sm:h-6" />
    <div className="space-y-2.5 pt-2 sm:space-y-3">
      <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-3 w-11/12 rounded bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-3 w-3/5 rounded bg-zinc-200 dark:bg-zinc-900" />
    </div>
    <div className="mt-auto h-4 w-24 rounded bg-zinc-300 dark:bg-zinc-800" />
  </div>
);

const BlogList = () => {
  const { isAuthenticated, username } = useAuth();
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
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
  const blogBackgroundImage = `${process.env.PUBLIC_URL}${
    isDark ? "/ny-dark.jpg" : "/ny-bg.png"
  }`;

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark"));

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="amiverse-premium-light-page relative isolate min-h-screen overflow-hidden px-3 pb-24 pt-3 dark:bg-none dark:bg-black sm:px-5 sm:pb-6 sm:pt-4 lg:px-8 lg:pb-8 lg:pt-6">
      <div
        className="amiverse-premium-light-page absolute inset-0 -z-30 dark:bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: `url(${blogBackgroundImage})`,
          opacity: isDark ? 0 : 0.05,
          filter: isDark
            ? "saturate(0.45) brightness(0.28)"
            : "saturate(0.5) brightness(1.32) contrast(0.96)",
        }}
        aria-hidden="true"
      />
      <div
        className="amiverse-premium-light-overlay absolute inset-0 -z-10 dark:bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_100%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0))] dark:bg-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(0deg,rgba(255,255,255,0.78),rgba(255,255,255,0))] dark:bg-transparent" />
      </div>
      <PushNotificationButton />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-3 sm:gap-4">
        <section className="relative overflow-hidden rounded-[1.25rem] border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(247,251,255,0.95),rgba(235,246,255,0.93))] px-4 py-4 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.26)] ring-1 ring-sky-100/80 backdrop-blur-md dark:border-zinc-900 dark:bg-[linear-gradient(145deg,rgba(0,0,0,0.98),rgba(0,0,0,1),rgba(0,0,0,1))] dark:ring-white/5 dark:shadow-[0_32px_80px_-44px_rgba(0,0,0,0.92)] sm:rounded-[1.5rem] sm:px-5 sm:py-4 lg:px-6 lg:py-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent dark:via-white/12" />
          <div className="relative">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                Editorial Notes
              </span>
              <h1 className="mt-2 max-w-2xl text-base font-semibold text-zinc-950 dark:text-zinc-50 sm:text-[1.35rem] lg:text-[1.65rem]">
                Reinforcement Learning Blogs, optimized for what is trending now.
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                Trending recommendations are powered by Thompson Sampling, a reinforcement learning strategy that continuously learns from blog engagement.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
          {isAuthenticated && username === "amritanshu99" && (
            <button
              onClick={handleAddBlog}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-white/15 motion-reduce:transform-none sm:py-2.5"
            >
              <Plus className="h-4 w-4" />
              Add Blog
            </button>
          )}
        </div>

        <section className="rounded-[1.2rem] border border-white/85 bg-[linear-gradient(135deg,rgba(255,255,255,0.93),rgba(246,250,255,0.92),rgba(239,247,255,0.94))] p-3 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.18)] ring-1 ring-sky-100/70 backdrop-blur-md dark:border-zinc-900 dark:bg-[linear-gradient(145deg,rgba(0,0,0,0.98),rgba(0,0,0,1),rgba(0,0,0,1))] dark:ring-white/5 dark:shadow-[0_28px_70px_-44px_rgba(0,0,0,0.88)] sm:rounded-[1.35rem] sm:p-3.5">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  id="blog-search"
                  type="text"
                  placeholder="Search by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search blogs by title"
                  className="min-h-[46px] w-full rounded-xl border border-zinc-300/90 bg-white/95 px-4 py-2.5 pl-11 text-sm text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 hover:border-sky-300 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700 dark:focus:border-zinc-700 dark:focus:ring-white/10"
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto lg:items-end">
              <div className="w-full sm:w-40">
                <div className="relative">
                  <select
                    id="blog-sort"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    aria-label="Sort blogs"
                    className="min-h-[46px] w-full appearance-none rounded-xl border border-zinc-300/90 bg-white/95 px-4 py-2.5 pr-11 text-sm font-medium text-zinc-800 outline-none transition duration-200 hover:border-sky-300 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700 dark:focus:border-zinc-700 dark:focus:ring-white/10"
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
                <div className="min-h-[46px] w-full rounded-xl border border-zinc-200/80 bg-zinc-50/90 px-3 py-2.5 text-xs font-medium leading-5 text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-300 sm:px-3.5 sm:text-sm">
                  {filteredBlogs.length} {filteredBlogs.length === 1 ? "post" : "posts"} loaded
                </div>
              </div>
            </div>
          </div>
        </section>

        {filteredBlogs.length === 0 && !loading ? (
          <div className="rounded-[1.75rem] border border-dashed border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(245,250,255,0.92))] px-6 py-16 text-center shadow-[0_20px_50px_-40px_rgba(15,23,42,0.2)] ring-1 ring-sky-100/70 backdrop-blur-sm dark:border-zinc-800 dark:bg-black dark:ring-white/5">
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
                  className="group relative isolate flex min-h-[244px] w-full cursor-pointer flex-col overflow-hidden rounded-[1.35rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,252,255,0.96),rgba(240,248,255,0.94))] p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.2)] ring-1 ring-sky-100/70 backdrop-blur-sm transform-gpu transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.01] hover:border-sky-200/90 hover:shadow-[0_32px_78px_-42px_rgba(14,165,233,0.28)] focus:outline-none focus-visible:-translate-y-1 focus-visible:scale-[1.005] focus-visible:ring-4 focus-visible:ring-sky-100 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_100%)] dark:ring-white/5 dark:hover:border-zinc-700 dark:shadow-[0_24px_64px_-40px_rgba(0,0,0,0.92)] dark:hover:shadow-[0_30px_72px_-40px_rgba(0,0,0,0.98)] dark:focus-visible:ring-white/10 sm:min-h-[270px] sm:rounded-[1.5rem] sm:p-5 motion-reduce:transform-none motion-reduce:transition-none"
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
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:opacity-100">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <div className="absolute right-[-2.5rem] top-[-3rem] h-24 w-24 rounded-full bg-transparent blur-3xl" />
                    <div className="absolute left-[-2rem] bottom-[-3rem] h-24 w-24 rounded-full bg-transparent blur-3xl" />
                  </div>
                  <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                        Blog
                      </p>
                      {isTrending && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:border dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-200"
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
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100 dark:border-zinc-800 dark:bg-black dark:text-red-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-950 dark:hover:text-red-200 dark:focus-visible:ring-red-950/60"
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

                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-sky-700 transition group-hover:translate-x-1 dark:text-zinc-100 sm:pt-5">
                      Read article
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
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
