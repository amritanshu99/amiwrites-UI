import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "../utils/api";
import Loader from "./Loader";

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://amiwrites-backend-app-1.onrender.com/api/blogs/${id}`
      );
      setBlog(res.data);
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  };

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
    }
  }, [pathname]);

  useEffect(() => {
    fetchBlog();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Loader />
      </div>
    );

  if (!blog)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <p className="text-red-500 text-xl font-medium">Blog not found.</p>
      </div>
    );

  const currentURL = window.location.href;

  return (
  <main className="min-h-screen bg-slate-50 dark:bg-black py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
  <article className="bg-white dark:bg-white text-black dark:text-black max-w-4xl w-full rounded-2xl shadow-xl p-6 sm:p-10 md:p-14 animate-fadeIn border border-slate-200">

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold leading-snug text-slate-800 mb-6 font-sans">
          {blog.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-slate-500 text-sm mb-10">
          <time dateTime={blog.date} className="italic">
            Published on{" "}
            {new Date(blog.date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <p className="mt-2 sm:mt-0">
            By <span className="text-blue-600 font-semibold">Amritanshu</span>
          </p>
        </div>

        {/* Blog Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:text-slate-800 prose-a:text-blue-600 prose-a:hover:text-blue-700 prose-img:rounded-xl prose-img:shadow-md"
          style={{ fontFamily: "'Georgia', serif" }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Social Share Buttons */}
        <div className="mt-12 flex flex-wrap gap-4 items-center">
          {/* Twitter */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              currentURL
            )}&text=${encodeURIComponent(blog.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 transition"
            aria-label="Share on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition"
            aria-label="Share on Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12a10 10 0 10-11 9.95v-7.04H8.6v-2.9h2.4v-2.2c0-2.4 1.4-3.8 3.6-3.8 1 0 2 .07 2 .07v2.3h-1.1c-1.1 0-1.4.68-1.4 1.38v1.7h2.4l-.38 2.9h-2.02V22A10 10 0 0022 12z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </a>
        </div>
      </article>

      {/* Subtle Animation */}
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
