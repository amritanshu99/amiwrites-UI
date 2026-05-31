import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CloudSun,
  Clock3,
  MapPin,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { apiUrl } from "../config/api";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

const FALLBACK_RULES = [
  {
    startHour: 5,
    endHour: 8,
    status: "Morning Walk / Fresh Start Mode",
    mood: "Energetic",
    vibe: "Discipline Mode",
    suggestion: "Perfect time for walking, planning, and winning the day.",
  },
  {
    startHour: 8,
    endHour: 18,
    status: "Builder Mode: Coding & Solving",
    mood: "Productive",
    vibe: "Deep Work",
    suggestion: "Deep work time. Build, fix, ship.",
  },
  {
    startHour: 18,
    endHour: 20,
    status: "Fitness / Family Reset Mode",
    mood: "Balanced",
    vibe: "Recharge Mode",
    suggestion: "Good time for workout, family, and recovery.",
  },
  {
    startHour: 20,
    endHour: 23,
    status: "AI Learning & Amiverse Mode",
    mood: "Focused",
    vibe: "Deep Focus",
    suggestion: "Good time to learn AI and improve one thing.",
  },
  {
    startHour: 23,
    endHour: 5,
    status: "Recharge Mode: Rest & Sleep",
    mood: "Calm",
    vibe: "Sleep & Recovery",
    suggestion: "Even builders need rest.",
  },
];

const FALLBACK_STATE = {
  status: "Building Amiverse",
  mood: "Focused",
  vibe: "Future-ready",
  suggestion: "Small progress compounds daily.",
};

function getSafeTimezone(timezone) {
  return timezone || DEFAULT_TIMEZONE;
}

export function getHourInTimezone(timezone = DEFAULT_TIMEZONE) {
  const safeTimezone = getSafeTimezone(timezone);

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: safeTimezone,
    }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    if (Number.isInteger(hour)) return hour;
    if (safeTimezone !== DEFAULT_TIMEZONE) return getHourInTimezone(DEFAULT_TIMEZONE);
    return 0;
  } catch {
    if (safeTimezone !== DEFAULT_TIMEZONE) return getHourInTimezone(DEFAULT_TIMEZONE);
    return 0;
  }
}

function formatTimeInTimezone(timezone = DEFAULT_TIMEZONE) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: getSafeTimezone(timezone),
      timeZoneName: "short",
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: DEFAULT_TIMEZONE,
      timeZoneName: "short",
    }).format(new Date());
  }
}

function doesRuleMatchHour(rule, hour) {
  const startHour = Number(rule?.startHour);
  const endHour = Number(rule?.endHour);

  if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) return false;
  if (startHour === endHour) return true;
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

function getPulseState(config) {
  if (config?.mode === "manual") {
    return {
      status: config.manualStatus || FALLBACK_STATE.status,
      mood: config.manualMood || FALLBACK_STATE.mood,
      vibe: config.manualVibe || FALLBACK_STATE.vibe,
      suggestion: config.manualSuggestion || FALLBACK_STATE.suggestion,
    };
  }

  const rules =
    Array.isArray(config?.scheduleRules) && config.scheduleRules.length
      ? config.scheduleRules
      : FALLBACK_RULES;
  const hour = getHourInTimezone(config?.ownerTimezone);
  const activeRule = rules.find((rule) => doesRuleMatchHour(rule, hour));

  return activeRule
    ? {
        status: activeRule.status || FALLBACK_STATE.status,
        mood: activeRule.mood || FALLBACK_STATE.mood,
        vibe: activeRule.vibe || FALLBACK_STATE.vibe,
        suggestion: activeRule.suggestion || FALLBACK_STATE.suggestion,
      }
    : FALLBACK_STATE;
}

function normalizeCta(cta) {
  if (!cta?.label || !cta?.url) return null;
  return {
    label: String(cta.label),
    url: String(cta.url),
  };
}

