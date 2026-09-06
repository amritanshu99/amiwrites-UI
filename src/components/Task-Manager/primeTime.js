// Birthday boundaries use India time so the window stays fixed across devices.
export const PRIME_TIME_START = "2026-09-09T00:00:00+05:30";
export const PRIME_TIME_END = "2041-09-09T00:00:00+05:30";
export const SLEEP_HOURS_PER_DAY = 7;
export const OTHER_HOURS_PER_DAY = 6;
export const PRIME_HOURS_PER_DAY = 24 - SLEEP_HOURS_PER_DAY - OTHER_HOURS_PER_DAY;

const DAY_MS = 24 * 60 * 60 * 1000;
const START_MS = Date.parse(PRIME_TIME_START);
const END_MS = Date.parse(PRIME_TIME_END);

export function calculatePrimeTime(now = Date.now()) {
  const nowMs = new Date(now).getTime();
  const totalDays = (END_MS - START_MS) / DAY_MS;
  const elapsedMs = Math.min(Math.max(nowMs - START_MS, 0), END_MS - START_MS);
  const elapsedDays = elapsedMs / DAY_MS;
  const remainingDays = totalDays - elapsedDays;
  const elapsedPercent = (elapsedDays / totalDays) * 100;

  return {
    phase: nowMs < START_MS ? "upcoming" : nowMs >= END_MS ? "complete" : "active",
    daysUntilStart: Math.max(0, Math.ceil((START_MS - nowMs) / DAY_MS)),
    totalDays,
    remainingDays,
    totalHours: totalDays * PRIME_HOURS_PER_DAY,
    elapsedHours: elapsedDays * PRIME_HOURS_PER_DAY,
    remainingHours: remainingDays * PRIME_HOURS_PER_DAY,
    elapsedPercent,
    remainingPercent: 100 - elapsedPercent,
  };
}
