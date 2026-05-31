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
const PULSE_SOUND_PATH = `${process.env.PUBLIC_URL || ""}/sounds/ami-pulse.wav`;

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

function formatTimeInTimezone(timezone = DEFAULT_TIMEZONE, includeSeconds = true) {
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
    return new Intl.DateTimeFormat("en-IN", options).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-IN", {
      ...options,
      timeZone: DEFAULT_TIMEZONE,
    }).format(new Date());
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

function PulseMetric({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/88 p-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/12 dark:bg-zinc-950/72">
      <span
        className={cx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
          tone,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-slate-600 dark:text-zinc-300">
          {label}
        </span>
        <span className="block break-words text-[15px] font-extrabold leading-tight text-slate-950 dark:text-white">
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
  const [timeLabels, setTimeLabels] = useState(() => ({
    full: formatTimeInTimezone(DEFAULT_TIMEZONE, true),
    compact: formatTimeInTimezone(DEFAULT_TIMEZONE, false),
  }));
  const pulseRef = useRef(null);
  const audioRef = useRef(null);
  const audioStopTimerRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(PULSE_SOUND_PATH);
    audio.preload = "auto";
    audio.volume = 0.18;
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

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
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
      setTimeLabels({
        full: formatTimeInTimezone(timezone, true),
        compact: formatTimeInTimezone(timezone, false),
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
    }, 1000);
  }, []);

  const togglePulse = useCallback(() => {
    playPulseSound();
    setIsExpanded((previous) => !previous);
  }, [playPulseSound]);

  const pulseState = useMemo(() => getPulseState(config), [config, timeLabels.compact]);

  if (loadFailed || !config || !config.isEnabled) return null;

  const pulseTitle = getPulseTitle(config.widgetTitle);
  const locationLabel = config.locationLabel || "Location not configured";
  const compactWeather = weather?.temp !== null && weather?.temp !== undefined
    ? `${weather.temp} deg C`
    : weatherFailed
      ? "Weather n/a"
      : "Weather";
  const weatherLabel = weather
    ? `${weather.temp ?? "--"} deg C ${weather.condition || ""}`.trim()
    : weatherFailed
      ? "Weather unavailable"
      : "Loading weather";
  const updatedAtLabel = formatUpdatedAt(config.updatedAt, config.ownerTimezone);

  return (
    <aside
      className="pointer-events-none absolute right-3 top-4 z-30 w-[calc(100vw-1.5rem)] max-w-[22rem] sm:right-6 sm:top-6 md:right-8 lg:right-10"
      aria-label={pulseTitle}
    >
      <div ref={pulseRef} className="pointer-events-auto flex justify-end">
        {!isExpanded ? (
          <button
            type="button"
            onClick={togglePulse}
            aria-expanded={false}
            aria-label="Toggle Ami Pulse for Amritanshu Mishra"
            className="group inline-flex min-h-[3.25rem] max-w-full items-center gap-2.5 rounded-full border border-white/80 bg-white/90 px-3.5 py-2.5 text-left text-slate-950 shadow-[0_18px_44px_rgba(15,23,42,0.24)] ring-1 ring-white/80 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/90 dark:border-white/16 dark:bg-zinc-950/82 dark:text-white dark:shadow-[0_18px_48px_rgba(0,0,0,0.58)] dark:ring-rose-100/10 dark:hover:bg-zinc-950/92"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white shadow-[0_0_26px_rgba(225,29,72,0.42)] dark:bg-rose-200 dark:text-slate-950">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/30" aria-hidden="true" />
              <HeartPulse className="relative h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 text-sm font-bold">
              <span className="block truncate">{pulseTitle}</span>
              <span className="block max-w-[15.5rem] truncate text-[11px] font-bold text-slate-700 dark:text-zinc-200">
                Amritanshu / {compactWeather} / {timeLabels.compact} / {pulseState.mood}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-y-0.5 dark:text-zinc-200" />
          </button>
        ) : (
          <div className="max-h-[76svh] w-full overflow-y-auto rounded-[1.35rem] border border-white/80 bg-white/92 p-4 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)] ring-1 ring-white/80 backdrop-blur-2xl transition-all duration-300 dark:border-white/16 dark:bg-zinc-950/86 dark:text-white dark:shadow-[0_24px_78px_rgba(0,0,0,0.66)] dark:ring-rose-100/10 sm:max-h-[35rem] sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-rose-50/90 px-2.5 py-1 text-[11px] font-bold text-rose-800 dark:border-rose-200/20 dark:bg-rose-200/10 dark:text-rose-100">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_14px_rgba(225,29,72,0.75)]" aria-hidden="true" />
                  For {OWNER_NAME}
                </p>
                <h2
                  id="ami-pulse-title"
                  className="truncate text-xl font-bold tracking-normal text-slate-950 dark:text-white"
                >
                  {pulseTitle}
                </h2>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700 dark:text-zinc-200">
                  Saved owner location, weather, time and status.
                </p>
              </div>

              <button
                type="button"
                onClick={togglePulse}
                aria-expanded={true}
                aria-label="Toggle Ami Pulse for Amritanshu Mishra"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/90 dark:border-white/12 dark:bg-white/[0.09] dark:text-zinc-50 dark:hover:bg-white/[0.14]"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-2.5">
              <PulseMetric
                icon={MapPin}
                label="Location"
                value={locationLabel}
                tone="bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-100"
              />
              <PulseMetric
                icon={CloudSun}
                label="Weather"
                value={weatherLabel}
                tone="bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-100"
              />
              <PulseMetric
                icon={Clock3}
                label="Local time"
                value={timeLabels.full}
                tone="bg-sky-100 text-sky-700 dark:bg-cyan-300/12 dark:text-cyan-100"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/88 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/12 dark:bg-zinc-950/72">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
                <Zap className="h-4 w-4 text-rose-600 dark:text-rose-200" aria-hidden="true" />
                Mode
              </p>
              <p className="text-lg font-bold leading-snug tracking-normal text-slate-950 dark:text-white">
                {pulseState.status}
              </p>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-white/86 p-3 shadow-sm dark:border-white/12 dark:bg-zinc-950/70">
                <p className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5 text-rose-600 dark:text-rose-200" aria-hidden="true" />
                  Mood
                </p>
                <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white">{pulseState.mood}</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/86 p-3 shadow-sm dark:border-white/12 dark:bg-zinc-950/70">
                <p className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
                  <Waves className="h-3.5 w-3.5 text-rose-600 dark:text-rose-200" aria-hidden="true" />
                  Vibe
                </p>
                <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white">{pulseState.vibe}</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white/88 p-3 shadow-sm dark:border-white/12 dark:bg-zinc-950/72">
              <p className="mb-1 text-xs font-bold text-slate-600 dark:text-zinc-300">
                Note
              </p>
              <p className="text-sm font-bold leading-relaxed text-slate-900 dark:text-zinc-50">
                {pulseState.suggestion}
              </p>
            </div>

            {updatedAtLabel ? (
              <p className="mt-3 text-right text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Updated {updatedAtLabel}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
