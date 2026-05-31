import { useEffect } from "react";
import PulseSettingsPanel from "../components/Pulse/PulseSettings";
import { applySEO } from "../utils/seo";

const PulseSettings = () => {
  useEffect(() => {
    applySEO({
      path: "/pulse-settings",
      title: "Pulse Settings | AmiVerse",
      description: "Admin settings for Amiverse Pulse.",
      noindex: true,
    });
  }, []);

  return <PulseSettingsPanel />;
};

export default PulseSettings;
