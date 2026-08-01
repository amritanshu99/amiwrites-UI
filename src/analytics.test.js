import ReactGA from "react-ga4";
import { getPublicPagePath, initGA, logPageView } from "./analytics";

jest.mock("react-ga4", () => ({
  initialize: jest.fn(),
  send: jest.fn(),
}));

test("never initializes analytics with a reset token in the page URL", () => {
  window.history.replaceState({}, "", "/reset-password/top-secret-token?source=email");

  expect(initGA()).toBe(false);
  logPageView(window.location.pathname + window.location.search);

  expect(ReactGA.initialize).not.toHaveBeenCalled();
  expect(ReactGA.send).not.toHaveBeenCalled();
  expect(getPublicPagePath(window.location.pathname + window.location.search)).toBe(
    "/reset-password",
  );
});

test("keeps analytics disabled after the reset URL has been scrubbed", () => {
  window.history.replaceState({}, "", "/reset-password");

  expect(initGA()).toBe(false);
  expect(ReactGA.initialize).not.toHaveBeenCalled();
});

test("disables automatic page views and sends only a redacted location", () => {
  window.history.replaceState({}, "", "/");

  expect(initGA()).toBe(true);
  expect(ReactGA.initialize).toHaveBeenCalledWith("G-EQKP239D8Q", {
    gtagOptions: { send_page_view: false },
  });

  logPageView("/reset-password/top-secret-token?source=email");

  expect(ReactGA.send).toHaveBeenCalledWith({
    hitType: "pageview",
    page: "/reset-password",
    page_location: `${window.location.origin}/reset-password`,
  });
  expect(JSON.stringify(ReactGA.send.mock.calls)).not.toContain("top-secret-token");
});
