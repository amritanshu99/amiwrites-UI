import {
  countCareerMonths,
  formatCareerDateRange,
  formatCareerTenure,
  getCompanyCareerSpan,
} from "./careerJourney";

describe("career journey date helpers", () => {
  const august2026 = new Date(2026, 7, 12);

  it("counts role tenure inclusively", () => {
    expect(countCareerMonths("2022-02", "2024-06", august2026)).toBe(29);
    expect(formatCareerTenure("2022-02", "2024-06", august2026)).toBe(
      "2 yrs 5 mos",
    );
  });

  it("uses the current month for a present role", () => {
    expect(formatCareerDateRange("2024-07", null)).toBe(
      "Jul 2024 – Present",
    );
    expect(formatCareerTenure("2024-07", null, august2026)).toBe(
      "2 yrs 2 mos",
    );
  });

  it("derives a company span from all of its designations", () => {
    expect(
      getCompanyCareerSpan([
        { startDate: "2024-07", endDate: null },
        { startDate: "2022-02", endDate: "2024-06" },
      ]),
    ).toEqual({ startDate: "2022-02", endDate: null });
  });
});
