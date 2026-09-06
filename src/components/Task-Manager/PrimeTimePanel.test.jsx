import React from "react";
import { act, render, screen } from "@testing-library/react";
import PrimeTimePanel from "./PrimeTimePanel";

beforeEach(() => jest.useFakeTimers("modern"));
afterEach(() => jest.useRealTimers());

test("starts the countdown at the birthday and updates while the page stays open", () => {
  jest.setSystemTime(new Date("2026-09-08T23:59:00+05:30"));
  render(<PrimeTimePanel />);
  expect(screen.getByText("Starts in 1 day on your 30th birthday.")).toBeInTheDocument();
  expect(screen.getByRole("progressbar", { name: "Prime time remaining" })).toHaveAttribute("aria-valuenow", "100");

  act(() => jest.advanceTimersByTime(60_000));
  expect(screen.getByText("Your age 30–45 window is in progress.")).toBeInTheDocument();

  act(() => jest.advanceTimersByTime(24 * 60 * 60 * 1000));
  expect(screen.getByText("60,258")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "99.98");
});

test("refreshes after returning to the tab and cleans up its timer", () => {
  jest.setSystemTime(new Date("2030-01-01T00:00:00+05:30"));
  const { unmount } = render(<PrimeTimePanel />);
  act(() => {
    jest.setSystemTime(new Date("2041-09-09T00:00:00+05:30"));
    window.dispatchEvent(new Event("focus"));
  });
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  expect(screen.getByText("Your age 30–45 window is complete.")).toBeInTheDocument();
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});
