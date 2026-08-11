import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "../../utils/api";
import {
  createTrendingEventId,
  sendTrendingEvent,
  trendingRequestPath,
} from "../../utils/trendingAnalytics";
import BlogDetail from "./BlogDetail";

const mockRoute = { id: "post-1", pathname: "/blogs/post-1" };

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useParams: () => ({ id: mockRoute.id }),
    useLocation: () => ({ pathname: mockRoute.pathname }),
  }),
  { virtual: true },
);
jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("../../utils/seo", () => ({
  applySEO: jest.fn(),
  SITE_URL: "https://example.test",
}));
jest.mock("../../utils/trendingAnalytics", () => {
  const actual = jest.requireActual("../../utils/trendingAnalytics");
  return {
    ...actual,
    createTrendingEventId: jest.fn(),
    sendTrendingEvent: jest.fn(),
  };
});
jest.mock("lucide-react", () => {
  const Icon = () => <span aria-hidden="true" />;
  return {
    CalendarDays: Icon,
    CheckCircle2: Icon,
    Clipboard: Icon,
    Clock: Icon,
    Share2: Icon,
    Sparkles: Icon,
    UserRound: Icon,
  };
});

const makeBlog = (overrides = {}) => ({
  _id: "post-1",
  title: "Tracked article",
  content: "<p>A focused article for timing tests.</p>",
  words: 50,
  date: "2026-08-01T00:00:00.000Z",
  ...overrides,
});

let visibilityState = "visible";
let nowMs = 0;
let performanceNowSpy;

const flushPromises = async () => {
  await act(async () => Promise.resolve());
  await act(async () => Promise.resolve());
};

const advanceActiveTime = async (milliseconds) => {
  nowMs += milliseconds;
  act(() => jest.advanceTimersByTime(milliseconds));
  await flushPromises();
};

const setVisibility = async (nextVisibility) => {
  visibilityState = nextVisibility;
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  await flushPromises();
};

