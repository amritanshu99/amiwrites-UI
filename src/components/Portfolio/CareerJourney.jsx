import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt } from "react-icons/fa";
import {
  countCareerMonths,
  formatCareerDateRange,
  formatCareerTenure,
  getCompanyCareerSpan,
} from "../../utils/careerJourney";

const companyLogos = {
  "Hitachi Digital": { src: "/hitachi-digital-logo.png", width: 2837, height: 640 },
  "ConQsys IT (P) Ltd.": { src: "/ConQsysLogo-Red.png" },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const publicAsset = (path) => `${process.env.PUBLIC_URL || ""}${path}`;
const MAX_TIMER_DELAY_MS = 2_147_000_000;

const getDelayToNextMonth = (now) => {
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.min(
    Math.max(nextMonth.getTime() - now.getTime() + 1000, 1000),
    MAX_TIMER_DELAY_MS,
  );
};

const useCareerClock = () => {
  const [asOf, setAsOf] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const scheduleNextMonth = () => {
      timer = window.setTimeout(() => {
        setAsOf(new Date());
        scheduleNextMonth();
      }, getDelayToNextMonth(new Date()));
    };
    scheduleNextMonth();
    return () => window.clearTimeout(timer);
  }, []);

  return asOf;
};

const CompanyLogo = ({ company }) => {
  const logo = companyLogos[company];
  if (!logo) return null;

  return (
    <div className="flex h-14 w-36 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <img
        src={publicAsset(logo.src)}
        alt={`${company} logo`}
        width={logo.width}
        height={logo.height}
        decoding="async"
        loading="lazy"
        className="h-full w-full object-contain"
      />
    </div>
  );
};

export default function CareerJourney({ companies, reduceMotion = false }) {
  const asOf = useCareerClock();
  const companySpans = useMemo(
    () => companies.map((company) => getCompanyCareerSpan(company.roles)),
    [companies],
  );
  const allRoles = companies.flatMap((company) => company.roles);
  const careerSpan = getCompanyCareerSpan(allRoles);
  const careerYears = Math.floor(
    countCareerMonths(careerSpan.startDate, careerSpan.endDate, asOf) / 12,
  );
  const highlights = [
    {
      value: careerYears > 0 ? `${careerYears}+` : "<1",
      label: "Years of experience",
    },
    { value: companies.length, label: "Companies" },
    { value: allRoles.length, label: "Roles along the way" },
  ];

  return (
    <div className="mt-8 sm:mt-10">
      <dl className="mb-8 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200/80 bg-white/75 py-5 dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.035] sm:mb-10 sm:py-6">
        {highlights.map(({ value, label }) => (
          <div key={label} className="flex min-w-0 flex-col gap-1.5 px-3 sm:px-6">
            <dt className="order-2 text-[0.6875rem] font-medium leading-4 text-slate-500 dark:text-zinc-400 sm:text-xs sm:leading-5">{label}</dt>
            <dd className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-6">
        {companies.map((company, companyIndex) => {
          const companySpan = companySpans[companyIndex];
          const isCurrentCompany = company.roles.some((role) => !role.endDate);
          const companyDateRange = formatCareerDateRange(companySpan.startDate, companySpan.endDate);
          const companyTenure = formatCareerTenure(companySpan.startDate, companySpan.endDate, asOf);

          return (
            <motion.article
              key={company.company}
              variants={cardVariants}
              initial={reduceMotion ? false : "hidden"}
              whileInView={reduceMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.12 }}
              aria-labelledby={`career-company-${companyIndex}`}
              className={`relative min-w-0 overflow-hidden rounded-3xl border bg-white shadow-[0_16px_48px_-24px_rgba(15,23,42,0.2)] dark:bg-zinc-950 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] ${
                isCurrentCompany
                  ? "border-sky-200 dark:border-cyan-300/25"
                  : "border-slate-200 dark:border-white/10"
              }`}
            >
              <header className={`min-w-0 border-b p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8 ${
                isCurrentCompany
                  ? "border-sky-100 bg-gradient-to-br from-sky-50/90 via-slate-50 to-white dark:border-cyan-300/10 dark:from-cyan-300/[0.07] dark:via-zinc-950 dark:to-zinc-950"
                  : "border-slate-100 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.025]"
              }`}>
                <p className={`mb-5 flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] ${
                  isCurrentCompany ? "text-sky-700 dark:text-cyan-300" : "text-slate-500 dark:text-zinc-400"
                }`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isCurrentCompany ? "bg-sky-600 dark:bg-cyan-300" : "bg-slate-400 dark:bg-zinc-500"}`} aria-hidden="true" />
                  {isCurrentCompany ? "Current chapter" : "Earlier chapter"}
                </p>
                <CompanyLogo company={company.company} />
                <h3 id={`career-company-${companyIndex}`} className="mt-5 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  {company.company}
                </h3>
                {company.previousName && (
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">Previously {company.previousName}</p>
                )}
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-700 dark:text-zinc-200">{companyDateRange}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
                  <span>{companyTenure}</span>
                  {company.employmentType && <><span aria-hidden="true">·</span><span>{company.employmentType}</span></>}
                </p>
                {company.location && (
                  <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-zinc-400">
                    <FaMapMarkerAlt className="mt-1 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 break-words">{company.location}</span>
                  </p>
                )}
              </header>

              <div className="min-w-0 p-5 sm:p-7 lg:p-8">
                <p className="mb-5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400">Role progression</p>
                <ol aria-label={`${company.company} designation history`}>
                  {company.roles.map((role, roleIndex) => {
                    const isCurrent = !role.endDate;
                    const roleDateRange = formatCareerDateRange(role.startDate, role.endDate);
                    const roleTenure = formatCareerTenure(role.startDate, role.endDate, asOf);

                    return (
                      <li key={`${role.title}-${role.startDate}`} className="relative grid min-w-0 grid-cols-[0.75rem_minmax(0,1fr)] gap-3 pb-6 last:pb-0 sm:gap-4">
                        <div className="relative flex justify-center" aria-hidden="true">
                          <span className={`relative z-10 mt-5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white dark:ring-zinc-950 ${
                            isCurrent ? "bg-sky-600 dark:bg-cyan-300" : "bg-slate-300 dark:bg-zinc-600"
                          }`} />
                          {roleIndex < company.roles.length - 1 && (
                            <span className="absolute -bottom-12 top-6 w-px bg-slate-200 dark:bg-zinc-800" />
                          )}
                        </div>
                        <div className={`min-w-0 rounded-2xl border p-3 sm:p-4 ${
                          isCurrent
                            ? "border-sky-100 bg-sky-50/80 dark:border-cyan-300/15 dark:bg-cyan-300/[0.045]"
                            : "border-transparent"
                        }`}>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <h4 className="min-w-0 break-words text-base font-bold leading-6 text-slate-900 dark:text-zinc-100 sm:text-lg">{role.title}</h4>
                            {isCurrent && (
                              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/20">
                                <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />Current
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-col gap-1 text-xs leading-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:text-sm">
                            <p className="font-medium text-slate-500 dark:text-zinc-400">{roleDateRange}</p>
                            <p className="text-slate-500 dark:text-zinc-400">{roleTenure}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
