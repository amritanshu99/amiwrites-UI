import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useReducedMotion } from "framer-motion";
import TechByteSwipeView from "./TechByteSwipeView";

jest.mock("framer-motion", () => ({
  useReducedMotion: jest.fn(),
}));

const articles = [
  {
    url: "https://news.example.com/one",
    image: "https://images.example.com/one.jpg",
    title: "Smaller AI models move onto phones",
    description: "New chips make more private on-device assistants practical.",
    publishedAt: "2026-08-25T08:00:00.000Z",
    source: { name: "Circuit Daily" },
  },
  {
    url: "https://news.example.com/two",
    image: "https://images.example.com/two.jpg",
    title: "Battery research reaches a new milestone",
    description: "A revised chemistry promises longer-lived devices.",
    publishedAt: "2026-08-25T09:00:00.000Z",
    source: { name: "Future Wire" },
  },
  {
    url: "https://news.example.com/three",
    image: "https://images.example.com/three.jpg",
    title: "Open source robotics gets easier to use",
    description: "A new toolkit reduces the setup needed for small robots.",
    publishedAt: "2026-08-25T10:00:00.000Z",
    source: { name: "Robot Review" },
  },
];

const formatPublishedAt = (value) => `Published ${value}`;

const rectAt = (top) => ({
  bottom: top + 600,
  height: 600,
  left: 0,
  right: 360,
  top,
  width: 360,
  x: 0,
  y: top,
  toJSON: () => ({}),
});

function renderSwipeView(overrides = {}) {
  const onImageError = jest.fn();
  const onOpenArticle = jest.fn();

  render(
    <TechByteSwipeView
      articles={articles}
      formatPublishedAt={formatPublishedAt}
      onImageError={onImageError}
      onOpenArticle={onOpenArticle}
      {...overrides}
    />,
  );

  return { onImageError, onOpenArticle };
}

function installDeckLayout() {
  const deck = screen.getByLabelText("Tech news swipe deck");
  const stories = screen.getAllByRole("article");

  Object.defineProperty(deck, "clientHeight", {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(deck, "scrollTop", {
    configurable: true,
    value: 0,
    writable: true,
  });

  jest.spyOn(deck, "getBoundingClientRect").mockImplementation(() => rectAt(100));
  stories.forEach((story, index) => {
    jest
      .spyOn(story, "getBoundingClientRect")
      .mockImplementation(() => rectAt(100 + index * 600 - deck.scrollTop));
  });

  const scrollTo = jest.fn(({ top }) => {
    deck.scrollTop = top;
  });
  Object.defineProperty(deck, "scrollTo", {
    configurable: true,
    value: scrollTo,
  });

  return { deck, scrollTo, stories };
}

describe("TechByteSwipeView", () => {
  let animationFrames;

  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
    animationFrames = new Map();
    let nextAnimationFrameId = 0;

    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      nextAnimationFrameId += 1;
      animationFrames.set(nextAnimationFrameId, callback);
      return nextAnimationFrameId;
    });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation((frameId) => {
      animationFrames.delete(frameId);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const flushAnimationFrame = () => {
    const pendingFrames = Array.from(animationFrames.entries());
    animationFrames.clear();

    act(() => {
      pendingFrames.forEach(([, callback]) => callback(16));
    });
  };

  test("moves through stories with controls and keyboard alternatives", () => {
    const { onOpenArticle } = renderSwipeView();
    const { deck, scrollTo, stories } = installDeckLayout();
    const controls = screen.getByRole("navigation", {
      name: "Swipe deck controls",
    });
    const previous = within(controls).getByRole("button", {
      name: "Previous story",
    });
    const next = within(controls).getByRole("button", { name: "Next story" });

    expect(screen.getByRole("status")).toHaveTextContent("Story 1 of 3");
    expect(screen.getByRole("progressbar", { name: "Reading progress" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(stories[0]).toHaveAttribute("aria-current", "true");
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    fireEvent.click(next);

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: "smooth" });
    expect(screen.getByRole("status")).toHaveTextContent("Story 2 of 3");
    expect(stories[1]).toHaveAttribute("aria-current", "true");
    expect(previous).toBeEnabled();

    expect(fireEvent.keyDown(deck, { key: "PageDown" })).toBe(false);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1200, behavior: "smooth" });
    expect(screen.getByRole("status")).toHaveTextContent("Story 3 of 3");
    expect(stories[2]).toHaveAttribute("aria-current", "true");
    expect(next).toBeDisabled();

    expect(fireEvent.keyDown(deck, { key: "Home" })).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent("Story 1 of 3");
    expect(previous).toBeDisabled();

    expect(fireEvent.keyDown(deck, { key: "End" })).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent("Story 3 of 3");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Read full story: Open source robotics gets easier to use",
      }),
    );
    expect(onOpenArticle).toHaveBeenCalledWith("https://news.example.com/three");
  });

  test("updates the active story after a native snap-scroll position changes", () => {
    renderSwipeView();
    const { deck, stories } = installDeckLayout();

    deck.scrollTop = 600;
    fireEvent.scroll(deck);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

    flushAnimationFrame();

    expect(screen.getByRole("status")).toHaveTextContent("Story 2 of 3");
    expect(screen.getByRole("progressbar", { name: "Reading progress" })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    expect(stories[0]).not.toHaveAttribute("aria-current");
    expect(stories[1]).toHaveAttribute("aria-current", "true");
  });

  test("uses instant navigation when reduced motion is preferred", () => {
    useReducedMotion.mockReturnValue(true);
    renderSwipeView();
    const { scrollTo } = installDeckLayout();

    fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: "auto" });
  });

  test("keeps page-level arrow shortcuts scoped to the desktop reader", () => {
    renderSwipeView();
    const { scrollTo } = installDeckLayout();

    expect(fireEvent.keyDown(window, { key: "ArrowDown" })).toBe(true);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Story 1 of 3");
  });

  test("falls back to assigning scrollTop when scrollTo is unavailable", () => {
    renderSwipeView();
    const { deck } = installDeckLayout();
    Object.defineProperty(deck, "scrollTo", {
      configurable: true,
      value: undefined,
    });

    fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    expect(deck.scrollTop).toBe(600);
    expect(screen.getByRole("status")).toHaveTextContent("Story 2 of 3");
  });

  test("renders a useful empty reader state", () => {
    render(
      <TechByteSwipeView
        articles={[]}
        formatPublishedAt={formatPublishedAt}
      />,
    );

    expect(
      screen.getByLabelText("Swipe through tech news"),
    ).toHaveTextContent("No stories are available in swipe view yet.");
  });

  test("handles a non-array feed as an empty reader", () => {
    render(
      <TechByteSwipeView
        articles={null}
        formatPublishedAt={formatPublishedAt}
      />,
    );

    expect(
      screen.getByLabelText("Swipe through tech news"),
    ).toHaveTextContent("No stories are available in swipe view yet.");
  });
});
