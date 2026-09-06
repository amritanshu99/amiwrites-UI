import { calculatePrimeTime, PRIME_TIME_END, PRIME_TIME_START } from "./primeTime";

test("counts the full age 30–45 allowance including all four leap days", () => {
  expect(calculatePrimeTime(PRIME_TIME_START)).toEqual(expect.objectContaining({
    phase: "active",
    totalDays: 5479,
    totalHours: 60269,
    remainingHours: 60269,
    elapsedHours: 0,
    remainingPercent: 100,
    elapsedPercent: 0,
  }));
});

test("does not consume prime time before the 30th birthday", () => {
  expect(calculatePrimeTime("2026-09-07T00:00:00+05:30")).toEqual(expect.objectContaining({
    phase: "upcoming",
    daysUntilStart: 2,
    remainingHours: 60269,
    elapsedHours: 0,
    remainingPercent: 100,
  }));
});

test("deducts 11 hours per day and prorates partial days", () => {
  const time = calculatePrimeTime("2026-09-10T12:00:00+05:30");
  expect(time.elapsedHours).toBe(16.5);
  expect(time.remainingHours).toBe(60252.5);
  expect(time.remainingDays).toBe(5477.5);
  expect(time.elapsedPercent).toBeCloseTo(16.5 / 60269 * 100, 8);
  expect(time.elapsedPercent + time.remainingPercent).toBe(100);
});

test("shows 50 percent and half the available hours at the midpoint", () => {
  const midpoint = (Date.parse(PRIME_TIME_START) + Date.parse(PRIME_TIME_END)) / 2;
  expect(calculatePrimeTime(midpoint)).toEqual(expect.objectContaining({
    phase: "active",
    elapsedHours: 30134.5,
    remainingHours: 30134.5,
    elapsedPercent: 50,
    remainingPercent: 50,
  }));
});

test.each([PRIME_TIME_END, "2050-01-01T00:00:00Z"])("clamps at age 45 and beyond (%s)", (now) => {
  expect(calculatePrimeTime(now)).toEqual(expect.objectContaining({
    phase: "complete",
    remainingDays: 0,
    remainingHours: 0,
    elapsedHours: 60269,
    elapsedPercent: 100,
    remainingPercent: 0,
  }));
});

test("uses midnight IST even when timestamps come from a different timezone", () => {
  expect(calculatePrimeTime("2026-09-08T18:29:59Z").phase).toBe("upcoming");
  expect(calculatePrimeTime("2026-09-08T18:30:00Z")).toEqual(calculatePrimeTime(PRIME_TIME_START));
  const beforeLeapDay = calculatePrimeTime("2028-02-28T00:00:00+05:30");
  const afterLeapDay = calculatePrimeTime("2028-03-01T00:00:00+05:30");
  expect(afterLeapDay.elapsedHours - beforeLeapDay.elapsedHours).toBe(22);
});
