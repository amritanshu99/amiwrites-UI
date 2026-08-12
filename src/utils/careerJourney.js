const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const parseCareerMonth = (value) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");

  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (monthIndex < 0 || monthIndex > 11) return null;

  return { year, monthIndex };
};
const currentCareerMonth = (asOf = new Date()) => ({
  year: asOf.getFullYear(),
  monthIndex: asOf.getMonth(),
});

const formatMonthLabel = (value) => {
  const parsed = parseCareerMonth(value);

  return parsed ? `${MONTH_LABELS[parsed.monthIndex]} ${parsed.year}` : "";
};

export const countCareerMonths = (startDate, endDate, asOf = new Date()) => {
  const start = parseCareerMonth(startDate);
  const end = endDate ? parseCareerMonth(endDate) : currentCareerMonth(asOf);

  if (!start || !end) return 0;

  const difference =
    (end.year - start.year) * 12 + (end.monthIndex - start.monthIndex);

  return difference < 0 ? 0 : difference + 1;
};

export const formatCareerTenure = (
  startDate,
  endDate,
  asOf = new Date(),
) => {
  const totalMonths = countCareerMonths(startDate, endDate, asOf);

  if (!totalMonths) return "";

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];

  if (years) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (months) parts.push(`${months} ${months === 1 ? "mo" : "mos"}`);

  return parts.join(" ");
};

export const formatCareerDateRange = (startDate, endDate) => {
  const start = formatMonthLabel(startDate);
  const end = endDate ? formatMonthLabel(endDate) : "Present";

  return start && end ? `${start} – ${end}` : "";
};

export const getCompanyCareerSpan = (roles = []) => {
  const datedRoles = roles.filter((role) => parseCareerMonth(role.startDate));

  if (!datedRoles.length) return { startDate: "", endDate: "" };

  const startDate = datedRoles.reduce(
    (earliest, role) =>
      role.startDate < earliest ? role.startDate : earliest,
    datedRoles[0].startDate,
  );
  const hasPresentRole = datedRoles.some((role) => !role.endDate);
  const endDate = hasPresentRole
    ? null
    : datedRoles.reduce(
        (latest, role) => (role.endDate > latest ? role.endDate : latest),
        datedRoles[0].endDate,
      );

  return { startDate, endDate };
};
