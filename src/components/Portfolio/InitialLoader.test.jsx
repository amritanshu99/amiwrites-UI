import { render, screen } from "@testing-library/react";
import InitialLoader, {
  INITIAL_LOADER_CREDIT,
  INITIAL_LOADER_MIN_DURATION_MS,
} from "./InitialLoader";

const originalMatchMedia = window.matchMedia;
const originalDeviceMemory = Object.getOwnPropertyDescriptor(
  navigator,
  "deviceMemory",
);
const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(
  navigator,
  "hardwareConcurrency",
);
const originalConnection = Object.getOwnPropertyDescriptor(
  navigator,
  "connection",
);

const setNavigatorValue = (key, value) => {
  Object.defineProperty(navigator, key, {
    configurable: true,
    value,
  });
};

const restoreNavigatorValue = (key, descriptor) => {
  if (descriptor) {
    Object.defineProperty(navigator, key, descriptor);
  } else {
    delete navigator[key];
  }
};

const installMatchMedia = (matchesQuery = () => false) => {
  const queries = new Map();

  window.matchMedia = jest.fn((query) => {
    if (!queries.has(query)) {
      queries.set(query, {
        matches: matchesQuery(query),
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });
    }

    return queries.get(query);
  });

  return queries;
};

beforeEach(() => {
  setNavigatorValue("deviceMemory", 8);
  setNavigatorValue("hardwareConcurrency", 8);
  setNavigatorValue("connection", { saveData: false });
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  restoreNavigatorValue("deviceMemory", originalDeviceMemory);
  restoreNavigatorValue("hardwareConcurrency", originalHardwareConcurrency);
  restoreNavigatorValue("connection", originalConnection);
});

test("always shows the written and directed credit in showcase mode", () => {
  const firstVisit = render(<InitialLoader />);

  expect(
    screen.getByText(INITIAL_LOADER_CREDIT),
  ).toBeInTheDocument();

  firstVisit.unmount();
  render(<InitialLoader />);

  expect(
    screen.getByText(INITIAL_LOADER_CREDIT),
  ).toBeInTheDocument();
});

test("preserves the production loader state and accessible status contract", () => {
  installMatchMedia();

  const { rerender } = render(
    <InitialLoader
      durationMs={INITIAL_LOADER_MIN_DURATION_MS}
      phase="visible"
    />,
  );
  const status = screen.getByRole("status", { name: "Loading AmiVerse" });
  const root = status.parentElement;

  expect(root).toHaveAttribute("data-loader-timed", "true");
  expect(root).toHaveAttribute("data-loader-state", "visible");
  expect(root.style.getPropertyValue("--loader-progress-duration")).toBe(
    `${INITIAL_LOADER_MIN_DURATION_MS}ms`,
  );
  expect(root.querySelector(".loader-progress-fill")).toBeInTheDocument();
  expect(root.querySelector(".loader-progress-hold")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "AmiVerse" })).not.toBeInTheDocument();

  rerender(
    <InitialLoader
      durationMs={INITIAL_LOADER_MIN_DURATION_MS}
      phase="exiting"
    />,
  );

  expect(root).toHaveAttribute("data-loader-state", "exiting");
});

test("announces and labels the secure session variant", () => {
  installMatchMedia();
  render(<InitialLoader mode="session" />);

  expect(
    screen.getByRole("status", { name: "Verifying secure access" }),
  ).toBeInTheDocument();
  expect(screen.getAllByText("Secure Access").length).toBeGreaterThan(0);
  expect(screen.getByText("Private Session")).toBeInTheDocument();
});

test("keeps premium rendering enabled for compact touch viewports", () => {
  installMatchMedia((query) =>
    query.includes("max-width") || query.includes("pointer: coarse"),
  );
  const { container } = render(<InitialLoader />);
  const root = container.querySelector("[data-loader-root]");

  expect(root).toHaveAttribute("data-loader-compact", "true");
  expect(root).toHaveAttribute("data-loader-mode", "cinematic");
  expect(root.querySelector(".loader-emblem-shutter")).toBeInTheDocument();
});

test("honors reduced motion and removes media-query listeners", () => {
  const queries = installMatchMedia((query) =>
    query.includes("prefers-reduced-motion"),
  );
  const { container, unmount } = render(<InitialLoader />);
  const root = container.querySelector("[data-loader-root]");

  expect(root).toHaveAttribute("data-loader-mode", "optimized");
  expect(root.querySelector(".loader-emblem-shutter")).not.toBeInTheDocument();

  unmount();

  queries.forEach((query) => {
    expect(query.addEventListener).toHaveBeenCalledTimes(1);
    expect(query.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
