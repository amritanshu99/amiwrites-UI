import { toForm, validateForm } from "./PulseSettings";

jest.mock("axios", () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

jest.mock("react-router-dom", () => ({ Link: () => null }), { virtual: true });

const validForm = {
  widgetTitle: "Ami Pulse",
  ownerTimezone: "Asia/Kolkata",
  ownerLatitude: "",
  ownerLongitude: "",
  scheduleRules: [],
};

test("bounds and normalizes untrusted settings responses", () => {
  const form = toForm({
    isEnabled: "true",
    widgetTitle: `Pulse${"x".repeat(200)}`,
    ownerLatitude: "999",
    ownerTimezone: "Invalid/Timezone",
    scheduleRules: new Array(100).fill({
      startHour: 9,
      endHour: 17,
      status: `Working${"x".repeat(500)}`,
    }),
  });

  expect(form.isEnabled).toBe(false);
  expect(form.widgetTitle).toHaveLength(60);
  expect(form.ownerLatitude).toBe("");
  expect(form.ownerTimezone).toBe("Asia/Kolkata");
  expect(form.scheduleRules).toHaveLength(24);
  expect(form.scheduleRules[0].status).toHaveLength(180);
});

test("rejects blank and overlapping schedule hours", () => {
  expect(
    validateForm({
      ...validForm,
      scheduleRules: [{ startHour: "", endHour: 4 }],
    }),
  ).toMatch(/required/i);

  expect(
    validateForm({
      ...validForm,
      scheduleRules: [
        { startHour: 9, endHour: 17 },
        { startHour: 16, endHour: 20 },
      ],
    }),
  ).toMatch(/overlap/i);

  expect(
    validateForm({
      ...validForm,
      scheduleRules: [
        { startHour: 9, endHour: 17 },
        { startHour: 17, endHour: 22 },
      ],
    }),
  ).toBe("");
});
