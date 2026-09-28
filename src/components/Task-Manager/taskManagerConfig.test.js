import { matchesPlanningDate, normalizeTask, parseTaskDate, planningDate, toDateInputValue } from "./taskManagerConfig";

test("keeps date-only deadlines on the selected local calendar day", () => {
  const parsed = parseTaskDate("2026-08-28");

  expect(parsed.getFullYear()).toBe(2026);
  expect(parsed.getMonth()).toBe(7);
  expect(parsed.getDate()).toBe(28);
  expect(toDateInputValue("2026-08-28T00:00:00.000Z")).toBe("2026-08-28");
});

test("rejects invalid task dates", () => {
  expect(parseTaskDate("not-a-date")).toBeNull();
  expect(parseTaskDate("2026-02-31")).toBeNull();
  expect(toDateInputValue(null)).toBe("");
});

test("daily filters use local calendar days across month and year boundaries", () => {
  expect(planningDate(1, new Date(2026, 11, 31, 23, 30))).toBe("2027-01-01");
  expect(matchesPlanningDate({ plannedDate: "2027-01-01" }, "tomorrow", "2026-12-31")).toBe(true);
  expect(matchesPlanningDate({ plannedDate: "2026-12-31" }, "today", "2026-12-31")).toBe(true);
  expect(matchesPlanningDate({ plannedDate: "2026-12-30", status: "todo" }, "overdue", "2026-12-31")).toBe(true);
  expect(matchesPlanningDate({ plannedDate: "2026-12-30", status: "done" }, "overdue", "2026-12-31")).toBe(false);
  expect(matchesPlanningDate({ plannedDate: "2026-12-31" }, "tomorrow", "2026-12-31")).toBe(false);
  expect(normalizeTask({ title: "Legacy" }).boardType).toBe("goals");
});
