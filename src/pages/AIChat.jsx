import { useEffect } from "react";
import AIChat from '../components/AI-Chat/AIChat';

import { applySEO, seoByRoute } from "../utils/seo";

const AIChatPage = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/ai-chat"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/ai-chat",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <AIChat />
    </div>
  );
};

export default AIChatPage;