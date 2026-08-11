import { useEffect } from "react";
import BlogList from '../components/Blogs/BlogList';

const BlogPage = () => {
  useEffect(() => {
    document.body.classList.add("amiverse-premium-light-page");

    return () => {
      document.body.classList.remove("amiverse-premium-light-page");
    };
  }, []);

  return (
    <div className="amiverse-premium-light-page min-h-screen">
      <BlogList />
    </div>
  );
};

export default BlogPage;
