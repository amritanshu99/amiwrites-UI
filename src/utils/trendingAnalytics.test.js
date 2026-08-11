import { API_BASE_URL } from "../config/api";
import {
  TRENDING_LIMIT,
  TRENDING_WINDOW_DAYS,
  createTrendingEventId,
  isValidTrendingEventId,
  sendTrendingEvent,
  trendingRequestPath,
} from "./trendingAnalytics";

test("creates valid opaque event IDs and a bounded trending request", () => {
  const ids = new Set(Array.from({ length: 12 }, () => createTrendingEventId()));

  expect(ids.size).toBe(12);
  ids.forEach((eventId) => expect(isValidTrendingEventId(eventId)).toBe(true));
  expect(trendingRequestPath()).toBe(
    `/api/trending-rl/trending?limit=${TRENDING_LIMIT}&windowDays=${TRENDING_WINDOW_DAYS}`,
  );
  expect(trendingRequestPath()).not.toContain("all=");
});

test("retries keepalive delivery with the same event ID and API base URL", async () => {
  const fetchImpl = jest
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ ok: true, status: 200 });
  const eventId = "click:12345678";

  await expect(
    sendTrendingEvent(
      "click",
      { postId: "post-1" },
      { eventId, attempts: 2, fetchImpl },
    ),
  ).resolves.toEqual(expect.objectContaining({ eventId }));

  expect(fetchImpl).toHaveBeenCalledTimes(2);
  fetchImpl.mock.calls.forEach(([url, options]) => {
    expect(url).toBe(`${API_BASE_URL}/api/trending-rl/events/click`);
    expect(options).toEqual(
      expect.objectContaining({ method: "POST", keepalive: true }),
    );
    expect(JSON.parse(options.body)).toEqual({ postId: "post-1", eventId });
  });
});

test("rejects malformed IDs before making a request", async () => {
  const fetchImpl = jest.fn();

  await expect(
    sendTrendingEvent(
      "impression",
      { postId: "post-1" },
      { eventId: "bad/id", fetchImpl },
    ),
  ).rejects.toThrow("valid trending eventId");
  expect(fetchImpl).not.toHaveBeenCalled();
});

test("retries transient 408 and 429 responses but not permanent client errors", async () => {
  const transientFetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 429 })
    .mockResolvedValueOnce({ ok: true, status: 200 });

  await expect(
    sendTrendingEvent(
      "read-end",
      { postId: "post-1", dwell_ms: 1000, scroll_depth: 0 },
      { eventId: "read:12345678", attempts: 2, fetchImpl: transientFetch },
    ),
  ).resolves.toEqual(expect.objectContaining({ eventId: "read:12345678" }));
  expect(transientFetch).toHaveBeenCalledTimes(2);

  const permanentFetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });
  await expect(
    sendTrendingEvent(
      "read-end",
      { postId: "post-1", dwell_ms: 1000, scroll_depth: 0 },
      { eventId: "read:87654321", attempts: 3, fetchImpl: permanentFetch },
    ),
  ).rejects.toMatchObject({ status: 400 });
  expect(permanentFetch).toHaveBeenCalledTimes(1);
});
