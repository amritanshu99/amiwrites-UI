// src/analytics.js
import ReactGA from 'react-ga4';

const SENSITIVE_ROUTES = ["/reset-password"];
let analyticsInitialized = false;

const isSensitiveRoute = (path) =>
  SENSITIVE_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

export const getPublicPagePath = (path = "/") => {
  const pathname = String(path || "/").split(/[?#]/, 1)[0];
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const sensitiveRoute = SENSITIVE_ROUTES.find(
    (route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`),
  );

  return sensitiveRoute || normalizedPath.slice(0, 512);
};

export const initGA = () => {
  const currentPath = typeof window === "undefined" ? "/" : window.location.pathname;
  if (isSensitiveRoute(currentPath)) return false;

  ReactGA.initialize("G-EQKP239D8Q", {
    gtagOptions: { send_page_view: false },
  });
  analyticsInitialized = true;
  return true;
};

export const logPageView = (path) => {
  if (!analyticsInitialized) return;

  const page = getPublicPagePath(path);
  const pageLocation =
    typeof window === "undefined" ? page : `${window.location.origin}${page}`;

  ReactGA.send({
    hitType: "pageview",
    page,
    page_location: pageLocation,
  });
};
