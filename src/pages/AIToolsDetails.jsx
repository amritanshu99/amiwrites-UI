import { useEffect } from "react";
import AITools from "../components/AI-Tools/AITools";
import { applySEO, seoByRoute } from "../utils/seo";

const AIToolsDetails = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/ai-tools"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/ai-tools",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <AITools />
    </div>
  );
};

export default AIToolsDetails;
