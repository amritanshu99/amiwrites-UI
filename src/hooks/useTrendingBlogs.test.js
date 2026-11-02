import { act, renderHook } from "@testing-library/react";
import axios from "../utils/api";
import { useTrendingBlogs } from "./useTrendingBlogs";

jest.mock("../utils/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
const post = { _id: "post-1", title: "One article" };
const settle = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  jest.useFakeTimers();
  axios.get.mockReset();
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

test("removes malformed and duplicate entries without changing the server order", async () => {
  axios.get.mockResolvedValue({ data: { items: [null, post, post, {}, { _id: "post-2" }] } });
  const { result } = renderHook(() => useTrendingBlogs());
  await settle();
  expect(result.current.items.map((item) => item._id)).toEqual(["post-1", "post-2"]);
  expect(result.current.status).toBe("ready");
});

test("clears expired badges on refresh failure and recovers automatically", async () => {
  axios.get.mockResolvedValueOnce({ data: { items: [post], meta: { epochEndsAt: new Date(Date.now() + 1000).toISOString() } } })
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: { items: [{ _id: "post-2" }] } });
  const { result } = renderHook(() => useTrendingBlogs());
  await settle();
  expect(result.current.items).toEqual([post]);
  act(() => jest.advanceTimersByTime(1100));
  await settle();
  expect(result.current.items).toEqual([]);
  expect(result.current.status).toBe("failed");
  act(() => jest.advanceTimersByTime(30_000));
  await settle();
  expect(result.current.items).toEqual([{ _id: "post-2" }]);
  expect(result.current.status).toBe("ready");
});

test("a malformed response exposes retry and a manual refresh recovers", async () => {
  axios.get.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({ data: { items: [post] } });
  const { result } = renderHook(() => useTrendingBlogs());
  await settle();
  expect(result.current.status).toBe("failed");
  act(() => result.current.refresh());
  await settle();
  expect(result.current.items).toEqual([post]);
  expect(result.current.status).toBe("ready");
});

test("waits for an enabled article and aborts pending work when unmounted", async () => {
  axios.get.mockReturnValue(new Promise(() => {}));
  const { rerender, unmount } = renderHook(({ enabled }) => useTrendingBlogs(enabled), { initialProps: { enabled: false } });
  expect(axios.get).not.toHaveBeenCalled();
  rerender({ enabled: true });
  const signal = axios.get.mock.calls[0][1].signal;
  expect(signal.aborted).toBe(false);
  unmount();
  expect(signal.aborted).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});