const installRequests = (blog = makeBlog(), rankedItems = [blog]) => {
  axios.get.mockImplementation((url) => {
    if (url === `/api/blogs/${mockRoute.id}`) {
      return Promise.resolve({ data: blog });
    }
    if (url === trendingRequestPath()) {
      return Promise.resolve({ data: { items: rankedItems } });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
};

const renderLoadedDetail = async () => {
  const view = render(<BlogDetail />);
  expect(await screen.findByRole("heading", { name: "Tracked article" })).toBeInTheDocument();
  await flushPromises();
  return view;
};

beforeEach(() => {
  jest.useFakeTimers();
  mockRoute.id = "post-1";
  mockRoute.pathname = "/blogs/post-1";
  visibilityState = "visible";
  nowMs = 0;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibilityState,
  });
  performanceNowSpy = jest.spyOn(performance, "now").mockImplementation(() => nowMs);
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  createTrendingEventId.mockReset().mockReturnValue("read:event:0001");
  sendTrendingEvent.mockReset().mockResolvedValue({ ok: true });
  axios.get.mockReset();
  axios.post.mockReset();
  installRequests();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  performanceNowSpy.mockRestore();
  window.scrollTo.mockRestore();
});

test("uses the shared bounded badge request and never sends a detail impression", async () => {
  await renderLoadedDetail();

  expect(axios.get).toHaveBeenCalledWith(
    trendingRequestPath(),
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(trendingRequestPath()).not.toContain("all=");
  expect(screen.getByText("Trending")).toBeInTheDocument();
  expect(
    sendTrendingEvent.mock.calls.some(([eventType]) => eventType === "impression"),
  ).toBe(false);
  expect(axios.post).not.toHaveBeenCalledWith(
    expect.stringContaining("trending-rl"),
    expect.anything(),
  );
});

test("aborts and ignores an older blog response after the route changes", async () => {
  let resolveOldBlog;
  let oldSignal;
  const newBlog = makeBlog({ _id: "post-2", title: "New article" });
  axios.get.mockImplementation((url, options) => {
    if (url === "/api/blogs/post-1") {
      oldSignal = options.signal;
      return new Promise((resolve) => {
        resolveOldBlog = resolve;
      });
    }
    if (url === "/api/blogs/post-2") return Promise.resolve({ data: newBlog });
    if (url === trendingRequestPath()) return Promise.resolve({ data: { items: [] } });
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });

  const view = render(<BlogDetail />);
  await waitFor(() => expect(resolveOldBlog).toEqual(expect.any(Function)));
  mockRoute.id = "post-2";
  mockRoute.pathname = "/blogs/post-2";
  view.rerender(<BlogDetail />);

  expect(await screen.findByRole("heading", { name: "New article" })).toBeInTheDocument();
  expect(oldSignal.aborted).toBe(true);

  act(() => resolveOldBlog({ data: makeBlog({ title: "Stale article" }) }));
  await flushPromises();
  expect(screen.queryByRole("heading", { name: "Stale article" })).not.toBeInTheDocument();
});

test("uses the uncapped server word threshold for long articles", async () => {
  installRequests(makeBlog({ words: 2000 }));
  await renderLoadedDetail();

  await advanceActiveTime(120000);
  expect(sendTrendingEvent).not.toHaveBeenCalled();
  await advanceActiveTime(239999);
  expect(sendTrendingEvent).not.toHaveBeenCalled();
  await advanceActiveTime(1);

  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(sendTrendingEvent.mock.calls[0][1]).toEqual(
    expect.objectContaining({ postId: "post-1", dwell_ms: 360000 }),
  );
});

test("caps an oversized server word threshold and payload at the six-hour contract", async () => {
  installRequests(makeBlog({ words: 999999999 }));
  await renderLoadedDetail();

  await advanceActiveTime(21_599_999);
  expect(sendTrendingEvent).not.toHaveBeenCalled();
  await advanceActiveTime(1);

  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(sendTrendingEvent.mock.calls[0][1].dwell_ms).toBe(21_600_000);
});

test("excludes hidden time, pauses the threshold timer, and resumes when visible", async () => {
  await renderLoadedDetail();

  await advanceActiveTime(4000);
  await setVisibility("hidden");
  await advanceActiveTime(100000);
  expect(sendTrendingEvent).not.toHaveBeenCalled();

  await setVisibility("visible");
  await advanceActiveTime(4999);
  expect(sendTrendingEvent).not.toHaveBeenCalled();
  await advanceActiveTime(1);

  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(sendTrendingEvent.mock.calls[0][1].dwell_ms).toBe(9000);
});

test("clamps article-relative scroll depth before terminal delivery", async () => {
  const view = await renderLoadedDetail();
  const article = screen.getByRole("heading", { name: "Tracked article" }).closest("article");
  article.getBoundingClientRect = jest.fn(() => ({
    top: -5000,
    bottom: -4000,
    height: 1000,
    left: 0,
    right: 1000,
    width: 1000,
  }));

  act(() => window.dispatchEvent(new Event("scroll")));
  await advanceActiveTime(1500);
  act(() => window.dispatchEvent(new Event("pagehide")));
  await flushPromises();

  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(sendTrendingEvent.mock.calls[0][1].scroll_depth).toBe(1);
  view.unmount();
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
});

test("does not reward passive initial viewport coverage without a scroll event", async () => {
  await renderLoadedDetail();
  const article = screen.getByRole("heading", { name: "Tracked article" }).closest("article");
  article.getBoundingClientRect = jest.fn(() => ({
    top: 0,
    bottom: 500,
    height: 500,
    left: 0,
    right: 1000,
    width: 1000,
  }));

  await advanceActiveTime(1500);
  act(() => window.dispatchEvent(new Event("pagehide")));
  await flushPromises();

  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(sendTrendingEvent.mock.calls[0][1].scroll_depth).toBe(0);
});

test("records at most one successful lifecycle outcome with its stable event ID", async () => {
  const view = await renderLoadedDetail();

  await advanceActiveTime(9000);
  act(() => {
    window.dispatchEvent(new Event("pagehide"));
    window.dispatchEvent(new Event("beforeunload"));
  });
  view.unmount();
  await flushPromises();

  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(sendTrendingEvent).toHaveBeenCalledWith(
    "read-end",
    expect.objectContaining({ postId: "post-1" }),
    { eventId: "read:event:0001", attempts: 1 },
  );
});

test("retries a failed nonterminal outcome only after the page is visible again", async () => {
  sendTrendingEvent
    .mockRejectedValueOnce(new Error("temporary failure"))
    .mockResolvedValueOnce({ ok: true });
  await renderLoadedDetail();

  await advanceActiveTime(9000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  await setVisibility("hidden");
  await advanceActiveTime(5000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);

  await setVisibility("visible");
  await advanceActiveTime(999);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  await advanceActiveTime(1);

  expect(sendTrendingEvent).toHaveBeenCalledTimes(2);
  expect(sendTrendingEvent.mock.calls.map((call) => call[2].eventId)).toEqual([
    "read:event:0001",
    "read:event:0001",
  ]);
});

test("does not retry a permanent 400 response", async () => {
  const permanentError = new Error("invalid event");
  permanentError.status = 400;
  sendTrendingEvent.mockRejectedValue(permanentError);
  await renderLoadedDetail();

  await advanceActiveTime(9000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  await advanceActiveTime(10000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
});

test("caps retryable nonterminal delivery at three exponential attempts", async () => {
  sendTrendingEvent.mockRejectedValue(new Error("offline"));
  await renderLoadedDetail();

  await advanceActiveTime(9000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  await advanceActiveTime(1000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(2);
  await advanceActiveTime(2000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(3);
  await advanceActiveTime(10000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(3);
});

test("waits for an in-flight read before a same-ID terminal fallback", async () => {
  let rejectInFlight;
  sendTrendingEvent
    .mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          rejectInFlight = reject;
        }),
    )
    .mockResolvedValueOnce({ ok: true });
  const view = await renderLoadedDetail();

  await advanceActiveTime(9000);
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  act(() => window.dispatchEvent(new Event("pagehide")));
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);

  act(() => rejectInFlight(new Error("receipt lost")));
  await flushPromises();
  expect(sendTrendingEvent).toHaveBeenCalledTimes(2);
  expect(sendTrendingEvent.mock.calls.map((call) => call[2].eventId)).toEqual([
    "read:event:0001",
    "read:event:0001",
  ]);
  expect(sendTrendingEvent.mock.calls[1][2].attempts).toBe(2);

  view.unmount();
  expect(sendTrendingEvent).toHaveBeenCalledTimes(2);
});

test("sends shared true as the single read outcome when either share link is activated", async () => {
  const view = await renderLoadedDetail();

  fireEvent.click(screen.getByRole("link", { name: "Share on Twitter" }));
  await flushPromises();
  fireEvent.click(screen.getByRole("link", { name: "Share on Facebook" }));
  view.unmount();
  await flushPromises();

  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(sendTrendingEvent).toHaveBeenCalledWith(
    "read-end",
    expect.objectContaining({ postId: "post-1", shared: true }),
    { eventId: "read:event:0001", attempts: 1 },
  );
});

test.each(["success", "error"])(
  "ignores stale summary %s after navigating to another blog",
  async (outcome) => {
    let settleSummary;
    let summarySignal;
    const newBlog = makeBlog({ _id: "post-2", title: "New article" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/blogs/post-1") return Promise.resolve({ data: makeBlog() });
      if (url === "/api/blogs/post-2") return Promise.resolve({ data: newBlog });
      if (url === trendingRequestPath()) return Promise.resolve({ data: { items: [] } });
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    axios.post.mockImplementation((url, payload, options) => {
      summarySignal = options.signal;
      return new Promise((resolve, reject) => {
        settleSummary = outcome === "success"
          ? () => resolve({ data: { response: "Stale generated summary" } })
          : () => reject({ response: { data: { error: "Stale summary error" } } });
      });
    });

    const view = await renderLoadedDetail();
    fireEvent.click(screen.getByRole("button", { name: "Generate AI summary" }));
    expect(screen.getByRole("button", { name: "Generate AI summary" })).toBeDisabled();

    mockRoute.id = "post-2";
    mockRoute.pathname = "/blogs/post-2";
    view.rerender(<BlogDetail />);
    expect(await screen.findByRole("heading", { name: "New article" })).toBeInTheDocument();
    expect(summarySignal.aborted).toBe(true);
    expect(screen.getByRole("button", { name: "Generate AI summary" })).not.toBeDisabled();

    act(() => settleSummary());
    await flushPromises();
    expect(screen.queryByText("Stale generated summary")).not.toBeInTheDocument();
    expect(screen.queryByText("Stale summary error")).not.toBeInTheDocument();
  },
);
