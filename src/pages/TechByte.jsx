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
    <div className="amiverse-premium-light-page min-h-screen">
      <TechByteDetails />
    </div>
  );
};

export default TechByte;
