import { useEffect } from "react";
import AddBlog from '../components/Blogs/AddBlog';

import { applySEO, seoByRoute } from "../utils/seo";

const AddBlogDetails = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/add-blog"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/add-blog",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <AddBlog />
    </div>
  );
};

export default AddBlogDetails;