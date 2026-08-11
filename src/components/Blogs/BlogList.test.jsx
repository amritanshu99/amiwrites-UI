import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "../../utils/api";
import { useVerifiedAuth } from "../../hooks/useVerifiedAuth";
import {
  createTrendingEventId,
  sendTrendingEvent,
  trendingRequestPath,
} from "../../utils/trendingAnalytics";
import BlogList from "./BlogList";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => {
    const ReactModule = jest.requireActual("react");
    return {
      Link: ReactModule.forwardRef(({ to, children, onClick, ...props }, ref) =>
        ReactModule.createElement(
          "a",
          {
            ...props,
            href: to,
            ref,
            onClick: (event) => {
              event.preventDefault();
              onClick?.(event);
            },
          },
          children,
        ),
      ),
      useNavigate: () => mockNavigate,
      useLocation: () => ({ pathname: "/blogs" }),
    };
  },
  { virtual: true },
);
jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), delete: jest.fn() },
}));
jest.mock("../../hooks/useVerifiedAuth", () => ({ useVerifiedAuth: jest.fn() }));
jest.mock("../../hooks/useDebounce", () => ({ useDebounce: (value) => value }));
jest.mock("../Floating-buttons/PushNotificationButton", () => () => null);
jest.mock("../../utils/trendingAnalytics", () => {
  const actual = jest.requireActual("../../utils/trendingAnalytics");
  return {
    ...actual,
    createTrendingEventId: jest.fn(),
    sendTrendingEvent: jest.fn(),
  };
});

const rankedFirst = {
  _id: "ranked-1",
  title: "Ranked first",
  content: "<p>First ranked preview</p>",
  date: "2026-08-01T00:00:00.000Z",
};
const rankedSecond = {
  _id: "ranked-2",
  title: "Ranked second",
  content: "<p>Second ranked preview</p>",
  date: "2026-07-01T00:00:00.000Z",
};
const chronologicalOnly = {
  _id: "chronological-1",
  title: "Third article",
  content: "<p>Chronological preview</p>",
  date: "2026-08-10T00:00:00.000Z",
};

class MockIntersectionObserver {
  static instances = [];

  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
    MockIntersectionObserver.instances.push(this);
  }

  trigger(target, intersectionRatio = 1) {
    this.callback([
      { target, isIntersecting: intersectionRatio > 0, intersectionRatio },
    ]);
  }
}

const renderList = () => render(<BlogList />);

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

const installSuccessfulRequests = () => {
  axios.get.mockImplementation((url) => {
    if (url === trendingRequestPath()) {
      return Promise.resolve({ data: { items: [rankedSecond, rankedFirst] } });
    }
    if (url.includes("search=Third")) {
      return Promise.resolve({ data: { blogs: [chronologicalOnly], hasMore: false } });
    }
    if (url.startsWith("/api/blogs?")) {
      return Promise.resolve({
        data: {
          blogs: [rankedFirst, chronologicalOnly, rankedSecond],
          hasMore: false,
        },
      });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
};

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  global.IntersectionObserver = MockIntersectionObserver;
  localStorage.clear();
  mockNavigate.mockReset();
  axios.get.mockReset();
  axios.delete.mockReset().mockResolvedValue({ data: {} });
  useVerifiedAuth.mockReturnValue({ isAdmin: false, verifiedAdminToken: null });
  let eventNumber = 0;
  createTrendingEventId.mockImplementation(
    () => `test:event:${String(++eventNumber).padStart(4, "0")}`,
  );
  sendTrendingEvent.mockReset().mockResolvedValue({ ok: true });
  installSuccessfulRequests();
});

afterEach(() => {
  delete global.IntersectionObserver;
});

test("uses the bounded trending request and merges ranked posts first without duplicates", async () => {
  renderList();

  await screen.findByRole("heading", { name: "Third article" });
  await waitFor(() => {
    expect(screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)).toEqual([
      "Ranked second",
      "Ranked first",
      "Third article",
    ]);
  });

  expect(screen.getByRole("combobox", { name: "Sort blogs" })).toHaveValue("trending");
  expect(axios.get).toHaveBeenCalledWith(
    trendingRequestPath(),
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(trendingRequestPath()).not.toContain("all=");
  expect(screen.getAllByLabelText("Trending")).toHaveLength(2);

  fireEvent.change(screen.getByRole("textbox", { name: "Search blogs by title" }), {
    target: { value: "Third" },
  });

  await waitFor(() => {
    expect(screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)).toEqual([
      "Third article",
    ]);
  });
});

