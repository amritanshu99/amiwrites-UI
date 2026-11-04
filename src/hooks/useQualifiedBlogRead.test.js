import { act, renderHook } from "@testing-library/react";
import { useQualifiedBlogRead } from "./useQualifiedBlogRead";
import { sendQualifiedRead } from "../utils/mostReadAnalytics";

jest.mock("../utils/mostReadAnalytics", () => ({ MIN_READ_MS: 30_000, sendQualifiedRead: jest.fn() }));
let visibility;
let now;
let nowSpy;
const advance = async (ms) => {
  now += ms;
  await act(async () => { jest.advanceTimersByTime(ms); });
};
const hide = (value) => act(() => {
  visibility = value;
  document.dispatchEvent(new Event("visibilitychange"));
});
beforeEach(() => {
  jest.useFakeTimers();
  now = 0;
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  nowSpy = jest.spyOn(performance, "now").mockImplementation(() => now);
  sendQualifiedRead.mockReset().mockResolvedValue({ ok: true, counted: true });
});
afterEach(() => { jest.clearAllTimers(); nowSpy.mockRestore(); jest.useRealTimers(); });

test("counts after 30 visible seconds and refreshes the badge only once", async () => {
  const refresh = jest.fn();
  renderHook(() => useQualifiedBlogRead("post-1", refresh));
  await advance(29_999);
  expect(sendQualifiedRead).not.toHaveBeenCalled();
  await advance(1);
  expect(sendQualifiedRead).toHaveBeenCalledWith("post-1", 30_000);
  expect(refresh).toHaveBeenCalledTimes(1);
  await advance(60_000);
  expect(sendQualifiedRead).toHaveBeenCalledTimes(1);
});

test("background time does not count and visible time resumes", async () => {
  renderHook(() => useQualifiedBlogRead("post-1"));
  await advance(10_000);
  hide("hidden");
  await advance(120_000);
  expect(sendQualifiedRead).not.toHaveBeenCalled();
  hide("visible");
  await advance(20_000);
  expect(sendQualifiedRead).toHaveBeenCalledWith("post-1", 30_000);
});

test("navigation resets the reading clock and brief visits do not count", async () => {
  const { rerender, unmount } = renderHook(({ id }) => useQualifiedBlogRead(id), { initialProps: { id: "post-1" } });
  await advance(20_000);
  rerender({ id: "post-2" });
  await advance(20_000);
  unmount();
  expect(sendQualifiedRead).not.toHaveBeenCalled();
  act(() => jest.runOnlyPendingTimers());
  expect(jest.getTimerCount()).toBe(0);
});

test("network failures retry with a bounded budget and duplicates do not trigger refresh", async () => {
  const refresh = jest.fn();
  sendQualifiedRead.mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ ok: true, counted: false, duplicate: true });
  renderHook(() => useQualifiedBlogRead("post-1", refresh));
  await advance(30_000);
  await advance(1000);
  await advance(60_000);
  expect(sendQualifiedRead).toHaveBeenCalledTimes(2);
  expect(refresh).not.toHaveBeenCalled();
});

test("a permanent validation failure does not retry", async () => {
  sendQualifiedRead.mockRejectedValue(Object.assign(new Error("invalid"), { status: 400 }));
  renderHook(() => useQualifiedBlogRead("post-1"));
  await advance(30_000);
  await advance(60_000);
  expect(sendQualifiedRead).toHaveBeenCalledTimes(1);
});

test("unmount during delivery never schedules retries or refreshes an abandoned page", async () => {
  let reject;
  sendQualifiedRead.mockReturnValue(new Promise((resolve, rejectPromise) => { reject = rejectPromise; }));
  const refresh = jest.fn();
  const { unmount } = renderHook(() => useQualifiedBlogRead("post-1", refresh));
  await advance(30_000);
  unmount();
  await act(async () => reject(new Error("offline")));
  await advance(60_000);
  expect(sendQualifiedRead).toHaveBeenCalledTimes(1);
  expect(refresh).not.toHaveBeenCalled();
  act(() => jest.runOnlyPendingTimers());
  expect(jest.getTimerCount()).toBe(0);
});
