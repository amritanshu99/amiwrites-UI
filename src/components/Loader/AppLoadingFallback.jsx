import Loader from "./Loader";
import InitialLoader, {
  INITIAL_LOADER_MIN_DURATION_MS,
} from "../Portfolio/InitialLoader";

const routeLoadingLabels = {
  "/add-blog": "Loading Create Blog",
  "/ami-pulse-settings": "Loading Ami Pulse settings",
  "/pulse-settings": "Loading Ami Pulse settings",
  "/beacon-settings": "Loading Ami Pulse settings",
  "/amibot-admin": "Loading AmiBot settings",
};

const AppLoadingFallback = ({ pathname, isSessionCheck = false }) => {
  if (isSessionCheck && pathname === "/") {
    return (
      <InitialLoader
        mode="showcase"
        durationMs={INITIAL_LOADER_MIN_DURATION_MS}
      />
    );
  }

  return (
    <Loader
      label={
        isSessionCheck
          ? "Verifying your session"
          : routeLoadingLabels[pathname] || "Loading page"
      }
    />
  );
};

export default AppLoadingFallback;
