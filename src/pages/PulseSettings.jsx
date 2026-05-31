import { useEffect } from "react";
import BeaconSettingsPanel from "../components/Pulse/PulseSettings";
import { applySEO } from "../utils/seo";

const BeaconSettings = () => {
  useEffect(() => {
    applySEO({
      path: "/beacon-settings",
      title: "Amiverse Beacon Settings | AmiVerse",
      description: "Admin settings for Amiverse Beacon.",
      noindex: true,
    });
  }, []);

  return <BeaconSettingsPanel />;
};

export default BeaconSettings;
