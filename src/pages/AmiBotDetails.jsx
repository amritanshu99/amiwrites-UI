import { useEffect } from "react";
import AmiBot from "../components/AmiBot/AmiBot";
import { applySEO, seoByRoute } from "../utils/seo";

const AmiBotDetails = () => {
  useEffect(() => {
    document.body.classList.add("amiverse-premium-light-page");

    const routeSeo = seoByRoute["/amibot"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/amibot",
      ...routeSeo,
    });

    return () => {
      document.body.classList.remove("amiverse-premium-light-page");
    };
  }, []);

  return (
    <div className="amiverse-premium-light-page h-full min-h-0 overflow-hidden">
      <AmiBot />
    </div>
  );
};

export default AmiBotDetails;
