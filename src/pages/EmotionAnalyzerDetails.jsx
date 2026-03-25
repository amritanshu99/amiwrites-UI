import { useEffect } from "react";
import EmotionAnalyzer from '../components/EmotionAnalyzer/EmotionAnalyzer';

import { applySEO, seoByRoute } from "../utils/seo";

const EmotionAnalyzerDetails = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/emotion-analyzer"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/emotion-analyzer",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <EmotionAnalyzer />
    </div>
  );
};

export default EmotionAnalyzerDetails;