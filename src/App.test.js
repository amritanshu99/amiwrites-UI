import { render, screen } from "@testing-library/react";
import AppLoadingFallback from "./components/Loader/AppLoadingFallback";
import { getHourInTimezone } from "./components/AmiversePulseWidget";

jest.mock("axios", () => ({
  get: jest.fn(),
  isCancel: jest.fn(),
}));

test("returns the owner hour in the configured timezone", () => {
  const hour = getHourInTimezone(
    "Asia/Kolkata",
    new Date("2026-06-01T00:00:00.000Z"),
  );

  expect(hour).toBe(5);
});

test.each([
  ["/add-blog", "Loading Create Blog"],
  ["/ami-pulse-settings", "Loading Ami Pulse settings"],
  ["/amibot-admin", "Loading AmiBot settings"],
])("uses the standard loader for the %s route", (pathname, label) => {
  render(<AppLoadingFallback pathname={pathname} />);

  expect(screen.getByRole("status", { name: label })).toBeInTheDocument();
  expect(screen.queryByText("Feature Presentation")).not.toBeInTheDocument();
});

test("never uses the cinematic loader as an app-level fallback", () => {
  render(<AppLoadingFallback pathname="/" />);

  expect(
    screen.getByRole("status", { name: "Loading page" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Feature Presentation")).not.toBeInTheDocument();
});
