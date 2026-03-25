import { useEffect } from "react";
import BlogList from '../components/Blogs/BlogList';

import { applySEO, seoByRoute } from "../utils/seo";

const BlogPage = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/blogs"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/blogs",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <BlogList />
    </div>
  );
};

export default BlogPage;