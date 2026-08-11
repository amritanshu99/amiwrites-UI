import { useEffect } from "react";
import AmiBot from "../components/AmiBot/AmiBot";

const AmiBotDetails = () => {
  useEffect(() => {
    document.body.classList.add("amiverse-premium-light-page");

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
