import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  CloudSun,
  Clock3,
  HeartPulse,
  MapPin,
  Radio,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { apiUrl } from "../config/api";

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const OWNER_NAME = "Amritanshu Mishra";
const PULSE_TITLE = "Ami Pulse";
const MAX_SCHEDULE_RULES = 24;
// Intentionally match non-printing control characters in untrusted API text.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const PULSE_STATS_LABEL = `${OWNER_NAME}’s current signal`;

const FALLBACK_STATE = {
  status: "Building Amiverse",
  mood: "Focused",
  vibe: "Future-ready",
  suggestion: "Small progress compounds daily.",
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeText(value, fallback = "", maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;

  const normalized = String(value)
    .replace(CONTROL_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized ? normalized.slice(0, maxLength) : fallback;
}

function getSafeTimezone(timezone) {
  const candidate = safeText(timezone, DEFAULT_TIMEZONE, 64);

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function normalizePulseState(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;

  return {
    status: safeText(source.status, FALLBACK_STATE.status, 180),
    mood: safeText(source.mood, FALLBACK_STATE.mood, 80),
    vibe: safeText(source.vibe, FALLBACK_STATE.vibe, 80),
    suggestion: safeText(source.suggestion, FALLBACK_STATE.suggestion, 320),
  };
}

function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null;

  const startHour = Number(rule.startHour);
  const endHour = Number(rule.endHour);
  if (
    !Number.isInteger(startHour) ||
    !Number.isInteger(endHour) ||
    startHour < 0 ||
    startHour > 23 ||
    endHour < 0 ||
    endHour > 23
  ) {
    return null;
  }

  return {
    startHour,
    endHour,
    ...normalizePulseState(rule),
  };
}

export function normalizePublicConfig(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  return {
    isEnabled: data.isEnabled === true,
    widgetTitle: safeText(data.widgetTitle, PULSE_TITLE, 60),
    mode: data.mode === "manual" ? "manual" : "auto",
    manualStatus: safeText(data.manualStatus, FALLBACK_STATE.status, 180),
    manualMood: safeText(data.manualMood, FALLBACK_STATE.mood, 80),
    manualVibe: safeText(data.manualVibe, FALLBACK_STATE.vibe, 80),
    manualSuggestion: safeText(
      data.manualSuggestion,
      FALLBACK_STATE.suggestion,
      320,
    ),
    currentState: normalizePulseState(data.currentState),
    ownerTimezone: getSafeTimezone(data.ownerTimezone),
    locationLabel: safeText(data.locationLabel, "Location not shared", 120),
    updatedAt:
      typeof data.updatedAt === "string" || typeof data.updatedAt === "number"
        ? data.updatedAt
        : null,
    scheduleRules: Array.isArray(data.scheduleRules)
      ? data.scheduleRules
          .slice(0, MAX_SCHEDULE_RULES)
          .map(normalizeRule)
          .filter(Boolean)
      : [],
  };
}

export function normalizeWeather(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const temperature = Number(data.temp);
  const hasTemperature = Number.isFinite(temperature) && temperature >= -100 && temperature <= 100;

  return {
    temp: hasTemperature ? Math.round(temperature * 10) / 10 : null,
    condition: safeText(data.condition, "", 64),
  };
}

function getPulseTitle(title) {
  const normalizedTitle = safeText(title, PULSE_TITLE, 60);
  if (/^(amiverse\s+)?(beacon|pulse)$/i.test(normalizedTitle)) return PULSE_TITLE;
  if (/^amiverse\s+beacon$/i.test(normalizedTitle)) return PULSE_TITLE;
  return normalizedTitle;
}

export function getHourInTimezone(timezone = DEFAULT_TIMEZONE, date = new Date()) {
  const safeTimezone = getSafeTimezone(timezone);

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: safeTimezone,
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    if (Number.isInteger(hour)) return hour;
    return 0;
  } catch {
    return 0;
  }
}

function formatTimeInTimezone(timezone = DEFAULT_TIMEZONE, includeSeconds = true, date = new Date()) {
  const options = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: getSafeTimezone(timezone),
    timeZoneName: "short",
  };

  if (includeSeconds) options.second = "2-digit";
  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

function formatUpdatedAt(updatedAt, timezone = DEFAULT_TIMEZONE) {
  if (!updatedAt) return "";

  try {
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: getSafeTimezone(timezone),
    }).format(date);
  } catch {
    return "";
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

export function getPulseState(config, date = new Date()) {
  if (config?.currentState) return config.currentState;

  if (config?.mode === "manual") {
    return {
      status: config.manualStatus || FALLBACK_STATE.status,
      mood: config.manualMood || FALLBACK_STATE.mood,
      vibe: config.manualVibe || FALLBACK_STATE.vibe,
      suggestion: config.manualSuggestion || FALLBACK_STATE.suggestion,
    };
  }

  const rules = Array.isArray(config?.scheduleRules) ? config.scheduleRules : [];
  const hour = getHourInTimezone(config?.ownerTimezone, date);
  const activeRule = rules.find((rule) => doesRuleMatchHour(rule, hour));

  return activeRule || FALLBACK_STATE;
}

function PulseMetric({ icon: Icon, label, value, tone }) {
  return (
    <div className="group flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white/75 p-3.5 shadow-sm ring-1 ring-white/80 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.05] dark:ring-white/[0.04] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.08]">
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]",
            tone,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
          {label}
        </span>
      </span>
      <span className="mt-2 block min-w-0 break-words text-sm font-bold leading-snug text-slate-950 [overflow-wrap:anywhere] dark:text-white">
        {value}
      </span>
    </div>
  );
}

