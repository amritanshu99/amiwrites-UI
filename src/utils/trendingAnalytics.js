import { apiUrl } from "../config/api";

export const TRENDING_LIMIT = 4;
export const TRENDING_WINDOW_DAYS = 60;

const EVENT_TYPES = new Set(["impression", "click", "read-end"]);
const EVENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export const trendingRequestPath = () =>
  `/api/trending-rl/trending?limit=${TRENDING_LIMIT}&windowDays=${TRENDING_WINDOW_DAYS}`;

export const isValidTrendingEventId = (value) =>
  typeof value === "string" && EVENT_ID_PATTERN.test(value);

export const createTrendingEventId = () => {
  const browserCrypto = typeof window !== "undefined" ? window.crypto : undefined;
  const randomUUID = browserCrypto?.randomUUID;
  if (typeof randomUUID === "function") {
    return randomUUID.call(browserCrypto);
  }

  const randomPart = Math.random().toString(36).slice(2, 14);
  return `trl_${Date.now().toString(36)}_${randomPart}`;
};

export async function sendTrendingEvent(
  eventType,
  payload,
  {
    eventId = payload?.eventId || createTrendingEventId(),
    attempts = 1,
    fetchImpl = typeof window !== "undefined" ? window.fetch : undefined,
  } = {},
) {
  if (!EVENT_TYPES.has(eventType)) {
    throw new TypeError(`Unsupported trending event type: ${eventType}`);
  }
  if (!isValidTrendingEventId(eventId)) {
    throw new TypeError("A valid trending eventId is required");
  }
  if (!payload?.postId) {
    throw new TypeError("A postId is required for trending events");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetch is unavailable for trending event delivery");
  }

  const maxAttempts = Math.min(3, Math.max(1, Number(attempts) || 1));
  const body = JSON.stringify({ ...payload, eventId });
  const url = apiUrl(`/api/trending-rl/events/${eventType}`);
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        mode: "cors",
        keepalive: true,
        credentials: "omit",
      });

      if (response?.ok) return { eventId, response };

      const error = new Error(`Trending event failed with status ${response?.status || 0}`);
      error.status = response?.status || 0;
      lastError = error;

      if (
        response?.status >= 400 &&
        response.status < 500 &&
        response.status !== 408 &&
        response.status !== 429
      ) {
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Trending event delivery failed");
}
