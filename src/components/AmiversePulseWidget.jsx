import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ChevronDown,
  ChevronUp,
  CloudSun,
  Clock3,
  HeartPulse,
  MapPin,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { apiUrl } from "../config/api";

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const OWNER_NAME = "Amritanshu Mishra";
const PULSE_TITLE = "Ami Pulse";
const PULSE_SOUND_PATH = `${process.env.PUBLIC_URL || ""}/sounds/ami-pulse.mp3`;
const PULSE_SOUND_STOP_MS = 1400;

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

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getSafeTimezone(timezone) {
  return timezone || DEFAULT_TIMEZONE;
}

function getPulseTitle(title) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) return PULSE_TITLE;
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
    if (safeTimezone !== DEFAULT_TIMEZONE) return getHourInTimezone(DEFAULT_TIMEZONE, date);
    return 0;
  } catch {
    if (safeTimezone !== DEFAULT_TIMEZONE) return getHourInTimezone(DEFAULT_TIMEZONE, date);
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

  if (includeSeconds) {
    options.second = "2-digit";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", options).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-IN", {
      ...options,
      timeZone: DEFAULT_TIMEZONE,
    }).format(date);
  }
}

function formatUpdatedAt(updatedAt, timezone = DEFAULT_TIMEZONE) {
  if (!updatedAt) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: getSafeTimezone(timezone),
    }).format(new Date(updatedAt));
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

