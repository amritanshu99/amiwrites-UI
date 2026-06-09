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
const PULSE_SOUND_VOLUME = 0.42;
const PULSE_SOUND_STOP_MS = 2200;
const SMALL_SCREEN_QUERY = "(max-width: 639px)";
const SMALL_SCREEN_AUTO_COLLAPSE_MS = 5000;
const PULSE_STATS_LABEL = `${OWNER_NAME}’s current stats`;

function getIsSmallScreen() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(SMALL_SCREEN_QUERY).matches
  );
}

const publicAssetPath = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const publicUrl = (process.env.PUBLIC_URL || "").replace(/\/+$/, "");

  return publicUrl ? `${publicUrl}${normalizedPath}` : normalizedPath;
};

const PULSE_SOUND_PATH = publicAssetPath("/sounds/ami-pulse.mp3");

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
    <div className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-slate-200/80 bg-white/[0.72] p-3 shadow-sm ring-1 ring-white/70 backdrop-blur-xl transition duration-300 hover:border-slate-300 hover:bg-white/[0.92] dark:border-white/[0.08] dark:bg-white/[0.045] dark:ring-white/[0.04] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.07]">
      <span
        className={cx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/[0.04] transition duration-300 group-hover:scale-105 dark:ring-white/[0.08]",
          tone,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase leading-tight text-slate-500 dark:text-zinc-400">
          {label}
        </span>
        <span className="mt-1 block break-words text-sm font-bold leading-tight text-slate-950 dark:text-white">
          {value}
        </span>
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
  const [isSmallScreen, setIsSmallScreen] = useState(getIsSmallScreen);
  const [isExpanded, setIsExpanded] = useState(getIsSmallScreen);
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
  const autoCollapseTimerRef = useRef(null);

  const collapsePulse = useCallback(() => {
    window.clearTimeout(autoCollapseTimerRef.current);
    setIsExpanded(false);
  }, []);

  const createPulseAudio = useCallback(() => {
    const audio = new Audio();
    audio.src = PULSE_SOUND_PATH;
    audio.preload = "auto";
    audio.volume = PULSE_SOUND_VOLUME;
    audio.addEventListener("error", () => {
      console.warn("AmiPulse heartbeat audio failed to load.", audio.currentSrc || PULSE_SOUND_PATH);
    });

    return audio;
  }, []);

  useEffect(() => {
    const audio = createPulseAudio();
    audio.load();
    audioRef.current = audio;

    return () => {
      window.clearTimeout(audioStopTimerRef.current);
      window.clearTimeout(autoCollapseTimerRef.current);
      audio.pause();
      audioRef.current = null;
    };
  }, [createPulseAudio]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia(SMALL_SCREEN_QUERY);

    const syncSmallScreen = () => {
      setIsSmallScreen(mediaQuery.matches);
    };

    syncSmallScreen();
    mediaQuery.addEventListener("change", syncSmallScreen);

    return () => mediaQuery.removeEventListener("change", syncSmallScreen);
  }, []);

  useEffect(() => {
    window.clearTimeout(autoCollapseTimerRef.current);

    if (!isSmallScreen || !config?.isEnabled) return undefined;

    setIsExpanded(true);
    autoCollapseTimerRef.current = window.setTimeout(() => {
      setIsExpanded(false);
    }, SMALL_SCREEN_AUTO_COLLAPSE_MS);

    return () => window.clearTimeout(autoCollapseTimerRef.current);
  }, [config?.isEnabled, isSmallScreen]);

  useEffect(() => {
    if (!isExpanded) return undefined;

    const handlePointerDown = (event) => {
      if (pulseRef.current?.contains(event.target)) return;
      collapsePulse();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        collapsePulse();
      }
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
    const audio = audioRef.current || createPulseAudio();
    audioRef.current = audio;

    window.clearTimeout(audioStopTimerRef.current);
    audio.pause();
    audio.muted = false;
    audio.volume = PULSE_SOUND_VOLUME;

    try {
      audio.currentTime = 0;
    } catch (error) {
      console.warn("AmiPulse heartbeat audio could not be reset.", error);
    }

    if (audio.readyState === 0) {
      audio.load();
    }

    const stopAudio = () => {
      audio.pause();

      try {
        audio.currentTime = 0;
      } catch (error) {
        console.warn("AmiPulse heartbeat audio could not be reset after playback.", error);
      }
    };

    const playPromise = audio.play();
    if (playPromise?.then) {
      playPromise
        .then(() => {
          audioStopTimerRef.current = window.setTimeout(stopAudio, PULSE_SOUND_STOP_MS);
        })
        .catch((error) => {
          console.warn("AmiPulse heartbeat audio playback was blocked or failed.", error);
        });
      return;
    }

    audioStopTimerRef.current = window.setTimeout(stopAudio, PULSE_SOUND_STOP_MS);
  }, [createPulseAudio]);

  const togglePulse = useCallback(() => {
    window.clearTimeout(autoCollapseTimerRef.current);
    playPulseSound();
    setIsExpanded((current) => !current);
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
      className={cx(
        "pointer-events-none absolute z-30 origin-top-right",
        !isExpanded && isSmallScreen
          ? "right-4 top-4"
          : "left-3 right-3 top-4 sm:left-auto sm:right-6 sm:top-6 sm:w-[min(24.5rem,calc(100vw-3rem))] md:right-8 lg:right-10",
      )}
      aria-label={pulseTitle}
    >
      <div ref={pulseRef} className="pointer-events-auto flex justify-end">
        {!isExpanded ? (
          <button
            type="button"
            onClick={togglePulse}
            aria-expanded={false}
            aria-controls="ami-pulse-panel"
            aria-label={isSmallScreen ? "Open Ami Pulse" : "Expand Ami Pulse for Amritanshu Mishra"}
            className={cx(
              "group relative isolate inline-flex items-center overflow-hidden border bg-white/[0.86] text-left text-slate-950 shadow-[0_22px_58px_-34px_rgba(15,23,42,0.52),0_1px_0_rgba(255,255,255,0.9)_inset] ring-1 ring-sky-100/80 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 dark:border-white/[0.1] dark:bg-zinc-950/[0.86] dark:text-white dark:shadow-[0_26px_68px_-38px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.04)_inset] dark:ring-cyan-100/10 dark:hover:border-cyan-100/25 dark:hover:bg-zinc-950/[0.94]",
              isSmallScreen
                ? "h-14 w-14 justify-center rounded-full border-white/80 p-0"
                : "min-h-[4.35rem] w-full max-w-full gap-3 rounded-2xl border-white/70 px-3.5 py-3 sm:w-auto sm:min-w-[22rem]",
            )}
          >
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,249,255,0.78)_48%,rgba(236,253,245,0.64))] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.96),rgba(9,9,11,0.9)_52%,rgba(12,74,110,0.5))]" />
            <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/85 to-transparent dark:via-cyan-100/25" />
            <span
              className={cx(
                "relative flex h-12 w-12 shrink-0 items-center justify-center bg-slate-950 text-white shadow-[0_16px_34px_-18px_rgba(15,23,42,0.9)] ring-1 ring-slate-800/80 dark:bg-white dark:text-slate-950 dark:ring-white/70",
                isSmallScreen ? "rounded-full motion-safe:animate-ami-pulse-heartbeat" : "rounded-xl",
              )}
            >
              <span
                className={cx(
                  "absolute inset-0 bg-gradient-to-br from-white/16 to-transparent",
                  isSmallScreen ? "rounded-full" : "rounded-xl",
                )}
                aria-hidden="true"
              />
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)] motion-safe:animate-pulse dark:border-zinc-950" aria-hidden="true" />
              <HeartPulse className="relative h-5 w-5 text-rose-400 motion-safe:animate-ami-pulse-heartbeat" aria-hidden="true" />
            </span>
            <span className={cx("min-w-0 flex-1 sm:max-w-[18rem]", isSmallScreen && "sr-only")}>
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="truncate text-sm font-extrabold leading-tight text-slate-950 dark:text-white">
                  {pulseTitle}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">
                  <Radio className="h-3 w-3" aria-hidden="true" />
                  Live
                </span>
              </span>
              <span className="mt-1.5 block truncate text-xs font-bold leading-tight text-slate-700 dark:text-zinc-200">
                {pulseState.status}
              </span>
              <span className="mt-2.5 flex min-w-0 items-center gap-2 text-[11px] font-semibold leading-tight text-slate-500 dark:text-zinc-400">
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-950/[0.04] px-2 py-1 dark:bg-white/[0.07]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-200" aria-hidden="true" />
                  <span className="truncate">{pulseState.mood || "Current mood"}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-950/[0.04] px-2 py-1 dark:bg-white/[0.07]">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{timeLabels.compact}</span>
                </span>
              </span>
            </span>
            <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/[0.82] text-slate-600 shadow-sm transition-transform group-hover:translate-y-0.5 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-zinc-100", isSmallScreen && "sr-only")}>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        ) : isSmallScreen ? (
          <div
            id="ami-pulse-panel"
            className="relative isolate w-full max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[1.7rem] border border-white/80 bg-white/[0.9] p-4 text-slate-950 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55),0_1px_0_rgba(255,255,255,0.95)_inset] ring-1 ring-sky-100/90 backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.1] dark:bg-zinc-950/[0.9] dark:text-white dark:shadow-[0_28px_78px_-40px_rgba(0,0,0,0.98),0_0_0_1px_rgba(255,255,255,0.04)_inset] dark:ring-cyan-100/10"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.82)_46%,rgba(236,253,245,0.72))] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.97),rgba(9,9,11,0.92)_54%,rgba(12,74,110,0.5))]" />
            <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent dark:via-cyan-100/25" />

            <div className="relative z-10 flex items-center gap-4">
              <span className="relative flex h-[4.15rem] w-[4.15rem] shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_38px_-20px_rgba(15,23,42,0.94)] ring-1 ring-slate-800/80 dark:bg-white dark:text-slate-950 dark:ring-white/70">
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/16 to-transparent" aria-hidden="true" />
                <span className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.85)] motion-safe:animate-pulse dark:border-zinc-950" aria-hidden="true" />
                <HeartPulse className="relative h-8 w-8 text-rose-400" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <h2
                    id="ami-pulse-title"
                    className="truncate text-[1.35rem] font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white"
                  >
                    {pulseTitle}
                  </h2>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-700 shadow-sm ring-1 ring-white/70 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200 dark:ring-white/[0.04]">
                    <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                    Live
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-base font-extrabold leading-snug text-slate-700 dark:text-zinc-200">
                  {pulseState.status}
                </p>

                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-sm font-extrabold leading-tight text-slate-500 dark:text-zinc-300">
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-slate-950/[0.04] px-3 py-1.5 dark:bg-white/[0.07]">
                    <Sparkles className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-200" aria-hidden="true" />
                    <span className="truncate">{pulseState.mood || "Current mood"}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950/[0.04] px-3 py-1.5 dark:bg-white/[0.07]">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                    <span>{timeLabels.compact}</span>
                  </span>
                </div>

                <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50/80 px-3 py-1.5 text-xs font-extrabold text-cyan-800 shadow-sm ring-1 ring-white/70 dark:border-cyan-100/10 dark:bg-cyan-300/[0.08] dark:text-cyan-100 dark:ring-white/[0.04]">
                  <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{PULSE_STATS_LABEL}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={togglePulse}
                aria-expanded={true}
                aria-controls="ami-pulse-panel"
                aria-label="Collapse Ami Pulse"
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/[0.82] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11]"
              >
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <div
            id="ami-pulse-panel"
            className="relative isolate max-h-[78svh] w-full overflow-y-auto rounded-2xl border border-white/70 bg-white/[0.92] p-3.5 text-slate-950 shadow-[0_30px_88px_-42px_rgba(15,23,42,0.62),0_1px_0_rgba(255,255,255,0.95)_inset] ring-1 ring-sky-100/80 backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.1] dark:bg-zinc-950/[0.9] dark:text-white dark:shadow-[0_32px_94px_-44px_rgba(0,0,0,1),0_0_0_1px_rgba(255,255,255,0.04)_inset] dark:ring-cyan-100/10 sm:max-h-[35rem] sm:p-4"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9)_48%,rgba(240,253,250,0.76))] dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.97),rgba(9,9,11,0.93)_58%,rgba(12,74,110,0.42))]" />
            <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/85 to-transparent dark:via-cyan-100/25" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_16px_34px_-18px_rgba(15,23,42,0.9)] ring-1 ring-slate-800/80 dark:bg-white dark:text-slate-950 dark:ring-white/70">
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/16 to-transparent" aria-hidden="true" />
                  <HeartPulse className="relative h-5 w-5 text-rose-400" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="mb-1.5 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200/80 bg-white/[0.78] px-2.5 py-1 text-[10px] font-extrabold uppercase text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)] motion-safe:animate-pulse" aria-hidden="true" />
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
                  <p className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50/80 px-2.5 py-1 text-[11px] font-extrabold text-cyan-800 shadow-sm ring-1 ring-white/70 dark:border-cyan-100/10 dark:bg-cyan-300/[0.08] dark:text-cyan-100 dark:ring-white/[0.04]">
                    <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{PULSE_STATS_LABEL}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={togglePulse}
                aria-expanded={true}
                aria-controls="ami-pulse-panel"
                aria-label="Collapse Ami Pulse"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/[0.78] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11]"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="relative z-10 mt-4 overflow-hidden rounded-xl border border-slate-900/10 bg-slate-950 p-4 text-white shadow-[0_20px_54px_-28px_rgba(15,23,42,0.85)] dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[0_22px_54px_-30px_rgba(0,0,0,0.95)]">
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.97),rgba(14,116,144,0.82)_58%,rgba(5,150,105,0.72))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.045)_52%,rgba(34,211,238,0.11))]" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.12] text-cyan-100 ring-1 ring-white/[0.14]">
                    <Activity className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase text-white/[0.62]">
                      Current mode
                    </span>
                    <span className="mt-1 block break-words text-base font-extrabold leading-snug text-white">
                      {pulseState.status}
                    </span>
                  </span>
                </div>
                <PulseSignalBars />
              </div>
              <div className="relative mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-white/[0.11] px-2.5 py-2 text-xs font-bold text-white ring-1 ring-white/[0.12]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-100" aria-hidden="true" />
                  <span className="truncate">{pulseState.mood}</span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-white/[0.11] px-2.5 py-2 text-xs font-bold text-white ring-1 ring-white/[0.12]">
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

            <div className="relative z-10 mt-3 rounded-xl border border-cyan-100/90 bg-cyan-50/70 p-3.5 shadow-sm ring-1 ring-white/80 backdrop-blur-xl dark:border-cyan-100/10 dark:bg-cyan-300/[0.07] dark:ring-white/[0.04]">
              <div className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400">
                <Zap className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" aria-hidden="true" />
                Next move
              </div>
              <p className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-zinc-50">
                {pulseState.suggestion}
              </p>
            </div>

            {updatedAtLabel ? (
              <div className="relative z-10 mt-3 flex items-center justify-end gap-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
                <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                <span>Updated {updatedAtLabel}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
