import { parseTaskDate, toDateInputValue } from "./taskManagerConfig";

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