function PulseSignalBars() {
  return (
    <span className="flex shrink-0 items-end gap-1" aria-hidden="true">
      <span className="h-2.5 w-1 rounded-full bg-cyan-200/60" />
      <span className="h-4 w-1 rounded-full bg-cyan-200/80 motion-safe:animate-pulse" />
      <span className="h-6 w-1 rounded-full bg-emerald-300/90 motion-safe:animate-pulse [animation-delay:120ms]" />
      <span className="h-3.5 w-1 rounded-full bg-white/60" />
    </span>
  );
}

export default function AmiversePulseWidget() {
  const [config, setConfig] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLabels, setTimeLabels] = useState(() => {
    const now = new Date();

    return {
      full: formatTimeInTimezone(DEFAULT_TIMEZONE, true, now),
      compact: formatTimeInTimezone(DEFAULT_TIMEZONE, false, now),
      tick: now.getTime(),
    };
  });
  const pulseRef = useRef(null);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  const collapsePulse = useCallback((restoreFocus = false) => {
    setIsExpanded(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    document.body.classList.toggle("ami-pulse-expanded", isExpanded);
    return () => document.body.classList.remove("ami-pulse-expanded");
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return undefined;

    closeRef.current?.focus({ preventScroll: true });

    const handlePointerDown = (event) => {
      if (pulseRef.current?.contains(event.target)) return;
      collapsePulse(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") collapsePulse(true);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [collapsePulse, isExpanded]);

  useEffect(() => {
    const controller = new AbortController();

    axios
      .get(apiUrl("/api/pulse/public"), {
        signal: controller.signal,
        timeout: 10000,
      })
      .then((response) => {
        const nextConfig = response.data?.success
          ? normalizePublicConfig(response.data?.data)
          : null;

        if (nextConfig) {
          setConfig(nextConfig);
          setLoadFailed(false);
        } else {
          setLoadFailed(true);
        }
      })
      .catch((error) => {
        if (axios.isCancel(error) || error?.code === "ERR_CANCELED") return;
        setLoadFailed(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!config?.isEnabled) return undefined;

    const updateTime = () => {
      const now = new Date();

      setTimeLabels({
        full: formatTimeInTimezone(config.ownerTimezone, true, now),
        compact: formatTimeInTimezone(config.ownerTimezone, false, now),
        tick: now.getTime(),
      });
    };

    updateTime();
    const intervalId = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(intervalId);
  }, [config?.isEnabled, config?.ownerTimezone]);

  useEffect(() => {
    if (!config?.isEnabled) return undefined;

    const controller = new AbortController();

    axios
      .get(apiUrl("/api/pulse/weather"), {
        signal: controller.signal,
        timeout: 10000,
      })
      .then((response) => {
        const nextWeather = response.data?.success
          ? normalizeWeather(response.data?.data)
          : null;

        if (nextWeather) {
          setWeather(nextWeather);
          setWeatherFailed(false);
        } else {
          setWeatherFailed(true);
        }
      })
      .catch((error) => {
        if (axios.isCancel(error) || error?.code === "ERR_CANCELED") return;
        setWeatherFailed(true);
      });

    return () => controller.abort();
  }, [config?.isEnabled, config?.updatedAt]);

  const pulseState = useMemo(
    () => getPulseState(config, new Date(timeLabels.tick)),
    [config, timeLabels.tick],
  );

  if (loadFailed || !config?.isEnabled) return null;

  const pulseTitle = getPulseTitle(config.widgetTitle);
  const weatherLabel = weather
    ? `${weather.temp ?? "--"}°C${weather.condition ? ` · ${weather.condition}` : ""}`
    : weatherFailed
      ? "Weather unavailable"
      : "Loading weather…";
  const updatedAtLabel = formatUpdatedAt(config.updatedAt, config.ownerTimezone);

  return (
    <aside
      className={cx(
        "pointer-events-none z-[90]",
        isExpanded
          ? "fixed inset-x-3 top-[calc(4.75rem+env(safe-area-inset-top))] sm:left-auto sm:right-6 sm:top-[calc(5.75rem+env(safe-area-inset-top))] sm:w-[min(28rem,calc(100vw-3rem))] md:right-8 lg:right-10 lg:top-[calc(6rem+env(safe-area-inset-top))]"
          : "absolute right-3 top-3 sm:right-6 sm:top-6 md:right-8 lg:right-10",
      )}
      aria-label={pulseTitle}
    >
      <div ref={pulseRef} className="pointer-events-auto flex justify-end">
        {!isExpanded ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-expanded="false"
            aria-label={`Open ${pulseTitle}`}
            className="group relative isolate inline-flex min-h-14 w-[12.5rem] max-w-[calc(100vw-1.5rem)] items-center gap-2.5 overflow-hidden rounded-full border border-white/80 bg-white/90 py-2 pl-2 pr-3 text-left text-slate-950 shadow-[0_22px_58px_-32px_rgba(15,23,42,0.58),0_1px_0_rgba(255,255,255,0.96)_inset] ring-1 ring-sky-100/80 backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 dark:border-white/[0.11] dark:bg-zinc-950/90 dark:text-white dark:shadow-[0_26px_68px_-34px_rgba(0,0,0,0.98),0_0_0_1px_rgba(255,255,255,0.04)_inset] dark:ring-cyan-100/10 dark:hover:border-cyan-100/25 dark:hover:bg-zinc-950 sm:min-h-[4.5rem] sm:w-[23rem] sm:rounded-2xl sm:px-3.5 sm:py-3"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.82)_48%,rgba(236,253,245,0.7))] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.98),rgba(9,9,11,0.94)_52%,rgba(12,74,110,0.52))]" />
            <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent dark:via-cyan-100/25" />

            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_16px_34px_-18px_rgba(15,23,42,0.9)] ring-1 ring-slate-800/80 sm:h-12 sm:w-12 sm:rounded-xl dark:bg-white dark:text-slate-950 dark:ring-white/70">
              <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/16 to-transparent" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)] motion-safe:animate-pulse dark:border-zinc-950" aria-hidden="true" />
              <HeartPulse className="relative h-5 w-5 text-rose-400 motion-safe:animate-ami-pulse-heartbeat" aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <span className="truncate text-xs font-extrabold leading-tight sm:text-sm">
                  {pulseTitle}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[0.7rem] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                  <Radio className="h-3 w-3" aria-hidden="true" />
                  Live
                </span>
              </span>
              <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[0.72rem] font-bold text-slate-600 dark:text-zinc-300 sm:mt-1.5 sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-200" aria-hidden="true" />
                <span className="truncate">{pulseState.mood}</span>
                <span className="shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden="true">·</span>
                <span className="shrink-0">{timeLabels.compact}</span>
              </span>
              <span className="mt-1.5 hidden truncate text-xs font-semibold text-slate-700 dark:text-zinc-200 sm:block">
                {pulseState.status}
              </span>
            </span>

            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition-transform group-hover:translate-y-0.5 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-zinc-100 sm:flex">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        ) : (
          <section
            id="ami-pulse-panel"
            aria-labelledby="ami-pulse-title"
            aria-describedby="ami-pulse-status"
            className="relative isolate w-full max-h-[calc(100svh-5.75rem-env(safe-area-inset-top))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[1.65rem] border border-white/80 bg-white/92 text-slate-950 shadow-[0_32px_92px_-40px_rgba(15,23,42,0.72),0_1px_0_rgba(255,255,255,0.96)_inset] ring-1 ring-sky-100/90 backdrop-blur-2xl dark:border-white/[0.11] dark:bg-zinc-950/92 dark:text-white dark:shadow-[0_34px_98px_-42px_rgba(0,0,0,1),0_0_0_1px_rgba(255,255,255,0.04)_inset] dark:ring-cyan-100/10 sm:max-h-[min(42rem,calc(100svh-7rem))] sm:rounded-[1.8rem]"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_92%_0%,rgba(34,211,238,0.14),transparent_31%),radial-gradient(circle_at_0%_96%,rgba(16,185,129,0.11),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94)_48%,rgba(240,253,250,0.88))] dark:bg-[radial-gradient(circle_at_92%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.11),transparent_34%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.96)_58%,rgba(8,47,73,0.72))]" />
            <span className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent dark:via-cyan-100/30" />

            <header className="sticky top-0 z-20 flex items-start gap-3 border-b border-slate-200/70 bg-white/88 p-4 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-zinc-950/88 sm:gap-4 sm:p-5">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_38px_-20px_rgba(15,23,42,0.94)] ring-1 ring-slate-800/80 sm:h-14 sm:w-14 dark:bg-white dark:text-slate-950 dark:ring-white/70">
                <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/16 to-transparent" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.85)] motion-safe:animate-pulse dark:border-zinc-950" aria-hidden="true" />
                <HeartPulse className="relative h-6 w-6 text-rose-400" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="mb-1 flex flex-wrap items-center gap-2 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-slate-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-200">
                    <Radio className="h-3 w-3" aria-hidden="true" />
                    Live signal
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{timeLabels.compact}</span>
                </p>
                <h2
                  id="ami-pulse-title"
                  className="break-words text-xl font-black leading-tight tracking-tight text-slate-950 [overflow-wrap:anywhere] dark:text-white sm:text-2xl"
                >
                  {pulseTitle}
                </h2>
                <p
                  id="ami-pulse-status"
                  className="mt-1.5 break-words text-sm font-semibold leading-relaxed text-slate-600 [overflow-wrap:anywhere] dark:text-zinc-300"
                >
                  {pulseState.status}
                </p>
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={() => collapsePulse(true)}
                aria-label={`Close ${pulseTitle}`}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.12]"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="relative z-10 space-y-3 p-4 sm:space-y-4 sm:p-5">
              <div className="relative overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-950 p-4 text-white shadow-[0_22px_58px_-28px_rgba(15,23,42,0.88)] sm:p-5 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[0_22px_58px_-30px_rgba(0,0,0,0.96)]">
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.99),rgba(14,116,144,0.86)_58%,rgba(5,150,105,0.76))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045)_52%,rgba(34,211,238,0.13))]" />
                <div className="relative flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.12] text-cyan-100 ring-1 ring-white/[0.14]">
                      <Activity className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-white/70">
                      Current mode
                    </span>
                  </span>
                  <PulseSignalBars />
                </div>
                <p className="relative mt-3 break-words text-base font-extrabold leading-snug text-white [overflow-wrap:anywhere] sm:text-lg">
                  {pulseState.status}
                </p>

                <div className="relative mt-4 grid gap-2 min-[360px]:grid-cols-2">
                  <div className="min-w-0 rounded-xl bg-white/[0.11] px-3 py-2.5 text-white ring-1 ring-white/[0.12]">
                    <span className="flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-white/70">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-100" aria-hidden="true" />
                      Mood
                    </span>
                    <span className="mt-1 block break-words text-sm font-bold [overflow-wrap:anywhere]">{pulseState.mood}</span>
                  </div>
                  <div className="min-w-0 rounded-xl bg-white/[0.11] px-3 py-2.5 text-white ring-1 ring-white/[0.12]">
                    <span className="flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-white/70">
                      <Waves className="h-3.5 w-3.5 text-emerald-100" aria-hidden="true" />
                      Vibe
                    </span>
                    <span className="mt-1 block break-words text-sm font-bold [overflow-wrap:anywhere]">{pulseState.vibe}</span>
                  </div>
                </div>
              </div>

              <p className="flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50/75 px-3 py-2 text-[0.72rem] font-extrabold text-cyan-800 ring-1 ring-white/80 dark:border-cyan-100/10 dark:bg-cyan-300/[0.07] dark:text-cyan-100 dark:ring-white/[0.04]">
                <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="break-words [overflow-wrap:anywhere]">{PULSE_STATS_LABEL}</span>
              </p>

              <div className="grid gap-2.5 min-[440px]:grid-cols-2 sm:grid-cols-3">
                <PulseMetric
                  icon={MapPin}
                  label="Location"
                  value={config.locationLabel}
                  tone="bg-cyan-50 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-100"
                />
                <PulseMetric
                  icon={CloudSun}
                  label="Weather"
                  value={weatherLabel}
                  tone="bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-100"
                />
                <PulseMetric
                  icon={Clock3}
                  label="Local time"
                  value={timeLabels.full}
                  tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-100"
                />
              </div>

              <div className="rounded-2xl border border-cyan-100/90 bg-[linear-gradient(135deg,rgba(236,254,255,0.88),rgba(236,253,245,0.78))] p-4 shadow-sm ring-1 ring-white/80 dark:border-cyan-100/10 dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.09),rgba(16,185,129,0.06))] dark:ring-white/[0.04]">
                <div className="mb-1.5 flex items-center gap-2 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                  <Zap className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" aria-hidden="true" />
                  Next move
                </div>
                <p className="break-words text-sm font-semibold leading-relaxed text-slate-900 [overflow-wrap:anywhere] dark:text-zinc-50">
                  {pulseState.suggestion}
                </p>
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-2 px-0.5 text-[0.72rem] font-semibold text-slate-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]" aria-hidden="true" />
                  Signal online
                </span>
                {updatedAtLabel ? (
                  <span className="inline-flex items-center gap-1.5 text-right">
                    <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                    Updated {updatedAtLabel}
                  </span>
                ) : null}
              </footer>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
