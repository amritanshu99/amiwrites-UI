import { useEffect } from "react";
import SpamDetector from '../components/SpamDectector/SpamDetector';

import { applySEO, seoByRoute } from "../utils/seo";

const SpamDetectorDetails = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/spam-check"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/spam-check",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <SpamDetector />
    </div>
  );
};

export default SpamDetectorDetails;