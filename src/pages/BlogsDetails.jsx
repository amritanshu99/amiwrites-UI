import { useEffect } from "react";
import BlogDetail from '../components/Blogs/BlogDetail';

const BlogDetails = () => {
  useEffect(() => {
    document.body.classList.add("amiverse-premium-light-page");

    return () => {
      document.body.classList.remove("amiverse-premium-light-page");
    };
  }, []);

  return (
    <div className="amiverse-premium-light-page min-h-screen">
      <BlogDetail />
    </div>
  );
};

export default BlogDetails;
