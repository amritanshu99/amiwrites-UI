import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../utils/api';
import Loader from './Loader';
import { useLocation } from "react-router-dom";
function parseJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      if (token) {
        const decoded = parseJwt(token);
        setUsername(decoded?.username || null);
      } else {
        setUsername(null);
      }
    };

    checkAuth();
    const intervalId = setInterval(checkAuth, 1000);
    window.addEventListener('storage', checkAuth);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return { isAuthenticated, username };
};

const BlogSkeleton = () => (
  <div className="bg-white border border-gray-200 shadow rounded-xl p-6 animate-pulse h-[260px] sm:h-[208px] w-full flex flex-col">
    <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
    </div>
    <div className="h-4 bg-gray-300 rounded w-24 mt-4"></div>
  </div>
);

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { isAuthenticated, username } = useAuth();
  const navigate = useNavigate();
const { pathname } = useLocation();
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://amiwrites-backend-app-1.onrender.com/api/blogs');
      setBlogs(res.data);
    } catch (error) {
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  

  const handleBlogClick = (id) => {
    navigate(`/blogs/${id}`);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to delete a blog');
      return;
    }
    setDeletingId(id);
    try {
      await axios.delete(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Blog deleted successfully');
      await fetchBlogs();
    } catch {
      toast.error('Failed to delete blog');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddBlog = () => {
    navigate('/add-blog');
  };

  useEffect(() => {
    fetchBlogs();
  }, []);
 useEffect(() => {
    // Find your scroll container
    const scrollContainer = document.querySelector('.h-screen.overflow-y-scroll.relative');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth', // or 'auto'
      });
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center sm:text-left">
          Latest Blogs
        </h2>

        {isAuthenticated && username === 'amritanshu99' && (
          <button
            onClick={handleAddBlog}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-sm font-medium rounded-full hover:from-yellow-500 hover:to-pink-500 transition duration-300 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Blog
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <BlogSkeleton key={i} />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <p className="text-center text-gray-700 italic text-lg">No blogs available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {blogs.map((blog) => {
            const publishedDate = new Date(blog.date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={blog._id}
                className="bg-white border border-gray-300 shadow-lg rounded-xl p-6 cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:border-pink-500 flex flex-col h-[260px] sm:h-[208px] w-full relative"
                onClick={() => handleBlogClick(blog._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBlogClick(blog._id);
                }}
              >
                <h3 className="text-xl font-semibold text-pink-700 truncate hover:underline">
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-500 mb-1">{publishedDate}</p>
                <div
                  className="text-gray-800 text-sm overflow-hidden"
                  style={{ maxHeight: '70px', textOverflow: 'ellipsis', overflow: 'hidden' }}
                  dangerouslySetInnerHTML={{
                    __html:
                      blog.content.length > 150
                        ? blog.content.slice(0, 150) + '...'
                        : blog.content,
                  }}
                />
                <span className="text-pink-600 mt-auto font-semibold hover:text-pink-800 text-sm">
                  Read more →
                </span>

                {isAuthenticated && username === 'amritanshu99' && (
                  <button
                    aria-label={`Delete blog titled ${blog.title}`}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(blog._id);
                    }}
                    disabled={deletingId === blog._id}
                    title={deletingId === blog._id ? 'Deleting...' : 'Delete blog'}
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
    </div>
  );
};

export default BlogList;