function getPulseState(config, date = new Date()) {
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
  const hour = getHourInTimezone(config?.ownerTimezone, date);
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

function PulseMetric({ icon: Icon, label, value, tone }) {
  return (
    <div className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.45)] ring-1 ring-white/80 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-[0_18px_44px_-34px_rgba(0,0,0,0.9)] dark:ring-white/[0.04] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.07]">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80 dark:via-white/20" />
      <span
        className={cx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/[0.04] transition duration-300 group-hover:scale-105 dark:ring-white/[0.08]",
          tone,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase leading-tight tracking-[0.18em] text-slate-500 dark:text-zinc-400">
          {label}
        </span>
        <span className="mt-1 block break-words text-sm font-bold leading-tight text-slate-950 dark:text-white">
          {value}
        </span>
      </span>
    </div>
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
  const audioRef = useRef(null);
  const audioStopTimerRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(PULSE_SOUND_PATH);
    audio.preload = "auto";
    audio.volume = 0.24;
    audio.load();
    audioRef.current = audio;

    return () => {
      window.clearTimeout(audioStopTimerRef.current);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isExpanded) return undefined;

    const handlePointerDown = (event) => {
      if (pulseRef.current?.contains(event.target)) return;
      setIsExpanded(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

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
      const timezone = config.ownerTimezone || DEFAULT_TIMEZONE;
      const now = new Date();

      setTimeLabels({
        full: formatTimeInTimezone(timezone, true, now),
        compact: formatTimeInTimezone(timezone, false, now),
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

  const playPulseSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    window.clearTimeout(audioStopTimerRef.current);
    audio.pause();
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }

    audioStopTimerRef.current = window.setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, PULSE_SOUND_STOP_MS);
  }, []);

  const togglePulse = useCallback(() => {
    playPulseSound();
    setIsExpanded((previous) => !previous);
  }, [playPulseSound]);

  const pulseState = useMemo(
    () => getPulseState(config, new Date(timeLabels.tick)),
    [config, timeLabels.tick],
  );

  if (loadFailed || !config || !config.isEnabled) return null;

  const pulseTitle = getPulseTitle(config.widgetTitle);
  const locationLabel = config.locationLabel || "Location not configured";
  const weatherLabel = weather
    ? `${weather.temp ?? "--"} deg C ${weather.condition || ""}`.trim()
    : weatherFailed
      ? "Weather unavailable"
      : "Loading weather";
  const updatedAtLabel = formatUpdatedAt(config.updatedAt, config.ownerTimezone);

  return (
    <aside
      className="pointer-events-none absolute left-3 right-3 top-4 z-30 sm:left-auto sm:right-6 sm:top-6 sm:w-[min(25rem,calc(100vw-3rem))] md:right-8 lg:right-10"
      aria-label={pulseTitle}
    >
      <div ref={pulseRef} className="pointer-events-auto flex justify-end">
        {!isExpanded ? (
          <button
            type="button"
            onClick={togglePulse}
            aria-expanded={false}
            aria-controls="ami-pulse-panel"
            aria-label="Toggle Ami Pulse for Amritanshu Mishra"
            className="group relative isolate inline-flex min-h-[4rem] w-full max-w-full items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/[0.92] px-3.5 py-3 text-left text-slate-950 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.58),0_1px_0_rgba(255,255,255,0.9)_inset] ring-1 ring-white/80 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 dark:border-white/[0.1] dark:bg-zinc-950/[0.82] dark:text-white dark:shadow-[0_28px_72px_-40px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.04)_inset] dark:ring-white/[0.06] dark:hover:border-white/[0.18] dark:hover:bg-zinc-950/[0.92] sm:w-auto sm:min-w-[21.5rem]"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(248,250,252,0.72)_48%,rgba(236,253,245,0.58))] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.94),rgba(9,9,11,0.88)_52%,rgba(8,47,73,0.62))]" />
            <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent dark:via-cyan-200/30" />
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_16px_34px_-18px_rgba(15,23,42,0.9)] ring-1 ring-slate-800/80 dark:bg-white dark:text-slate-950 dark:ring-white/70">
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)] dark:border-zinc-950" aria-hidden="true" />
              <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/12 to-transparent" aria-hidden="true" />
              <HeartPulse className="relative h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 sm:max-w-[17.5rem]">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-extrabold leading-tight text-slate-950 dark:text-white">
                  {pulseTitle}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">
                  Live
                </span>
              </span>
              <span className="mt-1 block truncate text-xs font-bold leading-tight text-slate-600 dark:text-zinc-300">
                {pulseState.status}
              </span>
              <span className="mt-2 flex min-w-0 items-center gap-2 text-[11px] font-semibold leading-tight text-slate-500 dark:text-zinc-400">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-200" aria-hidden="true" />
                  <span className="truncate">{pulseState.mood || "Current mood"}</span>
                </span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-zinc-700" aria-hidden="true" />
                <span className="inline-flex shrink-0 items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{timeLabels.compact}</span>
                </span>
              </span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/[0.82] text-slate-600 shadow-sm transition-transform group-hover:translate-y-0.5 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-zinc-100">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        ) : (
          <div
            id="ami-pulse-panel"
            className="relative isolate max-h-[78svh] w-full overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/[0.94] p-3.5 text-slate-950 shadow-[0_30px_90px_-42px_rgba(15,23,42,0.64),0_1px_0_rgba(255,255,255,0.95)_inset] ring-1 ring-white/80 backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.1] dark:bg-zinc-950/[0.9] dark:text-white dark:shadow-[0_32px_94px_-44px_rgba(0,0,0,1),0_0_0_1px_rgba(255,255,255,0.04)_inset] dark:ring-white/[0.06] sm:max-h-[35rem] sm:p-4"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.9)_54%,rgba(240,253,250,0.74))] dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92)_58%,rgba(8,47,73,0.48))]" />
            <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent dark:via-cyan-100/25" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200/80 bg-white/[0.78] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" aria-hidden="true" />
                  For {OWNER_NAME}
                </p>
                <h2
                  id="ami-pulse-title"
                  className="truncate text-2xl font-extrabold tracking-normal text-slate-950 dark:text-white"
                >
                  {pulseTitle}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-zinc-300">
                  {pulseState.status}
                </p>
              </div>

              <button
                type="button"
                onClick={togglePulse}
                aria-expanded={true}
                aria-controls="ami-pulse-panel"
                aria-label="Toggle Ami Pulse for Amritanshu Mishra"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/[0.78] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11]"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="relative z-10 mt-4 overflow-hidden rounded-xl border border-slate-900/10 bg-slate-950 p-4 text-white shadow-[0_20px_54px_-28px_rgba(15,23,42,0.85)] dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[0_22px_54px_-30px_rgba(0,0,0,0.95)]">
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.9)_48%,rgba(6,95,70,0.78))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.045)_52%,rgba(34,211,238,0.1))]" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.12] text-cyan-100 ring-1 ring-white/[0.14]">
                    <Zap className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/[0.55]">
                      Current mode
                    </span>
                    <span className="mt-1 block break-words text-base font-extrabold leading-snug text-white">
                      {pulseState.status}
                    </span>
                  </span>
                </div>
                <div className="mt-1 flex shrink-0 items-end gap-1" aria-hidden="true">
                  <span className="h-3 w-1 rounded-full bg-cyan-200/[0.55]" />
                  <span className="h-5 w-1 rounded-full bg-cyan-200/70" />
                  <span className="h-7 w-1 rounded-full bg-emerald-300/80" />
                  <span className="h-4 w-1 rounded-full bg-white/[0.45]" />
                </div>
              </div>
              <div className="relative mt-4 flex flex-wrap gap-2">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/[0.11] px-2.5 py-1 text-xs font-bold text-white ring-1 ring-white/[0.12]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-100" aria-hidden="true" />
                  <span className="truncate">{pulseState.mood}</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/[0.11] px-2.5 py-1 text-xs font-bold text-white ring-1 ring-white/[0.12]">
                  <Waves className="h-3.5 w-3.5 shrink-0 text-emerald-100" aria-hidden="true" />
                  <span className="truncate">{pulseState.vibe}</span>
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-3 grid gap-2.5">
              <PulseMetric
                icon={MapPin}
                label="Location"
                value={locationLabel}
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

            <div className="relative z-10 mt-3 rounded-xl border border-slate-200/80 bg-white/[0.86] p-3.5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.45)] ring-1 ring-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:ring-white/[0.04]">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                Next move
              </p>
              <p className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-zinc-50">
                {pulseState.suggestion}
              </p>
            </div>

            {updatedAtLabel ? (
              <p className="relative z-10 mt-3 text-right text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
                Updated {updatedAtLabel}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
