import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ChevronDown,
  ChevronUp,
  CloudSun,
  Clock3,
  MapPin,
  Radio,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { apiUrl } from "../config/api";

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const BEACON_TITLE = "Amiverse Beacon";
const BEACON_SOUND_PATH = `${process.env.PUBLIC_URL || ""}/sounds/message.mp3`;

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

function getBeaconTitle(title) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle || /pulse/i.test(normalizedTitle)) return BEACON_TITLE;
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

function getBeaconState(config) {
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

function BeaconMetric({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/65 bg-white/62 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
      <span
        className={cx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
          tone,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
          {label}
        </span>
        <span className="block truncate text-sm font-bold text-slate-950 dark:text-white">
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
  const audioRef = useRef(null);
  const audioStopTimerRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(BEACON_SOUND_PATH);
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

  const playBeaconSound = useCallback(() => {
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

  const toggleBeacon = useCallback(() => {
    playBeaconSound();
    setIsExpanded((previous) => !previous);
  }, [playBeaconSound]);

  const beaconState = useMemo(() => getBeaconState(config), [config, timeLabels.compact]);

  if (loadFailed || !config || !config.isEnabled) return null;

  const beaconTitle = getBeaconTitle(config.widgetTitle);
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
      aria-label={beaconTitle}
    >
      <div className="pointer-events-auto flex justify-end">
        {!isExpanded ? (
          <button
            type="button"
            onClick={toggleBeacon}
            aria-expanded={false}
            aria-label="Toggle Amiverse Beacon"
            className="group inline-flex min-h-12 max-w-full items-center gap-2.5 rounded-full border border-white/70 bg-white/76 px-3.5 py-2 text-left text-slate-950 shadow-[0_18px_44px_rgba(15,23,42,0.22)] ring-1 ring-white/70 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80 dark:border-white/14 dark:bg-zinc-950/72 dark:text-white dark:shadow-[0_18px_48px_rgba(0,0,0,0.56)] dark:ring-cyan-100/10 dark:hover:bg-zinc-950/86"
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white shadow-[0_0_26px_rgba(6,182,212,0.45)] dark:bg-cyan-200 dark:text-slate-950">
              <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/35" aria-hidden="true" />
              <Radio className="relative h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 text-sm font-bold">
              <span className="block truncate">Beacon</span>
              <span className="block max-w-[15.5rem] truncate text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
                {compactWeather} / {timeLabels.compact} / {beaconState.mood}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-y-0.5 dark:text-zinc-300" />
          </button>
        ) : (
          <div className="max-h-[76svh] w-full overflow-y-auto rounded-[1.35rem] border border-white/72 bg-white/78 p-4 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.24)] ring-1 ring-white/70 backdrop-blur-2xl transition-all duration-300 dark:border-white/14 dark:bg-zinc-950/76 dark:text-white dark:shadow-[0_24px_78px_rgba(0,0,0,0.62)] dark:ring-cyan-100/10 sm:max-h-[35rem] sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-800 dark:border-cyan-200/20 dark:bg-cyan-200/10 dark:text-cyan-100">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.8)]" aria-hidden="true" />
                  Live
                </p>
                <h2
                  id="amiverse-beacon-title"
                  className="truncate text-xl font-bold tracking-normal text-slate-950 dark:text-white"
                >
                  {beaconTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={toggleBeacon}
                aria-expanded={true}
                aria-label="Toggle Amiverse Beacon"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/72 text-slate-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80 dark:border-white/10 dark:bg-white/[0.07] dark:text-zinc-100 dark:hover:bg-white/[0.12]"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-2.5">
              <BeaconMetric
                icon={MapPin}
                label="Location"
                value={locationLabel}
                tone="bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-100"
              />
              <BeaconMetric
                icon={CloudSun}
                label="Weather"
                value={weatherLabel}
                tone="bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-100"
              />
              <BeaconMetric
                icon={Clock3}
                label="Local time"
                value={timeLabels.full}
                tone="bg-sky-100 text-sky-700 dark:bg-cyan-300/12 dark:text-cyan-100"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/70 bg-white/62 p-4 dark:border-white/10 dark:bg-white/[0.055]">
              <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-zinc-400">
                <Zap className="h-4 w-4 text-teal-600 dark:text-cyan-200" aria-hidden="true" />
                Current mode
              </p>
              <p className="text-lg font-bold leading-snug tracking-normal text-slate-950 dark:text-white">
                {beaconState.status}
              </p>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/58 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-zinc-400">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-cyan-200" aria-hidden="true" />
                  Mood
                </p>
                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{beaconState.mood}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/58 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-zinc-400">
                  <Waves className="h-3.5 w-3.5 text-rose-600 dark:text-rose-200" aria-hidden="true" />
                  Vibe
                </p>
                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{beaconState.vibe}</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/70 bg-white/64 p-3 dark:border-white/10 dark:bg-white/[0.055]">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-zinc-400">
                Suggestion
              </p>
              <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-zinc-100">
                {beaconState.suggestion}
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
