import { useEffect } from "react";
import TechByteDetails from '../components/Tech-byte/TechByteDetails';

import { applySEO, seoByRoute } from "../utils/seo";

const TechByte = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/tech-byte"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/tech-byte",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <TechByteDetails />
    </div>
  );
};

export default TechByte;