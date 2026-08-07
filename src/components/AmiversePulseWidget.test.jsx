import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import AmiversePulseWidget, {
  getPulseState,
  normalizePublicConfig,
  normalizeWeather,
} from "./AmiversePulseWidget";

jest.mock("axios", () => ({
  get: jest.fn(),
  isCancel: jest.fn(() => false),
}));

const publicConfig = {
  isEnabled: true,
  widgetTitle: "Ami Pulse",
  mode: "manual",
  manualStatus: "Designing a safer, clearer experience",
  manualMood: "Intentional",
  manualVibe: "Creative focus",
  manualSuggestion: "Polish the details, then ship with confidence.",
  ownerTimezone: "Asia/Kolkata",
  locationLabel: "Greater Noida, India",
  updatedAt: "2026-08-01T18:30:00.000Z",
};

beforeEach(() => {
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/pulse/weather")) {
      return Promise.resolve({
        data: {
          success: true,
          data: { temp: 29.4, condition: "Partly cloudy" },
        },
      });
    }

    return Promise.resolve({
      data: { success: true, data: publicConfig },
    });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("shows the complete pulse content after expanding", async () => {
  render(<AmiversePulseWidget />);

  const trigger = await screen.findByRole("button", { name: "Open Ami Pulse" });
  fireEvent.click(trigger);

  const panel = screen.getByRole("region", { name: "Ami Pulse" });
  const pulseAside = screen.getByRole("complementary", { name: "Ami Pulse" });
  expect(pulseAside).toHaveClass("fixed");
  expect(pulseAside).not.toHaveClass("absolute");
  expect(panel).toHaveClass("bg-white/[0.92]");
  expect(panel).toHaveClass("dark:bg-zinc-950/[0.92]");
  expect(
    within(panel).getAllByText("Designing a safer, clearer experience"),
  ).toHaveLength(2);
  expect(within(panel).getByText("Intentional")).toBeInTheDocument();
  expect(within(panel).getByText("Creative focus")).toBeInTheDocument();
  expect(within(panel).getByText("Greater Noida, India")).toBeInTheDocument();
  expect(within(panel).getByText("Polish the details, then ship with confidence.")).toBeInTheDocument();

  await waitFor(() => {
    expect(within(panel).getByText("29.4°C · Partly cloudy")).toBeInTheDocument();
  });

  const closeButton = within(panel).getByRole("button", { name: "Close Ami Pulse" });
  expect(closeButton).toHaveFocus();
  fireEvent.click(closeButton);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Open Ami Pulse" })).toHaveFocus();
  });
});

test("normalizes untrusted public API values before rendering", () => {
  const oversized = `ok\u0000${"x".repeat(500)}`;
  const config = normalizePublicConfig({
    ...publicConfig,
    widgetTitle: oversized,
    ownerTimezone: "Not/A-Timezone",
    scheduleRules: new Array(40).fill({
      startHour: 9,
      endHour: 17,
      status: { unsafe: true },
      mood: "Focused",
      vibe: "Calm",
      suggestion: "Keep going",
    }),
  });

  expect(config.widgetTitle).not.toContain("\u0000");
  expect(config.widgetTitle).toHaveLength(60);
  expect(config.ownerTimezone).toBe("Asia/Kolkata");
  expect(config.scheduleRules).toHaveLength(24);
  expect(config.scheduleRules[0].status).toBe("Building Amiverse");
  expect(normalizePublicConfig("invalid")).toBeNull();
  expect(normalizeWeather({ temp: {}, condition: { unsafe: true } })).toEqual({
    temp: null,
    condition: "",
  });
});

test("prefers a server-computed current state so schedules can stay private", () => {
  const currentState = {
    status: "Server-computed mode",
    mood: "Calm",
    vibe: "Private schedule",
    suggestion: "Only publish the active signal.",
  };

  expect(getPulseState({ currentState, scheduleRules: [] })).toEqual(currentState);
});
