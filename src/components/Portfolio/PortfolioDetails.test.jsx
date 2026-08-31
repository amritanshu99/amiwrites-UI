import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import axios from "axios";
import { completeInitialLoaderCycle } from "./InitialLoader";
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

jest.mock("../AmiversePulseWidget", () => () => (
  <button type="button" aria-label="Open Ami Pulse" />
));
jest.mock("./MemoryLaneCta", () => () => null);

const renderPortfolio = () => render(<PortfolioDetails />);
const originalImageDecode = HTMLImageElement.prototype.decode;

const markInitialHeroReady = () => {
  const portrait = document.querySelector('img[alt$="portfolio portrait"]');
  expect(portrait).not.toBeNull();
  fireEvent.load(portrait);
};

const finishInitialLoader = async () => {
  markInitialHeroReady();

  await act(async () => {
    jest.advanceTimersByTime(1200);
    await Promise.resolve();
  });

  await act(async () => {
    jest.advanceTimersByTime(50);
    await Promise.resolve();
  });

  await act(async () => {
    jest.advanceTimersByTime(250);
    await Promise.resolve();
  });
};

describe("PortfolioDetails startup experience", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    completeInitialLoaderCycle();
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
    if (originalImageDecode) {
      Object.defineProperty(HTMLImageElement.prototype, "decode", {
        configurable: true,
        value: originalImageDecode,
      });
    } else {
      delete HTMLImageElement.prototype.decode;
    }
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("defers floating interactive chrome until the loader has fully cleared", async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    renderPortfolio();

    expect(
      screen.queryByRole("button", { name: "Open Ami Pulse" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /expand section switcher/i }),
    ).not.toBeInTheDocument();

    await finishInitialLoader();

    expect(
      screen.getByRole("button", { name: "Open Ami Pulse" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand section switcher/i }),
    ).toBeInTheDocument();
  });

  it("keeps the page inert until the rendered hero has decoded", async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    let resolveDecode;
    const decode = jest.fn(
      () => new Promise((resolve) => {
        resolveDecode = resolve;
      }),
    );
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: decode,
    });

    const { container } = renderPortfolio();
    const page = container.querySelector("article");
    const portrait = container.querySelector('img[alt$="portfolio portrait"]');

    expect(page).toHaveAttribute("inert");
    fireEvent.load(portrait);

    await act(async () => {
      jest.advanceTimersByTime(1200);
      await Promise.resolve();
    });

    expect(
      screen.getByRole("status", { name: /loading amiverse/i }),
    ).toBeInTheDocument();

    await act(async () => {
      resolveDecode();
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(20);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(20);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(
      screen.queryByRole("status", { name: /loading amiverse/i }),
    ).not.toBeInTheDocument();
    expect(page).not.toHaveAttribute("inert");
  });

  it("does not reveal an image whose decode rejects", async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: jest.fn(() => Promise.reject(new Error("Decode failed"))),
    });

    renderPortfolio();
    markInitialHeroReady();

    await act(async () => {
      jest.advanceTimersByTime(1200);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByRole("status", { name: /loading amiverse/i }),
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(
      screen.queryByRole("status", { name: /loading amiverse/i }),
    ).not.toBeInTheDocument();
  });

  it("starts a fresh minimum wait when the portfolio mounts again", async () => {
    axios.get.mockImplementation(() => new Promise(() => {}));

    const firstVisit = renderPortfolio();
    await finishInitialLoader();
    firstVisit.unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    renderPortfolio();
    markInitialHeroReady();

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

    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
    });

    expect(
      screen.queryByRole("status", { name: /loading amiverse/i }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["still pending", () => new Promise(() => {})],
    ["failed", () => Promise.reject(new Error("Portfolio API unavailable"))],
  ])(
    "keeps one overlay through the minimum duration and reveals ready fallback content when the API is %s",
    async (_apiState, createRequest) => {
      axios.get.mockImplementationOnce(createRequest);

      renderPortfolio();

      expect(
        screen.getByRole("status", { name: /loading amiverse/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Amritanshu Mishra", level: 1 }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: "Amritanshu Mishra",
          level: 1,
          hidden: true,
        }),
      ).toBeInTheDocument();

      markInitialHeroReady();

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

      await act(async () => {
        jest.advanceTimersByTime(50);
        await Promise.resolve();
      });

      await act(async () => {
        jest.advanceTimersByTime(250);
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

  it("uses a bounded wait when the hero asset never settles", async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    renderPortfolio();

    act(() => {
      jest.advanceTimersByTime(3199);
    });

    expect(
      screen.getByRole("status", { name: /loading amiverse/i }),
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
    });

    expect(
      screen.queryByRole("status", { name: /loading amiverse/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Amritanshu Mishra", level: 1 }),
    ).toBeInTheDocument();
  });

  it.each([
    ["light", "", "your-photo-optimized.jpg", "ny-bg-optimized.jpg"],
    ["dark", "dark", "your-photo-dark-optimized.jpg", "ny-dark-optimized.jpg"],
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

      expect(portrait).toHaveAttribute("src", `/images/${portraitAsset}`);
      expect(backgroundLayer).toBeDefined();
    },
  );

  it("keeps the responsive hero kicker and primary actions available on phones", async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    renderPortfolio();
    await finishInitialLoader();

    const pixelEffect = screen.getByTestId("hero-pixel-distortion");

    expect(
      screen.getByText("Engineering the Future, Today"),
    ).toHaveClass("block", "font-cinzel", "text-[0.62rem]", "sm:text-xs");
    expect(
      screen.getByText("Engineering the Future, Today"),
    ).not.toHaveClass("bg-white/60", "rounded-full", "border");
    expect(
      screen.getByText("Engineering the Future, Today"),
    ).not.toHaveClass("max-sm:hidden");
    expect(
      screen.getByText(/combined to solve real product problems/i),
    ).toHaveClass("max-sm:hidden");
    expect(
      screen.getByRole("heading", { name: "Amritanshu Mishra", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Full-stack & AI Engineer", { selector: "p" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /career journey/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view r.sum./i }),
    ).toBeInTheDocument();
    expect(pixelEffect).toHaveAttribute("aria-hidden", "true");
    expect(pixelEffect).toHaveAttribute("data-ready", "false");
    expect(pixelEffect).toHaveClass("pointer-events-none");
  });

  it("opens the career journey at the experience section", async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    const scrollToSpy = jest
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});

    renderPortfolio();
    await finishInitialLoader();

    fireEvent.click(
      screen.getByRole("button", { name: /career journey/i }),
    );

    expect(
      screen.getByRole("button", {
        name: /current section is experience/i,
      }),
    ).toBeInTheDocument();

    scrollToSpy.mockRestore();
  });

  it("shows a company-level career timeline with automatic current tenure", async () => {
    jest.setSystemTime(new Date(2026, 7, 31, 23, 59, 58));
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    renderPortfolio();
    await finishInitialLoader();

    expect(
      screen.getByRole("heading", { name: "GlobalLogic", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "GlobalLogic logo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "ConQsys IT (P) Ltd.",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "ConQsys IT (P) Ltd. logo" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Noida, Uttar Pradesh, India")).toHaveLength(2);
    expect(screen.getByText("Jul 2024 – Present")).toBeInTheDocument();
    expect(screen.getByText("2 yrs 2 mos")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Software Engineering Trainee",
        level: 4,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Building scalable product experiences/i),
    ).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(screen.getByText("2 yrs 3 mos")).toBeInTheDocument();
  });

  it("keeps Ami Pulse available on compact viewports", async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    window.matchMedia.mockImplementation((query) => ({
      matches:
        query.includes("max-width: 1023px") ||
        query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    renderPortfolio();
    await finishInitialLoader();

    expect(
      screen.getByRole("button", { name: "Open Ami Pulse" }),
    ).toBeInTheDocument();
  });

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
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute(
      "href",
      "mailto:amritanshu99@gmail.com",
    );
    expect(
      screen.getByRole("link", { name: /amiverse\.in/i }),
    ).toHaveAttribute("href", "https://www.amiverse.in");
  });
});
