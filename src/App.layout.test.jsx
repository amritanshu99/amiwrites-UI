import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock(
  "react-router-dom",
  () => ({
    Navigate: () => null,
    Route: () => null,
    Routes: () => null,
    useLocation: () => ({ pathname: "/amibot" }),
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
  }),
  { virtual: true },
);

jest.mock("axios", () => ({
  get: jest.fn(),
  isCancel: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  Slide: () => null,
  ToastContainer: () => null,
  toast: { error: jest.fn() },
}));

jest.mock("./analytics", () => ({
  getPublicPagePath: (path) => path,
  initGA: jest.fn(),
  logPageView: jest.fn(),
}));

jest.mock("./utils/seo", () => ({
  applySEO: jest.fn(),
  seoByRoute: {
    "/": {},
    "/amibot": {},
  },
}));

jest.mock("./utils/adminRoutePreload", () => ({
  addBlogRoute: {},
  amiBotAdminRoute: {},
  amiPulseSettingsRoute: {},
  createPreloadedRouteComponent: () => () => null,
}));

jest.mock("./components/Layout/Header", () => () => <header>Header</header>);
jest.mock("./components/Layout/Footer", () => () => <footer>Footer</footer>);
jest.mock("./components/Floating-buttons/ContactMeButton", () => () => null);
jest.mock("./components/Portfolio/InitialLoader", () => ({
  completeInitialLoaderCycle: jest.fn(),
}));
jest.mock("./pages/Portfolio", () => () => null);
jest.mock("./pages/AmiBotDetails", () => () => <div>AmiBot route</div>);

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = jest.fn();
  HTMLElement.prototype.scrollTo = jest.fn();
});

test("lets the AmiBot route reach the footer through the outer app scroller", () => {
  render(<App />);

  const appShell = document.querySelector(".amiverse-app-shell");
  expect(appShell).toHaveClass("h-screen", "overflow-y-scroll");
  expect(appShell).not.toHaveClass("overflow-hidden");

  expect(screen.getByRole("main")).toHaveClass(
    "h-[calc(100svh_-_4rem_-_env(safe-area-inset-top))]",
  );
  expect(screen.getByRole("contentinfo")).toHaveTextContent("Footer");
});
