// Intentionally match non-printing control characters in untrusted URLs.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;
const MAX_URL_LENGTH = 2048;

export function getSafeHttpsUrl(value) {
  if (typeof value !== "string") return null;

  const candidate = value.replace(CONTROL_CHARACTERS, "").trim();
  if (!candidate || candidate.length > MAX_URL_LENGTH) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function getSafeImageUrl(value, fallback = "/og-image.jpg") {
  if (typeof value !== "string") return fallback;
  const candidate = value.replace(CONTROL_CHARACTERS, "").trim();

  if (/^\/(?!\/)/.test(candidate) && !candidate.includes("\\")) return candidate;
  return getSafeHttpsUrl(candidate) || fallback;
}
