import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useReducedMotion } from "framer-motion";
import TechByteScrollView from "./TechByteScrollView";

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
  bottom: top + 560,
  height: 560,
  left: 0,
  right: 1100,
  top,
  width: 1100,
  x: 0,
  y: top,
  toJSON: () => ({}),
});

function renderScrollView(overrides = {}) {
  const onImageError = jest.fn();
  const onOpenArticle = jest.fn();

  render(
    <TechByteScrollView
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
  const deck = screen.getByLabelText("Tech news scroll reader");
  const stories = screen.getAllByRole("article");

  Object.defineProperty(deck, "clientHeight", {
    configurable: true,
    value: 560,
  });
  Object.defineProperty(deck, "scrollTop", {
    configurable: true,
    value: 0,
    writable: true,
  });

  jest.spyOn(deck, "getBoundingClientRect").mockImplementation(() => rectAt(120));
  stories.forEach((story, index) => {
    jest
      .spyOn(story, "getBoundingClientRect")
      .mockImplementation(() => rectAt(120 + index * 560 - deck.scrollTop));
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

describe("TechByteScrollView", () => {
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
    const { onOpenArticle } = renderScrollView();
    const { deck, scrollTo, stories } = installDeckLayout();
    const controls = screen.getByRole("navigation", {
      name: "Scroll reader controls",
    });
    const previous = within(controls).getByRole("button", {
      name: "Previous story",
    });
    const next = within(controls).getByRole("button", { name: "Next story" });

    expect(screen.getByRole("status")).toHaveTextContent("Story 1 of 3");
    expect(
      screen.getByRole("progressbar", { name: "Reading progress" }),
    ).toHaveAttribute("aria-valuenow", "1");
    expect(stories[0]).toHaveAttribute("aria-current", "true");
    expect(stories[0]).toHaveAttribute("aria-posinset", "1");
    expect(stories[0]).toHaveAttribute("aria-setsize", "3");
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    fireEvent.click(next);

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 560, behavior: "smooth" });
    expect(screen.getByRole("status")).toHaveTextContent("Story 2 of 3");
    expect(stories[1]).toHaveAttribute("aria-current", "true");
    expect(previous).toBeEnabled();

    expect(fireEvent.keyDown(deck, { key: "PageDown" })).toBe(false);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1120, behavior: "smooth" });
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

  test("updates the active story after the native scroll position changes", () => {
    renderScrollView();
    const { deck, stories } = installDeckLayout();

    deck.scrollTop = 560;
    fireEvent.scroll(deck);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

    flushAnimationFrame();

    expect(screen.getByRole("status")).toHaveTextContent("Story 2 of 3");
    expect(
      screen.getByRole("progressbar", { name: "Reading progress" }),
    ).toHaveAttribute("aria-valuenow", "2");
    expect(stories[0]).not.toHaveAttribute("aria-current");
    expect(stories[1]).toHaveAttribute("aria-current", "true");
  });

  test("uses instant navigation when reduced motion is preferred", () => {
    useReducedMotion.mockReturnValue(true);
    renderScrollView();
    const { scrollTo } = installDeckLayout();

    fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 560, behavior: "auto" });
  });

  test("renders a useful empty reader state", () => {
    render(
      <TechByteScrollView
        articles={[]}
        formatPublishedAt={formatPublishedAt}
      />,
    );

    expect(
      screen.getByLabelText("Tech news scroll reader"),
    ).toHaveTextContent("No stories are available in the scroll reader yet.");
  });
});
