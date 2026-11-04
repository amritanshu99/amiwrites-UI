import { getReaderId, sendQualifiedRead } from "./mostReadAnalytics";

test("uses a stable anonymous browser ID without relying on authentication", async () => {
  localStorage.clear();
  const first = getReaderId();
  expect(first.length).toBeGreaterThanOrEqual(16);
  expect(getReaderId()).toBe(first);
  const originalFetch = window.fetch;
  window.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ counted: true }) });
  try {
    await expect(sendQualifiedRead("post-1", 30_000)).resolves.toEqual({ counted: true });
    const [url, options] = window.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/most-read\/reads$/);
    expect(JSON.parse(options.body)).toEqual({ postId: "post-1", readerId: first, dwell_ms: 30_000 });
    expect(options.credentials).toBe("omit");
  } finally { window.fetch = originalFetch; }
});
