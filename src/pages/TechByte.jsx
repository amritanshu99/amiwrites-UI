import { useEffect } from "react";
import TechByteDetails from '../components/Tech-byte/TechByteDetails';

import { applySEO, seoByRoute } from "../utils/seo";

const TechByte = () => {
  useEffect(() => {
    document.body.classList.add("amiverse-premium-light-page");

    const routeSeo = seoByRoute["/tech-byte"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/tech-byte",
      ...routeSeo,
    });

    return () => {
      document.body.classList.remove("amiverse-premium-light-page");
    };
  }, []);

  return (
    <div className="amiverse-premium-light-page min-h-screen">
      <TechByteDetails />
    </div>
  );
};

export default TechByte;
