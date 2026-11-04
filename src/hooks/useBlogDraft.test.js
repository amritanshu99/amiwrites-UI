import { act, renderHook } from "@testing-library/react";
import { BLOG_DRAFT_KEY, useBlogDraft } from "./useBlogDraft";

beforeEach(() => { localStorage.clear(); jest.useFakeTimers(); });
afterEach(() => { jest.restoreAllMocks(); jest.clearAllTimers(); jest.useRealTimers(); });

test("debounces changes and saves the latest complete draft", () => {
  const { result } = renderHook(() => useBlogDraft());
  act(() => result.current.setDraft({ title: "First", category: "", html: "<p>Words</p>", text: "Words" }));
  act(() => jest.advanceTimersByTime(300));
  expect(localStorage.getItem(BLOG_DRAFT_KEY)).toBeNull();
  act(() => result.current.setDraft((previous) => ({ ...previous, title: "Latest" })));
  act(() => jest.advanceTimersByTime(500));
  expect(JSON.parse(localStorage.getItem(BLOG_DRAFT_KEY)).title).toBe("Latest");
  expect(result.current.saveStatus).toBe("saved");
});

test("blocked storage reports failure and warns before closing a non-empty draft", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  const { result } = renderHook(() => useBlogDraft());
  act(() => result.current.setDraft({ title: "Keep this", category: "", html: "", text: "" }));
  act(() => jest.advanceTimersByTime(500));
  expect(result.current.saveStatus).toBe("unavailable");
  const event = new Event("beforeunload", { cancelable: true });
  act(() => window.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
});

test("discard cancels a pending save and cannot resurrect the previous draft", () => {
  const { result, unmount } = renderHook(() => useBlogDraft());
  act(() => result.current.setDraft({ title: "Remove this", category: "", html: "<p>Draft</p>", text: "Draft" }));
  act(() => result.current.discard());
  act(() => jest.advanceTimersByTime(500));
  unmount();
  expect(localStorage.getItem(BLOG_DRAFT_KEY)).toBeNull();
});

test("malformed or unsupported stored drafts do not crash the editor", () => {
  localStorage.setItem(BLOG_DRAFT_KEY, "{bad json");
  const first = renderHook(() => useBlogDraft());
  expect(first.result.current.draft.title).toBe("");
  first.unmount();
  localStorage.setItem(BLOG_DRAFT_KEY, JSON.stringify({ version: 99, title: "Unknown", html: "<p>Text</p>" }));
  const second = renderHook(() => useBlogDraft());
  expect(second.result.current.restored).toBe(false);
});
