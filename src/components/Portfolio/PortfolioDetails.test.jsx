import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import axios from "axios";
import PortfolioDetails from "./PortfolioDetails";

jest.mock("axios", () => ({
  get: jest.fn(),
  isCancel: jest.fn(),
}));

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true },
);

jest.mock("framer-motion", () => {
  const React = jest.requireActual("react");

  const createMotionComponent = (tagName) =>
    React.forwardRef(
      (
        {
          animate,
          exit,
          initial,
          layout,
          onHoverEnd,
          onHoverStart,
          onTap,
          transition,
          variants,
          viewport,
          whileHover,
          whileInView,
          whileTap,
          ...props
        },
        ref,
      ) => React.createElement(tagName, { ...props, ref }),
    );

  return {
    AnimatePresence: ({ children }) => children,
    motion: {
      article: createMotionComponent("article"),
      button: createMotionComponent("button"),
      div: createMotionComponent("div"),
      h1: createMotionComponent("h1"),
      img: createMotionComponent("img"),
      p: createMotionComponent("p"),
    },
    useReducedMotion: () => true,
  };
});

jest.mock("../AmiversePulseWidget", () => () => null);
jest.mock("./MemoryLaneCta", () => () => null);

const renderPortfolio = () =>
  render(<PortfolioDetails />);

const finishInitialLoader = async () => {
  await act(async () => {
    jest.advanceTimersByTime(1200);
    await Promise.resolve();
  });
};

describe("PortfolioDetails startup experience", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    axios.get.mockReset();
    axios.isCancel.mockReset();
    axios.isCancel.mockReturnValue(false);
    document.documentElement.className = "";

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    document.documentElement.className = "";
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it.each([
    ["still pending", () => new Promise(() => {})],
    ["failed", () => Promise.reject(new Error("Portfolio API unavailable"))],
  ])(
    "keeps the showcase loader for 1200ms and then renders fallback content when the API is %s",
    async (_apiState, createRequest) => {
      axios.get.mockImplementationOnce(createRequest);

      renderPortfolio();

      expect(
        screen.getByRole("status", { name: /loading amiverse/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Amritanshu Mishra", level: 1 }),
      ).not.toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1199);
      });

      expect(
        screen.getByRole("status", { name: /loading amiverse/i }),
      ).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(1);
        await Promise.resolve();
      });

      expect(
        screen.queryByRole("status", { name: /loading amiverse/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Amritanshu Mishra", level: 1 }),
      ).toBeInTheDocument();
    },
  );

  it.each([
    ["light", "", "your-photo.png", "ny-bg-optimized.jpg"],
    ["dark", "dark", "your-photo-dark.png", "ny-dark-optimized.jpg"],
  ])(
    "uses the %s-mode portrait and New York background",
    async (_theme, rootClassName, portraitAsset, backgroundAsset) => {
      document.documentElement.className = rootClassName;
      axios.get.mockImplementationOnce(() => new Promise(() => {}));

      const { container } = renderPortfolio();
      await finishInitialLoader();

      const portrait = screen.getByRole("img", {
        name: /portfolio portrait/i,
      });
      const backgroundLayer = Array.from(
        container.querySelectorAll("div[style]"),
      ).find((element) =>
        element.style.backgroundImage.includes(backgroundAsset),
      );

      expect(portrait.getAttribute("src")).toContain(portraitAsset);
      expect(backgroundLayer).toBeDefined();
    },
  );

  it("restores the responsive AmiVerse contact calling card", async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = renderPortfolio();
    await finishInitialLoader();

    const contactBanner = Array.from(container.querySelectorAll("img")).find(
      (image) => image.getAttribute("src")?.includes("banner-optimized.jpg"),
    );

    expect(
      screen.getByRole("heading", {
        name: "Let's build something useful.",
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(contactBanner).toHaveAttribute("width", "1584");
    expect(contactBanner).toHaveAttribute("height", "396");
    expect(
      screen.getByRole("link", { name: /amiverse\.in/i }),
    ).toHaveAttribute("href", "https://www.amiverse.in");
  });
});
