import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import axios from '../utils/api';
import Loader from './Loader'; // Import Loader component

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    const intervalId = setInterval(checkAuth, 1000);
    window.addEventListener('storage', checkAuth);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return isAuthenticated;
};

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);  // Loading state for fetching
  const [deletingId, setDeletingId] = useState(null); // To track which blog is deleting
  const isAuthenticated = useAuth();
  const navigate = useNavigate();

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/blogs');
      setBlogs(res.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
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
      alert('You must be logged in to delete a blog');
      return;
    }
    setDeletingId(id);
    try {
      await axios.delete(`/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchBlogs();
    } catch (error) {
      console.error('Failed to delete blog:', error);
      alert('Failed to delete blog');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 p-8 w-full space-y-8">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-wide text-center">
        Latest Blogs
      </h2>
      {blogs.length === 0 && (
        <p className="text-gray-700 italic text-center text-lg">No blogs available.</p>
      )}
      {blogs.map((blog) => (
        <div
          key={blog._id}
          className="bg-white border border-gray-300 shadow-lg rounded-xl p-6 cursor-pointer hover:shadow-xl hover:border-gray-400 transition-shadow duration-300 ease-in-out max-w-full mx-auto relative"
          onClick={() => handleBlogClick(blog._id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleBlogClick(blog._id); }}
        >
          <h3 className="text-2xl font-semibold text-pink-700 hover:text-pink-900 hover:underline transition-colors duration-200">
            {blog.title}
          </h3>
          <div
            className="text-gray-800 mt-4 prose max-w-none line-clamp-3"
            dangerouslySetInnerHTML={{
              __html:
                blog.content.length > 150
                  ? blog.content.slice(0, 150) + '...'
                  : blog.content,
            }}
          />
          <span className="text-pink-600 mt-4 inline-block font-medium hover:text-pink-800 transition-colors duration-200">
            Read more →
          </span>

          {isAuthenticated && (
            <button
              aria-label={`Delete blog titled ${blog.title}`}
              className="absolute top-5 right-5 text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 rounded p-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(blog._id);
              }}
              disabled={deletingId === blog._id}
              title={deletingId === blog._id ? 'Deleting...' : 'Delete blog'}
            >
              {deletingId === blog._id ? (
                <Loader size="small" />  // Assuming Loader accepts size prop for small spinner
              ) : (
                <Trash2 size={24} />
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default BlogList;
