import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify'; // ✅ import toast only
import axios from '../utils/api';
import Loader from './Loader';

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

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { isAuthenticated, username } = useAuth();
  const navigate = useNavigate();

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://amiwrites-backend-app-1.onrender.com/api/blogs');
      setBlogs(res.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
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
    } catch (error) {
      console.error('Failed to delete blog:', error);
      toast.error('Failed to delete blog');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 p-6 w-full">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-wide text-center">
        Latest Blogs
      </h2>

      {blogs.length === 0 && (
        <p className="text-gray-700 italic text-center text-lg">No blogs available.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 justify-items-center">
        {blogs.map((blog) => (
          <div
            key={blog._id}
            className="bg-white border border-gray-300 shadow-xl rounded-2xl p-8 cursor-pointer transform transition-transform duration-300 ease-in-out hover:shadow-3xl hover:border-pink-500 hover:scale-105 hover:-translate-y-1 max-w-full mx-auto relative flex flex-col w-full max-w-[350px] h-[280px]"
            onClick={() => handleBlogClick(blog._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlogClick(blog._id);
            }}
          >
            <h3 className="text-3xl font-bold text-pink-700 hover:text-pink-900 hover:underline transition-colors duration-200 truncate">
              {blog.title}
            </h3>
            <div
              className="text-gray-800 mt-4 prose max-w-none overflow-hidden overflow-ellipsis"
              style={{ maxHeight: '130px' }}
              dangerouslySetInnerHTML={{
                __html:
                  blog.content.length > 150
                    ? blog.content.slice(0, 150) + '...'
                    : blog.content,
              }}
            />
            <span className="text-pink-600 mt-auto inline-block font-semibold hover:text-pink-800 transition-colors duration-200">
              Read more →
            </span>

            {isAuthenticated && username === 'amritanshu99' && (
              <button
                aria-label={`Delete blog titled ${blog.title}`}
                className="absolute top-6 right-6 text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <Trash2 size={28} />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogList;
