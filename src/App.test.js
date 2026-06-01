jest.mock("axios", () => ({
  get: jest.fn(),
  isCancel: jest.fn(),
}));

import { getHourInTimezone } from "./components/AmiversePulseWidget";

test("returns the owner hour in the configured timezone", () => {
  const hour = getHourInTimezone(
    "Asia/Kolkata",
    new Date("2026-06-01T00:00:00.000Z"),
  );

  expect(hour).toBe(5);
});
