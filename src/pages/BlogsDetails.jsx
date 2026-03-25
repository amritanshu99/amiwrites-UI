import { useEffect } from "react";
import BlogDetail from '../components/Blogs/BlogDetail';

import { applySEO, seoByRoute } from "../utils/seo";

const BlogDetails = () => {
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
      <BlogDetail />
    </div>
  );
};

export default BlogDetails;