function PulseCta({ cta, variant }) {
  if (!cta) return null;

  const isExternal = /^https?:\/\//i.test(cta.url);
  const className =
    variant === "primary"
      ? "group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:bg-cyan-200 dark:text-slate-950 dark:hover:bg-emerald-200 sm:w-auto"
      : "group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300/70 bg-white/58 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-[0_12px_26px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-white/82 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 dark:border-white/15 dark:bg-white/[0.07] dark:text-zinc-100 dark:hover:border-rose-200/60 dark:hover:bg-white/[0.12] sm:w-auto";

  const content = (
    <>
      <span>{cta.label}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </>
  );

  if (isExternal) {
    return (
      <a className={className} href={cta.url} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className={className} to={cta.url}>
      {content}
    </Link>
  );
}

export default function AmiversePulseWidget() {
  const [config, setConfig] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [timeLabel, setTimeLabel] = useState(() => formatTimeInTimezone(DEFAULT_TIMEZONE));

  useEffect(() => {
    const controller = new AbortController();

    axios
      .get(apiUrl("/api/pulse/public"), { signal: controller.signal })
      .then((response) => {
        if (response.data?.success && response.data?.data) {
          setConfig(response.data.data);
          setLoadFailed(false);
        } else {
          setLoadFailed(true);
        }
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setLoadFailed(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!config?.isEnabled) return undefined;

    const updateTime = () => {
      setTimeLabel(formatTimeInTimezone(config.ownerTimezone || DEFAULT_TIMEZONE));
    };

    updateTime();
    const intervalId = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(intervalId);
  }, [config?.isEnabled, config?.ownerTimezone]);

  useEffect(() => {
    if (!config?.isEnabled) return undefined;

    const controller = new AbortController();

    axios
      .get(apiUrl("/api/pulse/weather"), { signal: controller.signal })
      .then((response) => {
        if (response.data?.success && response.data?.data) {
          setWeather(response.data.data);
          setWeatherFailed(false);
        } else {
          setWeatherFailed(true);
        }
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setWeatherFailed(true);
      });

    return () => controller.abort();
  }, [config?.isEnabled, config?.updatedAt]);

  const pulseState = useMemo(() => getPulseState(config), [config, timeLabel]);
  const primaryCta = useMemo(() => normalizeCta(config?.ctaPrimary), [config?.ctaPrimary]);
  const secondaryCta = useMemo(() => normalizeCta(config?.ctaSecondary), [config?.ctaSecondary]);

  if (loadFailed || !config || !config.isEnabled) return null;

  const locationLabel = config.locationLabel || "Location not configured";
  const weatherLabel = weather
    ? `${weather.temp ?? "--"} deg C ${weather.condition || ""}`.trim()
    : weatherFailed
      ? "Weather unavailable"
      : "Loading weather";

  return (
    <section
      aria-labelledby="amiverse-pulse-title"
      className="relative overflow-hidden border-b border-zinc-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(236,253,245,0.78)_38%,rgba(255,247,237,0.74)_72%,rgba(241,245,249,0.88))] px-5 py-8 text-slate-950 backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(3,7,18,0.94),rgba(15,118,110,0.22)_38%,rgba(190,18,60,0.14)_72%,rgba(24,24,27,0.94))] dark:text-zinc-50 sm:px-6 sm:py-10 md:px-20"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-cyan-100/20" />
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[1.55rem] border border-white/72 bg-white/64 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.13)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-white/12 dark:bg-zinc-950/58 dark:shadow-[0_22px_64px_rgba(0,0,0,0.45)] dark:ring-cyan-100/10 sm:p-6 md:p-7">
          <div className="absolute inset-x-4 top-0 h-px bg-white/90 dark:bg-cyan-100/20" />
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-800 dark:border-cyan-200/20 dark:bg-cyan-200/10 dark:text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Live status
                </p>
                <h2
                  id="amiverse-pulse-title"
                  className="text-2xl font-bold tracking-normal text-slate-950 dark:text-white sm:text-3xl"
                >
                  {config.widgetTitle || "Amiverse Pulse"}
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-200/20 dark:bg-emerald-200/10 dark:text-emerald-100">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                {config.mode === "manual" ? "Manual" : "Auto"}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/58 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-100">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                    Location
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {locationLabel}
                  </span>
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/58 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-100">
                  <CloudSun className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                    Weather
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {weatherLabel}
                  </span>
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/58 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-cyan-300/12 dark:text-cyan-100">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                    Local time
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {timeLabel}
                  </span>
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                Current mode
              </p>
              <p className="mt-2 text-2xl font-bold leading-tight tracking-normal text-slate-950 dark:text-white sm:text-3xl">
                {pulseState.status}
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-full flex-col justify-between gap-5 rounded-[1.55rem] border border-white/72 bg-white/58 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.1)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-white/12 dark:bg-zinc-950/50 dark:shadow-[0_18px_54px_rgba(0,0,0,0.38)] dark:ring-cyan-100/10 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/62 p-4 dark:border-white/10 dark:bg-white/[0.055]">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                <Sparkles className="h-4 w-4 text-teal-600 dark:text-cyan-200" aria-hidden="true" />
                Mood
              </p>
              <p className="text-lg font-bold text-slate-950 dark:text-white">{pulseState.mood}</p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/62 p-4 dark:border-white/10 dark:bg-white/[0.055]">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                <Waves className="h-4 w-4 text-rose-600 dark:text-rose-200" aria-hidden="true" />
                Vibe
              </p>
              <p className="text-lg font-bold text-slate-950 dark:text-white">{pulseState.vibe}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/66 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
              Suggestion
            </p>
            <p className="text-base font-medium leading-relaxed text-slate-800 dark:text-zinc-100">
              {pulseState.suggestion}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PulseCta cta={primaryCta} variant="primary" />
            <PulseCta cta={secondaryCta} variant="secondary" />
          </div>
        </div>
      </div>
    </section>
  );
}
