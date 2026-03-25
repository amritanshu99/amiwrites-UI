import { useEffect } from "react";
import ReinforcementLearning from "../components/ReinforcementLearning/ReinforcementLearning";
import { applySEO, seoByRoute } from "../utils/seo";

const ReinforcementLearningDetails = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/Reinforcement-Learning"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/Reinforcement-Learning",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <ReinforcementLearning />
    </div>
  );
};

export default ReinforcementLearningDetails;
