import { useEffect } from "react";
import AmiBot from "../components/AmiBot/AmiBot";
import { applySEO, seoByRoute } from "../utils/seo";

const AmiBotDetails = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/amibot"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/amibot",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <AmiBot />
    </div>
  );
};

export default AmiBotDetails;
