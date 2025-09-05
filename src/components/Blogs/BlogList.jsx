import { useState, useEffect, useRef, useCallback } from "react";
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
  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow rounded-xl p-6 animate-pulse h-[260px] sm:h-[208px] w-full flex flex-col">
    <div className="h-5 bg-gray-300 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 dark:bg-zinc-600 rounded w-1/3 mb-4"></div>
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-2 00 dark:bg-zinc-600 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-zinc-600 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 dark:bg-zinc-600 rounded w-4/6"></div>
    </div>
    <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-24 mt-4"></div>
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

  // Absolute backend base
  const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com";

  // trending ids state
  const [trendingIds, setTrendingIds] = useState(() => new Set());

  // EXACT endpoint name
  const CLICK_API = `${API_BASE}/api/trending-rl/events/click`;

  // Navigation-safe sender
  const trackClick = (postId) => {
    if (!postId) return;

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("trackClick →", CLICK_API, postId);
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

  const fetchBlogs = async (pageNumber, currentSearch, currentFilter) => {
    const searchQuery = currentSearch ?? "";
    const sortOrder = currentFilter ?? "latest";
    const cacheKey = `${pageNumber}-${searchQuery}-${sortOrder}`;
    if (loading || fetchedPagesRef.current.has(cacheKey)) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `/api/blogs?page=${pageNumber}&limit=10&search=${encodeURIComponent(searchQuery)}&sort=${sortOrder}`
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
        setHasMore(res.data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch {
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
      resetObserver();
    }
  };

  // fetch trending ids
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/trending-rl/trending?limit=2&all=1`);
        const items = Array.isArray(data?.items) ? data.items : [];
        const set = new Set(items.map((x) => String(x?._id)));
        if (mounted) setTrendingIds(set);
      } catch {
        if (mounted) setTrendingIds(new Set());
      }
    })();
    return () => { mounted = false; };
  }, [debouncedSearch, filter]);

  const observerRef = useRef();
  const resetObserver = () => {
    if (observerRef.current && loaderRef.current) {
      observerRef.current.unobserve(loaderRef.current);
      observerRef.current.observe(loaderRef.current);
    }
  };

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, loading]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 1.0,
    });

    if (loaderRef.current) observerRef.current.observe(loaderRef.current);

    return () => {
      if (observerRef.current && loaderRef.current) {
        observerRef.current.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver]);

  useEffect(() => {
    document.title = "Amritanshu Mishra's Blogs";
  }, []);

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

      // Reset state
      fetchedPagesRef.current = new Set();
      setBlogs([]);
      setPage(1);
      setHasMore(true);

      // Trigger immediate fresh fetch for page 1
      fetchBlogs(1);
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  // Reset on search/filter
  useEffect(() => {
    resetRef.current = true;
    setBlogs([]);
    setHasMore(true);
    fetchedPagesRef.current = new Set();
    setPage(1);
  }, [debouncedSearch, filter]);

  // Fetch on page change
  useEffect(() => {
    if (resetRef.current) {
      fetchBlogs(1, debouncedSearch, filter);
      resetRef.current = false;
    } else {
      fetchBlogs(page, debouncedSearch, filter);
    }
  }, [page, debouncedSearch, filter]);

  const handleAddBlog = () => navigate("/add-blog");

  const filteredBlogs = blogs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-zinc-900 dark:via-black dark:to-zinc-900 p-4 sm:p-6">
      <PushNotificationButton />
<div className="mb-5 text-center max-w-xl mx-auto">
  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
    My Ideas · My Blogs ✍️
  </h1>

  <p className="mt-1 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
    A space where I share thoughts and stories.  
    <span className="block sm:inline">
      Powered by{" "}
      <span className="font-semibold text-pink-600 dark:text-pink-400">
        Reinforcement Learning 🤖
      </span>
      , it learns from your{" "}
      <span className="underline decoration-pink-400/40 underline-offset-2">
        reads & clicks
      </span>{" "}
      to highlight what’s <span className="font-semibold">trending</span>.
    </span>
  </p>
</div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      
        {isAuthenticated && username === "amritanshu99" && (
          <button
            onClick={handleAddBlog}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-sm font-medium rounded-full hover:from-yellow-500 hover:to-pink-500 transition duration-300 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Blog
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <input
          type="text"
          placeholder="🔍 Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-5 py-2 rounded-full border border-gray-300 bg-white/80 dark:bg-zinc-800 text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 w-full md:w-2/3"
        />

        <div className="relative w-full md:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full md:w-44 px-5 py-2 pr-10 rounded-full border border-gray-300 bg-white/80 dark:bg-zinc-800 text-gray-700 dark:text-white shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
          >
            <option value="latest">🆕 Latest</option>
            <option value="oldest">📜 Oldest</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            <Filter size={18} className="text-pink-600" />
          </div>
        </div>
      </div>

      {filteredBlogs.length === 0 && !loading ? (
        <p className="text-center text-gray-700 dark:text-gray-300 italic text-lg">
          No blogs available.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredBlogs.map((blog) => {
            const publishedDate = new Date(blog.date).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            const isTrending = trendingIds.has(String(blog._id));

            return (
              <div
                key={blog._id}
                className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 shadow-lg rounded-xl p-6 cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:border-pink-500 flex flex-col h-[260px] sm:h-[230px] w-full relative"
                onClick={() => { trackClick(blog._id); handleBlogClick(blog._id); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { trackClick(blog._id); handleBlogClick(blog._id); }
                }}
              >
                {/* Trending badge — improved spacing & responsiveness */}
                {isTrending && (
                  <span
                    className="absolute -top-2 -left-2 sm:-top-2 sm:-left-2 z-10 pointer-events-none
                               inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1
                               rounded-full text-[10px] sm:text-[11px] font-semibold
                               bg-gradient-to-r from-amber-400/95 to-orange-500/95 text-zinc-900
                               dark:from-amber-500/30 dark:to-orange-600/30 dark:text-amber-200
                               border border-amber-300/70 dark:border-amber-700/60
                               ring-1 ring-white/70 dark:ring-black/40 shadow-md"
                    title="This post is currently trending"
                    aria-label="Trending"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M13.5 0s1 2.5 1 5.5C14.5 10 10 11 10 15c0 2.761 2.239 5 5 5 3.314 0 6-2.686 6-6 0-4-3-6-3-9 0-2 1-5 1-5s-3 1-5.5 5C12 3 13.5 0 13.5 0z"/>
                    </svg>
                    <span className="leading-none">Trending</span>
                  </span>
                )}

                <h3 className="text-lg sm:text-xl font-semibold text-pink-700 truncate hover:underline">
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {publishedDate}
                </p>
                <div
                  className="text-gray-800 dark:text-gray-200 text-sm overflow-hidden line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html:
                      blog.content.length > 150
                        ? blog.content.slice(0, 150) + "..."
                        : blog.content,
                  }}
                />
                <span className="text-pink-600 mt-auto font-semibold hover:text-pink-800 text-sm">
                  Read more →
                </span>

                {isAuthenticated && username === "amritanshu99" && (
                  <button
                    aria-label={`Delete blog titled ${blog.title}`}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700"
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
                      <Trash2 size={20} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <BlogSkeleton key={i} />
          ))}
        </div>
      )}

      {/* IntersectionObserver trigger div */}
      <div ref={loaderRef} className="h-10" />
    </div>
  );
};

export default BlogList;