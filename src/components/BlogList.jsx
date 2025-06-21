import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Trash2, Plus, Filter } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../utils/api";
import Loader from "./Loader";
import PushNotificationButton from "./PushNotificationButton";

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
      <div className="h-3 bg-gray-200 dark:bg-zinc-600 rounded w-full"></div>
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
  const fetchedPagesRef = useRef(new Set());
const fetchBlogs = async (
  pageNumber,
  currentSearch = search,
  currentFilter = filter
) => {
  const cacheKey = `${pageNumber}-${currentSearch}-${currentFilter}`;

  if (loading || fetchedPagesRef.current.has(cacheKey)) return;

  setLoading(true);
  try {
    const res = await axios.get(
      `/api/blogs?page=${pageNumber}&limit=10&search=${encodeURIComponent(
        currentSearch
      )}&sort=${currentFilter}`
    );

    if (res.data.blogs && res.data.blogs.length > 0) {
      setBlogs((prev) => {
        // Reset list if pageNumber is 1 (new search/filter)
        const updatedBlogs =
          pageNumber === 1
            ? res.data.blogs
            : [
                ...prev,
                ...res.data.blogs.filter(
                  (newBlog) => !prev.some((b) => b._id === newBlog._id)
                ),
              ];
        return updatedBlogs;
      });

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

  useEffect(() => {
    fetchBlogs(page, search, filter);
  }, [page, search, filter]);

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

  const handleBlogClick = (id) => navigate(`/blogs/${id}`);

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

      // ✅ Trigger immediate fresh fetch for page 1
      fetchBlogs(1);
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchedPagesRef.current = new Set(); // Clear cache tracking
    setBlogs([]);
    setPage(1);
    setHasMore(true);
  }, [search, filter]);

  const handleAddBlog = () => navigate("/add-blog");

  const filteredBlogs = blogs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-zinc-900 dark:via-black dark:to-zinc-900 p-4 sm:p-6">
      <PushNotificationButton />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-white text-center sm:text-left">
          Latest Blogs
        </h2>

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
            const publishedDate = new Date(blog.date).toLocaleDateString(
              "en-IN",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            );

            return (
              <div
                key={blog._id}
                className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 shadow-lg rounded-xl p-6 cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:border-pink-500 flex flex-col h-[260px] sm:h-[230px] w-full relative"
                onClick={() => handleBlogClick(blog._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleBlogClick(blog._id)
                }
              >
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
                    title={
                      deletingId === blog._id ? "Deleting..." : "Delete blog"
                    }
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