test("does not expose chronological cards before the initial slate and falls back on failure", async () => {
  const trendingRequest = deferred();
  axios.get.mockImplementation((url) => {
    if (url === trendingRequestPath()) return trendingRequest.promise;
    if (url.startsWith("/api/blogs?")) {
      return Promise.resolve({
        data: { blogs: [rankedFirst, chronologicalOnly], hasMore: false },
      });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });

  renderList();
  await waitFor(() =>
    expect(axios.get.mock.calls.some(([url]) => url.startsWith("/api/blogs?"))).toBe(true),
  );
  await act(async () => Promise.resolve());

  expect(screen.queryByRole("heading", { name: "Ranked first" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Third article" })).not.toBeInTheDocument();

  await act(async () => {
    trendingRequest.reject(new Error("trending unavailable"));
    await Promise.resolve();
  });

  expect(await screen.findByRole("heading", { name: "Ranked first" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Third article" })).toBeInTheDocument();
});

test("refetches the trending slate when the advertised epoch ends", async () => {
  let trendingCalls = 0;
  axios.get.mockImplementation((url) => {
    if (url === trendingRequestPath()) {
      trendingCalls += 1;
      return Promise.resolve({
        data: {
          items: trendingCalls === 1 ? [rankedSecond] : [rankedFirst],
          meta: {
            epochEndsAt: new Date(
              Date.now() + (trendingCalls === 1 ? 250 : 60_000),
            ).toISOString(),
          },
        },
      });
    }
    if (url.startsWith("/api/blogs?")) {
      return Promise.resolve({
        data: {
          blogs: [rankedFirst, chronologicalOnly, rankedSecond],
          hasMore: false,
        },
      });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });

  renderList();
  await screen.findByRole("heading", { name: "Ranked second" });
  expect(screen.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent(
    "Ranked second",
  );

  await waitFor(() => expect(trendingCalls).toBe(2), { timeout: 2500 });
  await waitFor(() =>
    expect(screen.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent(
      "Ranked first",
    ),
  );
});

test("tracks an impression only after a card is at least half visible and only once", async () => {
  renderList();
  const title = await screen.findByRole("heading", { name: "Ranked second" });
  const card = title.closest("article");
  const observer = MockIntersectionObserver.instances.find(
    (instance) => instance.options.threshold === 0.5,
  );

  act(() => observer.trigger(card, 0.49));
  expect(sendTrendingEvent).not.toHaveBeenCalled();

  act(() => {
    observer.trigger(card, 0.75);
    observer.trigger(card, 1);
  });

  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(sendTrendingEvent).toHaveBeenCalledWith(
    "impression",
    { postId: "ranked-2" },
    { eventId: "test:event:0001", attempts: 2 },
  );
});

test("re-observes a failed impression and retries it with the same event id", async () => {
  sendTrendingEvent
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ ok: true });
  renderList();
  const title = await screen.findByRole("heading", { name: "Ranked second" });
  const card = title.closest("article");
  const observer = MockIntersectionObserver.instances.find(
    (instance) => instance.options.threshold === 0.5,
  );
  const observedCardCount = () =>
    observer.observe.mock.calls.filter(([target]) => target === card).length;
  const initialObserveCount = observedCardCount();

  act(() => observer.trigger(card, 0.75));
  await waitFor(() => expect(sendTrendingEvent).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(observedCardCount()).toBeGreaterThan(initialObserveCount));

  act(() => observer.trigger(card, 0.75));
  await waitFor(() => expect(sendTrendingEvent).toHaveBeenCalledTimes(2));

  const impressionCalls = sendTrendingEvent.mock.calls.filter(
    ([eventType]) => eventType === "impression",
  );
  expect(impressionCalls[0][2].eventId).toBe("test:event:0001");
  expect(impressionCalls[1][2].eventId).toBe(impressionCalls[0][2].eventId);
  expect(createTrendingEventId).toHaveBeenCalledTimes(1);

  act(() => observer.trigger(card, 1));
  await act(async () => Promise.resolve());
  expect(sendTrendingEvent).toHaveBeenCalledTimes(2);
});

test("does not loop or re-observe an impression after a permanent 400", async () => {
  const permanentError = Object.assign(new Error("invalid event"), { status: 400 });
  sendTrendingEvent.mockRejectedValue(permanentError);
  renderList();
  const title = await screen.findByRole("heading", { name: "Ranked second" });
  const card = title.closest("article");
  const observer = MockIntersectionObserver.instances.find(
    (instance) => instance.options.threshold === 0.5,
  );
  const observedCardCount = () =>
    observer.observe.mock.calls.filter(([target]) => target === card).length;
  const initialObserveCount = observedCardCount();

  act(() => observer.trigger(card, 0.75));
  await waitFor(() => expect(sendTrendingEvent).toHaveBeenCalledTimes(1));
  await act(async () => Promise.resolve());

  act(() => observer.trigger(card, 1));
  await act(async () => Promise.resolve());
  expect(sendTrendingEvent).toHaveBeenCalledTimes(1);
  expect(observedCardCount()).toBe(initialObserveCount);
});

test("tracks one click for mouse and simulated keyboard link activation", async () => {
  renderList();
  await screen.findByRole("heading", { name: "Ranked second" });
  const firstLink = screen.getByRole("link", { name: "Read Ranked second" });
  const secondLink = screen.getByRole("link", { name: "Read Ranked first" });

  fireEvent.click(firstLink);
  secondLink.focus();
  userEvent.keyboard("{enter}");

  const clickCalls = sendTrendingEvent.mock.calls.filter(([eventType]) => eventType === "click");
  expect(clickCalls).toHaveLength(2);
  expect(clickCalls.map(([, payload]) => payload.postId)).toEqual(["ranked-2", "ranked-1"]);
  expect(clickCalls[0][2]).toEqual({ eventId: "test:event:0001", attempts: 2 });
  expect(clickCalls[1][2]).toEqual({ eventId: "test:event:0002", attempts: 2 });
});

test("delete keyboard and mouse events never activate or track the card", async () => {
  localStorage.setItem("token", "admin-token");
  useVerifiedAuth.mockReturnValue({
    isAdmin: true,
    verifiedAdminToken: "admin-token",
  });
  renderList();
  const deleteButton = await screen.findByRole("button", {
    name: "Delete blog titled Ranked second",
  });

  fireEvent.keyDown(deleteButton, { key: "Enter" });
  fireEvent.click(deleteButton);

  await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));
  expect(sendTrendingEvent.mock.calls.some(([eventType]) => eventType === "click")).toBe(false);
});

test("a late trending response cannot restore a successfully deleted post", async () => {
  const trendingRequest = deferred();
  localStorage.setItem("token", "admin-token");
  useVerifiedAuth.mockReturnValue({
    isAdmin: true,
    verifiedAdminToken: "admin-token",
  });
  axios.get.mockImplementation((url) => {
    if (url === trendingRequestPath()) return trendingRequest.promise;
    if (url.startsWith("/api/blogs?")) {
      return Promise.resolve({
        data: {
          blogs: [rankedFirst, chronologicalOnly, rankedSecond],
          hasMore: false,
        },
      });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });

  renderList();
  fireEvent.change(screen.getByRole("combobox", { name: "Sort blogs" }), {
    target: { value: "latest" },
  });
  const deleteButton = await screen.findByRole("button", {
    name: "Delete blog titled Ranked second",
  });
  fireEvent.click(deleteButton);
  await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));

  await act(async () => {
    trendingRequest.resolve({
      data: {
        items: [rankedSecond, rankedFirst],
        meta: { epochEndsAt: new Date(Date.now() + 60_000).toISOString() },
      },
    });
    await Promise.resolve();
  });

  fireEvent.change(screen.getByRole("combobox", { name: "Sort blogs" }), {
    target: { value: "trending" },
  });
  expect(await screen.findByRole("heading", { name: "Ranked first" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Read Ranked second" })).not.toBeInTheDocument();
});

test("retries a failed pagination page instead of skipping to the next page", async () => {
  let pageTwoAttempts = 0;
  axios.get.mockImplementation((url) => {
    if (url === trendingRequestPath()) return Promise.resolve({ data: { items: [] } });
    if (url.includes("page=1")) {
      return Promise.resolve({ data: { blogs: [rankedFirst], hasMore: true } });
    }
    if (url.includes("page=2")) {
      pageTwoAttempts += 1;
      return pageTwoAttempts === 1
        ? Promise.reject(new Error("temporary failure"))
        : Promise.resolve({ data: { blogs: [chronologicalOnly], hasMore: false } });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });

  renderList();
  await screen.findByRole("heading", { name: "Ranked first" });
  await waitFor(() => {
    expect(
      MockIntersectionObserver.instances.some(
        (instance) => instance.options.threshold === 0,
      ),
    ).toBe(true);
  });
  const loaderObserver = MockIntersectionObserver.instances.find(
    (instance) => instance.options.threshold === 0,
  );
  const loader = loaderObserver.observe.mock.calls[0][0];

  act(() => loaderObserver.trigger(loader));
  await waitFor(() => expect(pageTwoAttempts).toBe(1));
  await act(async () => Promise.resolve());

  act(() => loaderObserver.trigger(loader));
  expect(await screen.findByRole("heading", { name: "Third article" })).toBeInTheDocument();
  expect(pageTwoAttempts).toBe(2);
  expect(axios.get.mock.calls.some(([url]) => url.includes("page=3"))).toBe(false);
});

test("aborts and ignores an older blog response after the search changes", async () => {
  let resolveOldRequest;
  let oldSignal;
  axios.get.mockImplementation((url, options) => {
    if (url === trendingRequestPath()) {
      return Promise.resolve({ data: { items: [] } });
    }
    if (url.includes("search=Third")) {
      return Promise.resolve({ data: { blogs: [chronologicalOnly], hasMore: false } });
    }
    if (url.startsWith("/api/blogs?")) {
      oldSignal = options.signal;
      return new Promise((resolve) => {
        resolveOldRequest = resolve;
      });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });

  renderList();
  await waitFor(() => expect(resolveOldRequest).toEqual(expect.any(Function)));
  fireEvent.change(screen.getByRole("textbox", { name: "Search blogs by title" }), {
    target: { value: "Third" },
  });

  expect(await screen.findByRole("heading", { name: "Third article" })).toBeInTheDocument();
  expect(oldSignal.aborted).toBe(true);

  act(() => {
    resolveOldRequest({ data: { blogs: [rankedFirst], hasMore: false } });
  });
  await act(async () => Promise.resolve());
  expect(screen.queryByRole("heading", { name: "Ranked first" })).not.toBeInTheDocument();
});
