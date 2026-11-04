import { act, renderHook } from "@testing-library/react";
import axios from "../utils/api";
import { useMostReadBlogs } from "./useMostReadBlogs";

jest.mock("../utils/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
const settle = () => act(async () => { await Promise.resolve(); });
beforeEach(() => { jest.useFakeTimers(); axios.get.mockReset(); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

test("follows the minute refresh timestamp and removes badges on a failed refresh", async () => {
  axios.get.mockResolvedValueOnce({ data: { items: [{ _id: "old-post", readCount: 2 }], meta: { refreshAt: new Date(Date.now() + 60_000).toISOString() } } })
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: { items: [{ _id: "old-post", readCount: 3 }] } });
  const { result } = renderHook(() => useMostReadBlogs());
  await settle();
  expect(axios.get).toHaveBeenCalledWith("/api/most-read", expect.objectContaining({ timeout: 12000 }));
  expect(result.current.items[0].readCount).toBe(2);
  act(() => jest.advanceTimersByTime(60_100));
  await settle();
  expect(result.current.items).toEqual([]);
  expect(result.current.status).toBe("failed");
  act(() => jest.advanceTimersByTime(30_000));
  await settle();
  expect(result.current.items[0].readCount).toBe(3);
});
