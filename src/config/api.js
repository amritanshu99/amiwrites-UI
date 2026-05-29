const DEFAULT_PRODUCTION_API_URL = "https://amiwrites-backend-app-2lp5.onrender.com";
const DEFAULT_DEVELOPMENT_API_URL = "http://localhost:5000";

const configuredApiUrl =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? DEFAULT_PRODUCTION_API_URL
    : DEFAULT_DEVELOPMENT_API_URL);

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const assetUrl = (path = "") => {
  if (/^https?:\/\//i.test(path)) return path;
  return apiUrl(path);
};
