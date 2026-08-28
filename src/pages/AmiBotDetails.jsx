import { useEffect } from "react";
import AmiBot from "../components/AmiBot/AmiBot";

const AmiBotDetails = () => {
  useEffect(() => {
    document.body.classList.add(
      "amiverse-premium-light-page",
      "amibot-page-active",
    );

    return () => {
      document.body.classList.remove(
        "amiverse-premium-light-page",
        "amibot-page-active",
      );
    };
  }, []);

  return (
    <div className="amiverse-premium-light-page h-full min-h-0 overflow-hidden">
      <AmiBot />
    </div>
  );
};

export default AmiBotDetails;
