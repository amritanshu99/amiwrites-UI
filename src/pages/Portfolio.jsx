import { useEffect } from "react";
import PortfolioDetails from '../components/Portfolio/PortfolioDetails';

import { applySEO, seoByRoute } from "../utils/seo";

const Portfolio = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <PortfolioDetails />
    </div>
  );
};

export default Portfolio;