import { useEffect } from "react";
import TechByteDetails from '../components/Tech-byte/TechByteDetails';

const TechByte = () => {
  useEffect(() => {
    document.body.classList.add("amiverse-premium-light-page");

    return () => {
      document.body.classList.remove("amiverse-premium-light-page");
    };
  }, []);

  return (
    <div className="amiverse-premium-light-page h-full min-h-0">
      <TechByteDetails />
    </div>
  );
};

export default TechByte;
