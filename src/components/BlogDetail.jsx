import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../utils/api";
import Loader from "./Loader";

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/blogs/${id}`);
      setBlog(res.data);
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-amber-100 to-amber-200">
        <Loader />
      </div>
    );

  if (!blog)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-amber-100 to-amber-200">
        <p className="text-red-700 text-xl font-semibold">Blog not found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-amber-200 py-20 px-6 flex justify-center">
      <div
        className="relative bg-[#fff3d1] rounded-3xl shadow-2xl p-16 max-w-[90vw] w-full max-w-4xl"
        style={{
          borderLeft: "8px solid #b76e2c", // warm diary margin line
          fontFamily: "'Patrick Hand', cursive, 'Georgia', serif", // handwritten + serif fallback
          color: "#5b3a00",
          lineHeight: "1.8",
          fontSize: "1.15rem",
          backgroundImage: `url("data:image/svg+xml,%3csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='20' height='20' fill='%23fff3d1'/%3e%3cline x1='0' y1='5' x2='20' y2='5' stroke='%23f5e6b3' stroke-width='1'/%3e%3cline x1='0' y1='15' x2='20' y2='15' stroke='%23f5e6b3' stroke-width='1'/%3e%3c/svg%3e")`,
          backgroundRepeat: "repeat-y",
          backgroundSize: "20px 40px",
          backgroundPosition: "left 8px top 0",
        }}
      >
        <h1
          className="text-5xl font-bold mb-8"
          style={{ fontFamily: "'Pacifico', cursive", lineHeight: "1.2", color: "#8b4b00" }}
        >
          {blog.title}
        </h1>
        <p
          className="italic mb-12"
          style={{ color: "#8b4b00", fontSize: "1.1rem" }}
        >
          Written on{" "}
          {new Date(blog.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <article
          className="prose prose-lg max-w-none"
          style={{
            fontFamily: "'Patrick Hand', cursive, Georgia, serif",
            color: "#5b3a00",
          }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>
    </div>
  );
};

export default BlogDetails;
