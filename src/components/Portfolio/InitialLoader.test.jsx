import { Profiler } from "react";
import { act, render, screen } from "@testing-library/react";
import { waitingLines } from "../Loader/waitingLines";
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
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete document.documentElement.dataset.loaderQuip;
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

test("renders the galaxy scene with the production state and accessible status contract", () => {
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
  expect(root).toHaveAttribute("data-loader-design", "galaxy");
  expect(root).toHaveAttribute("data-loader-profile", "lightweight");
  expect(root).toHaveAttribute("data-loader-state", "visible");
  expect(root.style.getPropertyValue("--loader-progress-duration")).toBe(
    `${INITIAL_LOADER_MIN_DURATION_MS}ms`,
  );
  expect(root.querySelector(".galaxy-progress-fill")).toBeInTheDocument();
  expect(root.querySelector(".galaxy-scenery")).toHaveAttribute("aria-hidden", "true");
  expect(root.querySelector(".galaxy-nebula")).toBeInTheDocument();
  expect(root.querySelector(".galaxy-wordmark")).toHaveTextContent("AmiVerse");
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status).toHaveAttribute("aria-atomic", "true");
  expect(root.querySelector("style")).not.toBeInTheDocument();
  expect(root.querySelector(".loader-shell")).not.toBeInTheDocument();
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
  const { container } = render(<InitialLoader mode="session" />);

  expect(
    screen.getByRole("status", { name: "Verifying secure access" }),
  ).toBeInTheDocument();
  expect(screen.getAllByText("Secure Access").length).toBeGreaterThan(0);
  expect(screen.getByText("Private Session")).toBeInTheDocument();
  expect(container.querySelector(".galaxy-progress-travel")).toBeInTheDocument();
  expect(container.querySelector("[data-loader-root]")).not.toHaveAttribute("data-loader-timed");
  expect(screen.queryByText(INITIAL_LOADER_CREDIT)).not.toBeInTheDocument();
});

test("keeps premium rendering enabled for compact touch viewports", () => {
  installMatchMedia((query) =>
    query.includes("max-width") || query.includes("pointer: coarse"),
  );
  const { container } = render(<InitialLoader />);
  const root = container.querySelector("[data-loader-root]");

  expect(root).toHaveAttribute("data-loader-compact", "true");
  expect(root).toHaveAttribute("data-loader-mode", "cinematic");
  expect(root.querySelector(".galaxy-nebula")).toBeInTheDocument();
  expect(root.querySelector(".galaxy-wordmark")).toHaveTextContent("AmiVerse");
});

test("uses the lightweight timed profile on compact touch viewports", () => {
  installMatchMedia((query) =>
    query.includes("max-width") || query.includes("pointer: coarse"),
  );
  const { container } = render(
    <InitialLoader durationMs={INITIAL_LOADER_MIN_DURATION_MS} />,
  );
  const root = container.querySelector("[data-loader-root]");

  expect(root).toHaveAttribute("data-loader-compact", "true");
  expect(root).toHaveAttribute("data-loader-profile", "lightweight");
  expect(root.querySelector(".galaxy-progress-fill")).toBeInTheDocument();
  expect(root.querySelector(".galaxy-nebula")).toBeInTheDocument();
});

test("does not subscribe the short-lived production loader to media changes", () => {
  const queries = installMatchMedia();

  const { unmount } = render(
    <InitialLoader durationMs={INITIAL_LOADER_MIN_DURATION_MS} />,
  );

  queries.forEach((query) => {
    expect(query.addEventListener).not.toHaveBeenCalled();
    expect(query.addListener).not.toHaveBeenCalled();
  });

  unmount();

  queries.forEach((query) => {
    expect(query.removeEventListener).not.toHaveBeenCalled();
    expect(query.removeListener).not.toHaveBeenCalled();
  });
});

test("honors reduced motion and removes media-query listeners", () => {
  const queries = installMatchMedia((query) =>
    query.includes("prefers-reduced-motion"),
  );
  const { container, unmount } = render(<InitialLoader />);
  const root = container.querySelector("[data-loader-root]");

  expect(root).toHaveAttribute("data-loader-mode", "optimized");
  expect(root.querySelector(".galaxy-wordmark")).toHaveTextContent("AmiVerse");

  unmount();

  queries.forEach((query) => {
    expect(query.addEventListener).toHaveBeenCalledTimes(1);
    expect(query.removeEventListener).toHaveBeenCalledTimes(1);
    expect(query.removeEventListener).toHaveBeenCalledWith(
      "change",
      query.addEventListener.mock.calls[0][1],
    );
  });
});

test("uses static completed progress when reduced motion is requested", () => {
  installMatchMedia((query) => query.includes("prefers-reduced-motion"));
  const { container } = render(
    <InitialLoader durationMs={INITIAL_LOADER_MIN_DURATION_MS} />,
  );

  expect(container.querySelector("[data-loader-root]")).toHaveAttribute("data-loader-mode", "optimized");
  expect(container.querySelector(".galaxy-progress-complete")).toBeInTheDocument();
  expect(container.querySelector(".galaxy-progress-fill")).not.toBeInTheDocument();
});

test.each([
  ["limited memory", "deviceMemory", 4],
  ["limited processors", "hardwareConcurrency", 4],
  ["data saving", "connection", { saveData: true }],
])("uses the optimized galaxy profile for %s", (_, key, value) => {
  installMatchMedia();
  setNavigatorValue(key, value);
  const { container } = render(<InitialLoader />);

  expect(container.querySelector("[data-loader-root]")).toHaveAttribute("data-loader-mode", "optimized");
  expect(container.querySelector(".galaxy-wordmark")).toHaveTextContent("AmiVerse");
  expect(screen.getByRole("status", { name: "Loading AmiVerse" })).toBeInTheDocument();
});

test("preserves the minimum duration for a shorter requested progress animation", () => {
  installMatchMedia();
  const { container } = render(<InitialLoader durationMs={100} />);

  expect(container.querySelector("[data-loader-root]").style.getPropertyValue("--loader-progress-duration")).toBe(
    `${INITIAL_LOADER_MIN_DURATION_MS}ms`,
  );
});

test.each([
  ["timed showcase", { durationMs: INITIAL_LOADER_MIN_DURATION_MS }],
  ["secure session", { mode: "session" }],
])("does not poll or schedule React updates during the %s animation", (_, props) => {
  jest.useFakeTimers();
  installMatchMedia();
  const setInterval = jest.spyOn(window, "setInterval");
  const onRender = jest.fn();
  const { unmount } = render(
    <Profiler id="loader" onRender={onRender}>
      <InitialLoader {...props} />
    </Profiler>,
  );
  onRender.mockClear();

  act(() => jest.advanceTimersByTime(5000));

  expect(onRender).not.toHaveBeenCalled();
  expect(setInterval).not.toHaveBeenCalled();
  unmount();
});

test("shows the shared waiting line alongside the showcase credit", () => {
  document.documentElement.dataset.loaderQuip = waitingLines[0];
  render(<InitialLoader durationMs={INITIAL_LOADER_MIN_DURATION_MS} />);
  expect(screen.getByText(waitingLines[0])).toBeInTheDocument();
  expect(screen.getByText(INITIAL_LOADER_CREDIT)).toBeInTheDocument();
});
