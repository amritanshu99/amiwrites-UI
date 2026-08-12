import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt } from "react-icons/fa";
import {
  formatCareerDateRange,
  formatCareerTenure,
  getCompanyCareerSpan,
} from "../../utils/careerJourney";

const companyLogos = {
  GlobalLogic: {
    src: "/GL.png",
    frameClassName: "h-14 w-14 sm:h-16 sm:w-16",
  },
  "ConQsys IT (P) Ltd.": {
    src: "/ConQsysLogo-Red.png",
    frameClassName: "h-14 w-24 sm:h-16 sm:w-28",
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.56,
      ease: [0.22, 1, 0.36, 1],
    },
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
      const now = new Date();
      timer = window.setTimeout(() => {
        setAsOf(new Date());
        scheduleNextMonth();
      }, getDelayToNextMonth(now));
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
    <div
      className={`${logo.frameClassName} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-[0_10px_28px_rgba(15,23,42,0.1)] ring-1 ring-white dark:border-white/10 dark:bg-white/[0.96] dark:ring-white/10`}
    >
      <img
        src={publicAsset(logo.src)}
        alt={`${company} logo`}
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

  return (
    <div className="mt-9 space-y-5 sm:space-y-6">
      {companies.map((company, companyIndex) => {
        const companySpan = companySpans[companyIndex];
        const companyDateRange = formatCareerDateRange(
          companySpan.startDate,
          companySpan.endDate,
        );
        const companyTenure = formatCareerTenure(
          companySpan.startDate,
          companySpan.endDate,
          asOf,
        );

        return (
          <motion.article
            key={company.company}
            variants={cardVariants}
            initial={reduceMotion ? false : "hidden"}
            whileInView={reduceMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.12 }}
            aria-labelledby={`career-company-${companyIndex}`}
            className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-white/90 bg-slate-50/[0.94] shadow-[0_20px_52px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_26px_58px_rgba(14,116,144,0.12)] dark:border-white/10 dark:bg-zinc-950/[0.95] dark:ring-white/[0.04] dark:hover:border-cyan-300/25"
          >
            <div
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent dark:via-cyan-300/50"
              aria-hidden="true"
            />

            <header className="p-5 sm:p-7">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <CompanyLogo company={company.company} />

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <h3
                        id={`career-company-${companyIndex}`}
                        className="break-words text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl"
                      >
                        {company.company}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 sm:text-sm">
                        <span>{company.employmentType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{companyDateRange}</span>
                      </p>
                    </div>

                    <span className="w-fit shrink-0 rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">
                      {companyTenure}
                    </span>
                  </div>

                  <p className="mt-2.5 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-zinc-400 sm:text-sm">
                    <FaMapMarkerAlt
                      className="mt-0.5 shrink-0 text-sky-600 dark:text-cyan-300"
                      aria-hidden="true"
                    />
                    <span>{company.location}</span>
                  </p>
                </div>
              </div>
            </header>

            <div className="border-t border-slate-200/80 bg-white/55 px-5 py-5 dark:border-white/10 dark:bg-white/[0.025] sm:px-7 sm:py-6">
              <ol
                className="ml-1"
                aria-label={`${company.company} designation history`}
              >
                {company.roles.map((role, roleIndex) => {
                  const isCurrent = !role.endDate;
                  const roleDateRange = formatCareerDateRange(
                    role.startDate,
                    role.endDate,
                  );
                  const roleTenure = formatCareerTenure(
                    role.startDate,
                    role.endDate,
                    asOf,
                  );

                  return (
                    <li
                      key={`${role.title}-${role.startDate}`}
                      className="relative grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-3 pb-6 last:pb-0 sm:gap-4"
                    >
                      <div className="relative flex justify-center" aria-hidden="true">
                        <span
                          className={`relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-zinc-950 ${
                            isCurrent
                              ? "bg-sky-600 shadow-[0_0_0_4px_rgba(14,165,233,0.12)] dark:bg-cyan-300 dark:shadow-[0_0_0_4px_rgba(103,232,249,0.1)]"
                              : "bg-slate-300 dark:bg-zinc-600"
                          }`}
                        />
                        {roleIndex < company.roles.length - 1 && (
                          <span className="absolute bottom-[-0.5rem] top-4 w-px bg-gradient-to-b from-slate-300 to-slate-200 dark:from-zinc-600 dark:to-zinc-800" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="break-words text-base font-bold leading-6 text-slate-900 dark:text-zinc-100 sm:text-lg">
                                {role.title}
                              </h4>
                              {isCurrent && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/20">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400 sm:text-sm">
                              {roleDateRange}
                            </p>
                          </div>

                          <span className="w-fit shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/10">
                            {roleTenure}
                          </span>
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
  );
}
