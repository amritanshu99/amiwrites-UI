import { useEffect } from "react";
import BlogList from '../components/Blogs/BlogList';

import { applySEO, seoByRoute } from "../utils/seo";

const BlogPage = () => {
  useEffect(() => {
    document.body.classList.add("amiverse-premium-light-page");

    const routeSeo = seoByRoute["/blogs"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/blogs",
      ...routeSeo,
    });

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
