import { useEffect } from "react";
import AmiPulseSettingsPanel from "../components/Pulse/PulseSettings";
import { applySEO } from "../utils/seo";

const AmiPulseSettings = () => {
  useEffect(() => {
    applySEO({
      path: "/ami-pulse-settings",
      title: "Ami Pulse Settings | AmiVerse",
      description: "Admin settings for Ami Pulse.",
      noindex: true,
    });
  }, []);

  return <AmiPulseSettingsPanel />;
};

export default AmiPulseSettings;
