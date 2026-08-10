import Loader from "./Loader";

const routeLoadingLabels = {
  "/add-blog": "Loading Create Blog",
  "/ami-pulse-settings": "Loading Ami Pulse settings",
  "/pulse-settings": "Loading Ami Pulse settings",
  "/beacon-settings": "Loading Ami Pulse settings",
  "/amibot-admin": "Loading AmiBot settings",
};

const AppLoadingFallback = ({ pathname }) => {
  return (
    <Loader
      label={routeLoadingLabels[pathname] || "Loading page"}
    />
  );
};

export default AppLoadingFallback;
