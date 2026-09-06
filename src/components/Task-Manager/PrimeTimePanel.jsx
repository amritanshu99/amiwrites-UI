import React, { useEffect, useState } from "react";
import { Clock3, Hourglass, Moon, Sunrise } from "lucide-react";
import {
  calculatePrimeTime,
  OTHER_HOURS_PER_DAY,
  PRIME_HOURS_PER_DAY,
  SLEEP_HOURS_PER_DAY,
} from "./primeTime";

const hoursFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const daysFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function TimeMetric({ label, value, helper }) {
  return (
    <div className="min-w-0 rounded-xl border border-emerald-200/60 bg-white/70 p-3 sm:p-4 dark:border-emerald-900/60 dark:bg-zinc-950/50">
      <dt className="text-xs font-bold text-slate-600 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-xl font-black tabular-nums tracking-tight text-slate-950 sm:text-2xl dark:text-white">{value}</dd>
      <dd className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{helper}</dd>
    </div>
  );
}

export default function PrimeTimePanel({ headerAction }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const time = calculatePrimeTime(now);
  const remainingPercent = time.remainingPercent.toFixed(2);
  const elapsedPercent = (100 - Number(remainingPercent)).toFixed(2);
  const status = time.phase === "upcoming"
    ? `Starts in ${time.daysUntilStart} ${time.daysUntilStart === 1 ? "day" : "days"} on your 30th birthday.`
    : time.phase === "complete"
      ? "Your age 30–45 window is complete."
      : "Your age 30–45 window is in progress.";

  return (
    <section
      aria-labelledby="prime-time-title"
      className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-[0_15px_45px_-32px_rgba(16,185,129,0.4)] sm:p-5 dark:border-emerald-900/70 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Hourglass size={17} className="text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <h2 id="prime-time-title" className="text-base font-black text-slate-950 dark:text-white">Your prime time</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">Admin only</span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-zinc-400">
            Age 30 to 45 <span aria-hidden="true">&middot;</span> 9 Sep 2026 – 9 Sep 2041
          </p>
        </div>
        {headerAction}
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
        <Sunrise size={14} aria-hidden="true" /> {PRIME_HOURS_PER_DAY} prime hours / day
      </span>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          <span className="mr-2 text-3xl font-black tabular-nums tracking-tight sm:text-4xl">{remainingPercent}%</span>{" "}
          remaining
        </p>
        <p className="text-xs font-bold tabular-nums text-slate-600 dark:text-zinc-400">{elapsedPercent}% elapsed</p>
      </div>
      <div
        role="progressbar"
        aria-label="Prime time remaining"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(remainingPercent)}
        aria-valuetext={`${remainingPercent}% remaining, ${elapsedPercent}% elapsed`}
        className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${time.remainingPercent}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-zinc-400">{status}</p>

      <dl className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 sm:gap-3">
        <TimeMetric label="Prime hours left" value={hoursFormatter.format(time.remainingHours)} helper={`of ${hoursFormatter.format(time.totalHours)} hours`} />
        <TimeMetric label="Prime hours elapsed" value={hoursFormatter.format(time.elapsedHours)} helper="Since your 30th birthday" />
        <TimeMetric label="Days in window left" value={daysFormatter.format(Math.ceil(time.remainingDays))} helper={`${PRIME_HOURS_PER_DAY * 7} prime hours per week`} />
      </dl>

      <details className="mt-3 text-xs text-slate-600 dark:text-zinc-400">
        <summary tabIndex={0} className="w-fit cursor-pointer rounded py-1 font-bold text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-300">How this is calculated</summary>
        <div className="mt-2 border-t border-emerald-200/70 pt-3 dark:border-emerald-900/60">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li className="inline-flex items-center gap-1.5"><Moon size={14} aria-hidden="true" /> {SLEEP_HOURS_PER_DAY} hours sleep excluded / day</li>
            <li className="inline-flex items-center gap-1.5"><Clock3 size={14} aria-hidden="true" /> {OTHER_HOURS_PER_DAY} hours other activities excluded / day</li>
          </ul>
          <p className="mt-2 leading-5">
            24 − {SLEEP_HOURS_PER_DAY} − {OTHER_HOURS_PER_DAY} = {PRIME_HOURS_PER_DAY} prime hours per day ({(PRIME_HOURS_PER_DAY / 24 * 100).toFixed(2)}% of each day).
            {" "}{daysFormatter.format(time.totalDays)} days, including leap days, × {PRIME_HOURS_PER_DAY} = {hoursFormatter.format(time.totalHours)} total prime hours.
            {" "}Remaining % = prime hours left ÷ total prime hours × 100.
          </p>
          <p className="mt-2 leading-5">
            Hours are averaged across each day, rather than tracked against a sleep schedule.
            {" "}Excluding the same 13 hours each day reduces available hours; the percentage of the 15-year window stays the same.
            {" "}Birthday boundaries use midnight India time (IST). Updates every minute.
          </p>
        </div>
      </details>
    </section>
  );
}
