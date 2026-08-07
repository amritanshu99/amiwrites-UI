import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  LocateFixed,
  LoaderCircle,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { apiUrl } from "../../config/api";
import { getGeolocationErrorMessage } from "../../utils/pulseLocation";

const DEFAULT_FORM = {
  isEnabled: true,
  widgetTitle: "Ami Pulse",
  mode: "auto",
  manualStatus: "Building Amiverse",
  manualMood: "Focused",
  manualVibe: "Future-ready",
  manualSuggestion: "Small progress compounds daily.",
  ownerCity: "",
  ownerRegion: "",
  ownerCountry: "",
  ownerLatitude: "",
  ownerLongitude: "",
  ownerTimezone: "Asia/Kolkata",
  locationLabel: "Location not shared",
  scheduleRules: [],
};

const MAX_RULES = 24;
const FIELD_LIMITS = {
  title: 60,
  status: 180,
  short: 80,
  suggestion: 320,
  location: 120,
  timezone: 64,
};
// Intentionally match non-printing control characters in admin-provided text.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
let nextRuleKey = 0;

const createRuleKey = () => {
  nextRuleKey += 1;
  return `pulse-rule-${nextRuleKey}`;
};

const EMPTY_RULE = {
  startHour: 9,
  endHour: 17,
  status: "",
  mood: "",
  vibe: "",
  suggestion: "",
};

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:shadow-none dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/10";

const labelClassName = "block text-sm font-semibold text-slate-700 dark:text-zinc-200";

const panelClassName =
  "rounded-2xl border border-white/75 bg-white/82 p-5 shadow-sm ring-1 ring-white/70 backdrop-blur-2xl dark:border-zinc-800 dark:bg-black/88 dark:ring-white/[0.06] dark:shadow-[0_24px_60px_-44px_rgba(0,0,0,0.95)] sm:p-6";

const insetPanelClassName =
  "rounded-2xl border border-slate-200/75 bg-white/72 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70 dark:shadow-none";

const secondaryButtonClassName =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-65 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 sm:w-auto";

function normalizePulseTitle(title) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) return DEFAULT_FORM.widgetTitle;
  if (/^(amiverse\s+)?(beacon|pulse)$/i.test(normalizedTitle)) return DEFAULT_FORM.widgetTitle;
  return normalizedTitle;
}

function cleanText(value, maxLength) {
  if (typeof value !== "string" && typeof value !== "number") return "";

  return String(value)
    .replace(CONTROL_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function getValidatedTimezone(value) {
  const timezone = cleanText(value, FIELD_LIMITS.timezone);
  if (!timezone) return null;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return null;
  }
}

function normalizeCoordinate(value, min, max) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const candidate = String(value).trim().slice(0, 32);
  if (!candidate) return "";
  const number = Number(candidate);
  return Number.isFinite(number) && number >= min && number <= max ? candidate : "";
}

function normalizeHour(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const candidate = String(value).trim();
  if (!candidate) return "";
  const hour = Number(candidate);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : "";
}

function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null;

  return {
    _key: createRuleKey(),
    startHour: normalizeHour(rule.startHour),
    endHour: normalizeHour(rule.endHour),
    status: cleanText(rule.status, FIELD_LIMITS.status),
    mood: cleanText(rule.mood, FIELD_LIMITS.short),
    vibe: cleanText(rule.vibe, FIELD_LIMITS.short),
    suggestion: cleanText(rule.suggestion, FIELD_LIMITS.suggestion),
  };
}

export function toForm(data) {
  const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};

  return {
    isEnabled: source.isEnabled === true,
    widgetTitle: normalizePulseTitle(cleanText(source.widgetTitle, FIELD_LIMITS.title)),
    mode: source.mode === "manual" ? "manual" : "auto",
    manualStatus:
      cleanText(source.manualStatus, FIELD_LIMITS.status) || DEFAULT_FORM.manualStatus,
    manualMood: cleanText(source.manualMood, FIELD_LIMITS.short) || DEFAULT_FORM.manualMood,
    manualVibe: cleanText(source.manualVibe, FIELD_LIMITS.short) || DEFAULT_FORM.manualVibe,
    manualSuggestion:
      cleanText(source.manualSuggestion, FIELD_LIMITS.suggestion) ||
      DEFAULT_FORM.manualSuggestion,
    ownerCity: cleanText(source.ownerCity, FIELD_LIMITS.short),
    ownerRegion: cleanText(source.ownerRegion, FIELD_LIMITS.short),
    ownerCountry: cleanText(source.ownerCountry, FIELD_LIMITS.short),
    ownerLatitude: normalizeCoordinate(source.ownerLatitude, -90, 90),
    ownerLongitude: normalizeCoordinate(source.ownerLongitude, -180, 180),
    ownerTimezone: getValidatedTimezone(source.ownerTimezone) || DEFAULT_FORM.ownerTimezone,
    locationLabel:
      cleanText(source.locationLabel, FIELD_LIMITS.location) || DEFAULT_FORM.locationLabel,
    scheduleRules: Array.isArray(source.scheduleRules)
      ? source.scheduleRules.slice(0, MAX_RULES).map(normalizeRule).filter(Boolean)
      : [],
  };
}

function buildPayload(form) {
  const coordinateToPayload = (value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "";

    const number = Number(trimmed);
    return Number.isFinite(number) ? number : trimmed;
  };

  const hourToPayload = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  };

  return {
    isEnabled: Boolean(form.isEnabled),
    widgetTitle: cleanText(form.widgetTitle, FIELD_LIMITS.title),
    mode: form.mode === "manual" ? "manual" : "auto",
    manualStatus: cleanText(form.manualStatus, FIELD_LIMITS.status),
    manualMood: cleanText(form.manualMood, FIELD_LIMITS.short),
    manualVibe: cleanText(form.manualVibe, FIELD_LIMITS.short),
    manualSuggestion: cleanText(form.manualSuggestion, FIELD_LIMITS.suggestion),
    ownerCity: cleanText(form.ownerCity, FIELD_LIMITS.short),
    ownerRegion: cleanText(form.ownerRegion, FIELD_LIMITS.short),
    ownerCountry: cleanText(form.ownerCountry, FIELD_LIMITS.short),
    ownerLatitude: coordinateToPayload(form.ownerLatitude),
    ownerLongitude: coordinateToPayload(form.ownerLongitude),
    ownerTimezone: getValidatedTimezone(form.ownerTimezone) || DEFAULT_FORM.ownerTimezone,
    locationLabel: cleanText(form.locationLabel, FIELD_LIMITS.location),
    scheduleRules: form.scheduleRules.slice(0, MAX_RULES).map((rule) => ({
      startHour: hourToPayload(rule.startHour),
      endHour: hourToPayload(rule.endHour),
      status: cleanText(rule.status, FIELD_LIMITS.status),
      mood: cleanText(rule.mood, FIELD_LIMITS.short),
      vibe: cleanText(rule.vibe, FIELD_LIMITS.short),
      suggestion: cleanText(rule.suggestion, FIELD_LIMITS.suggestion),
    })),
  };
}

function getErrorMessage(error) {
  const data = error.response?.data;
  const validationErrors = Array.isArray(data?.errors)
    ? data.errors.filter((item) => typeof item === "string").join(" ")
    : "";
  const candidate =
    validationErrors ||
    (typeof data?.message === "string" ? data.message : "") ||
    (typeof data?.error === "string" ? data.error : "") ||
    (typeof error?.message === "string" ? error.message : "");

  return cleanText(candidate, 240) || "Something went wrong. Please try again.";
}

export function validateForm(form) {
  if (!cleanText(form.widgetTitle, FIELD_LIMITS.title)) return "Add a title for Ami Pulse.";
  if (!getValidatedTimezone(form.ownerTimezone)) return "Enter a valid IANA timezone, such as Asia/Kolkata.";

  const latitudeText = String(form.ownerLatitude ?? "").trim();
  const longitudeText = String(form.ownerLongitude ?? "").trim();
  if (Boolean(latitudeText) !== Boolean(longitudeText)) {
    return "Enter both latitude and longitude, or leave both blank.";
  }
  if (latitudeText) {
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return "Latitude must be between -90 and 90.";
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return "Longitude must be between -180 and 180.";
    }
  }

  if (form.scheduleRules.length > MAX_RULES) return `Use no more than ${MAX_RULES} schedule rules.`;
  const invalidRule = form.scheduleRules.find((rule) => {
    const startHourText = String(rule.startHour ?? "").trim();
    const endHourText = String(rule.endHour ?? "").trim();
    const startHour = Number(rule.startHour);
    const endHour = Number(rule.endHour);
    return (
      !startHourText ||
      !endHourText ||
      !Number.isInteger(startHour) ||
      !Number.isInteger(endHour) ||
      startHour < 0 ||
      startHour > 23 ||
      endHour < 0 ||
      endHour > 23
    );
  });

  if (invalidRule) return "Every schedule hour is required and must be a whole number from 0 to 23.";

  const occupiedHours = new Set();
  for (const rule of form.scheduleRules) {
    const startHour = Number(rule.startHour);
    const endHour = Number(rule.endHour);

    for (let hour = 0; hour < 24; hour += 1) {
      const matches =
        startHour === endHour ||
        (startHour < endHour
          ? hour >= startHour && hour < endHour
          : hour >= startHour || hour < endHour);
      if (!matches) continue;
      if (occupiedHours.has(hour)) return "Schedule rules cannot overlap.";
      occupiedHours.add(hour);
    }
  }

  return "";
}

export default function PulseSettings() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const authHeaders = getAuthHeaders();

    if (!authHeaders) {
      setError("Your admin session has expired. Sign in again to continue.");
      setLoading(false);
      return () => controller.abort();
    }

    axios
      .get(apiUrl("/api/pulse/admin"), {
        signal: controller.signal,
        headers: authHeaders,
      })
      .then((response) => {
        if (response.data?.data) {
          setForm(toForm(response.data.data));
        }
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const setRuleField = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      scheduleRules: previous.scheduleRules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [field]: value } : rule,
      ),
    }));
  };

  const addRule = () => {
    setForm((previous) => ({
      ...previous,
      scheduleRules:
        previous.scheduleRules.length >= MAX_RULES
          ? previous.scheduleRules
          : [...previous.scheduleRules, { ...EMPTY_RULE, _key: createRuleKey() }],
    }));
  };

  const removeRule = (index) => {
    setForm((previous) => ({
      ...previous,
      scheduleRules: previous.scheduleRules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

  const handleUseCurrentLocation = () => {
    setError("");
    setSuccess("Detecting current location...");

    if (!navigator.geolocation) {
      setSuccess("");
      setError("Geolocation is not available in this browser. Use HTTPS or localhost and try again.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);

        setForm((previous) => ({
          ...previous,
          ownerLatitude: latitude,
          ownerLongitude: longitude,
          ownerTimezone: previous.ownerTimezone || DEFAULT_FORM.ownerTimezone,
        }));
        setSuccess(`Coordinates captured: ${latitude}, ${longitude}. Looking up city details...`);

        try {
          const authHeaders = getAuthHeaders();
          if (!authHeaders) throw new Error("Your admin session has expired. Sign in again to continue.");

          const response = await axios.get(apiUrl("/api/pulse/admin/reverse-geocode"), {
            headers: authHeaders,
            params: {
              lat: latitude,
              lon: longitude,
            },
          });
          const location = response.data?.data || {};
          const nextLabel =
            location.locationLabel ||
            [location.ownerCity, location.ownerCountry].filter(Boolean).join(", ");

          setForm((previous) => ({
            ...previous,
            ownerCity: location.ownerCity || previous.ownerCity,
            ownerRegion: location.ownerRegion || previous.ownerRegion,
            ownerCountry: location.ownerCountry || previous.ownerCountry,
            locationLabel: nextLabel || previous.locationLabel,
          }));
          setSuccess(
            nextLabel
              ? `Current location detected as ${nextLabel}. Review the fields and save.`
              : "Coordinates captured. Review the location fields and save.",
          );
        } catch {
          setSuccess(
            `Coordinates captured: ${latitude}, ${longitude}. City lookup failed, so edit the city fields manually before saving.`,
          );
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setSuccess("");
        setError(getGeolocationErrorMessage(geoError));
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (locating) {
      setError("Wait for current location detection to finish before saving.");
      return;
    }

    const validationMessage = validateForm(form);
    if (validationMessage) {
      setError(validationMessage);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) throw new Error("Your admin session has expired. Sign in again to continue.");

      const response = await axios.put(apiUrl("/api/pulse/admin"), buildPayload(form), {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      if (response.data?.data) {
        setForm(toForm(response.data.data));
      }

      setSuccess(response.data?.message || "Ami Pulse updated successfully");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950 dark:bg-black dark:text-white"
        role="status"
        aria-label="Loading Ami Pulse settings"
      >
        <LoaderCircle className="h-8 w-8 animate-spin text-teal-600 dark:text-cyan-200" aria-hidden="true" />
        <span className="sr-only">Loading Ami Pulse settings…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc,#ecfdf5_42%,#fff7ed_78%,#f1f5f9)] px-4 py-8 text-slate-950 dark:bg-[radial-gradient(circle_at_12%_0%,rgba(6,182,212,0.14),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(244,63,94,0.1),transparent_28%),linear-gradient(180deg,#050505_0%,#09090b_52%,#000000_100%)] dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/75 bg-white/82 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.12)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-zinc-800 dark:bg-black/90 dark:shadow-[0_24px_62px_-42px_rgba(0,0,0,0.98)] dark:ring-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:text-zinc-300 dark:hover:text-cyan-100 dark:focus-visible:ring-cyan-300/70"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 ring-1 ring-teal-200/70 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-300/20">
                <Settings2 className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">Ami Pulse Settings</h1>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="pulse-settings-form"
            disabled={saving || locating}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-cyan-300 dark:text-zinc-950 dark:shadow-[0_18px_36px_-24px_rgba(103,232,249,0.65)] dark:hover:bg-cyan-200"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        </div>

        {error ? (
          <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/30 dark:bg-red-950/35 dark:text-red-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-950/35 dark:text-emerald-100">
            {success}
          </div>
        ) : null}

        <form id="pulse-settings-form" onSubmit={handleSubmit} className="space-y-6">
          <section className={panelClassName}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold tracking-normal">Basic</h2>
              <label className="inline-flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(event) => setField("isEnabled", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-cyan-300"
                />
                Ami Pulse enabled
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClassName}>
                Ami Pulse title
                <input
                  className={fieldClassName}
                  value={form.widgetTitle}
                  maxLength={FIELD_LIMITS.title}
                  onChange={(event) => setField("widgetTitle", event.target.value)}
                />
              </label>

              <div role="group" aria-labelledby="ami-pulse-mode-label">
                <span id="ami-pulse-mode-label" className={labelClassName}>Mode</span>
                <div className="mt-1.5 grid grid-cols-2 rounded-xl border border-slate-200/80 bg-white/70 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                  {["auto", "manual"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setField("mode", mode)}
                      aria-pressed={form.mode === mode}
                      className={`rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition ${
                        form.mode === mode
                          ? "bg-slate-950 text-white shadow-sm dark:bg-cyan-300 dark:text-zinc-950"
                          : "text-slate-600 hover:bg-white/80 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={panelClassName}>
            <h2 className="mb-5 text-lg font-bold tracking-normal">Manual Status Values</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClassName}>
                Manual status/current mode
                <input
                  className={fieldClassName}
                  value={form.manualStatus}
                  maxLength={FIELD_LIMITS.status}
                  onChange={(event) => setField("manualStatus", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Manual mood
                <input
                  className={fieldClassName}
                  value={form.manualMood}
                  maxLength={FIELD_LIMITS.short}
                  onChange={(event) => setField("manualMood", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Manual vibe
                <input
                  className={fieldClassName}
                  value={form.manualVibe}
                  maxLength={FIELD_LIMITS.short}
                  onChange={(event) => setField("manualVibe", event.target.value)}
                />
              </label>
              <label className={`${labelClassName} md:col-span-2`}>
                Manual suggestion
                <textarea
                  className={`${fieldClassName} min-h-24 resize-y`}
                  value={form.manualSuggestion}
                  maxLength={FIELD_LIMITS.suggestion}
                  onChange={(event) => setField("manualSuggestion", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={panelClassName}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold tracking-normal">Owner Location</h2>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:-translate-y-0.5 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-65 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-100 dark:hover:bg-cyan-300/15 sm:w-auto"
              >
                {locating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
                {locating ? "Detecting current location..." : "Use my current location"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className={`${labelClassName} md:col-span-2 lg:col-span-3`}>
                Location label
                <input
                  className={fieldClassName}
                  value={form.locationLabel}
                  maxLength={FIELD_LIMITS.location}
                  onChange={(event) => setField("locationLabel", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner city
                <input
                  className={fieldClassName}
                  value={form.ownerCity}
                  maxLength={FIELD_LIMITS.short}
                  onChange={(event) => setField("ownerCity", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner region
                <input
                  className={fieldClassName}
                  value={form.ownerRegion}
                  maxLength={FIELD_LIMITS.short}
                  onChange={(event) => setField("ownerRegion", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner country
                <input
                  className={fieldClassName}
                  value={form.ownerCountry}
                  maxLength={FIELD_LIMITS.short}
                  onChange={(event) => setField("ownerCountry", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner latitude
                <input
                  className={fieldClassName}
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={form.ownerLatitude}
                  onChange={(event) => setField("ownerLatitude", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner longitude
                <input
                  className={fieldClassName}
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={form.ownerLongitude}
                  onChange={(event) => setField("ownerLongitude", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner timezone
                <input
                  className={fieldClassName}
                  value={form.ownerTimezone}
                  maxLength={FIELD_LIMITS.timezone}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(event) => setField("ownerTimezone", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={panelClassName}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold tracking-normal">
                  <Clock3 className="h-4 w-4" />
                  Schedule Rules
                </h2>
              </div>
              <button
                type="button"
                onClick={addRule}
                disabled={form.scheduleRules.length >= MAX_RULES}
                title={form.scheduleRules.length >= MAX_RULES ? `Maximum ${MAX_RULES} rules` : undefined}
                className={secondaryButtonClassName}
              >
                <Plus className="h-4 w-4" />
                Add rule
              </button>
            </div>

            <div className="space-y-4">
              {form.scheduleRules.length ? (
                form.scheduleRules.map((rule, index) => (
                  <div
                    key={rule._key}
                    className={insetPanelClassName}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                        Rule {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:text-red-200 dark:hover:bg-red-500/15 dark:focus-visible:ring-red-300/30"
                        aria-label={`Remove rule ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                      <label className={labelClassName}>
                        Start hour
                        <input
                          className={fieldClassName}
                          type="number"
                          min="0"
                          max="23"
                          step="1"
                          required
                          value={rule.startHour}
                          onChange={(event) => setRuleField(index, "startHour", event.target.value)}
                        />
                      </label>
                      <label className={labelClassName}>
                        End hour
                        <input
                          className={fieldClassName}
                          type="number"
                          min="0"
                          max="23"
                          step="1"
                          required
                          value={rule.endHour}
                          onChange={(event) => setRuleField(index, "endHour", event.target.value)}
                        />
                      </label>
                      <label className={`${labelClassName} lg:col-span-2`}>
                        Status
                        <input
                          className={fieldClassName}
                          value={rule.status}
                          maxLength={FIELD_LIMITS.status}
                          onChange={(event) => setRuleField(index, "status", event.target.value)}
                        />
                      </label>
                      <label className={labelClassName}>
                        Mood
                        <input
                          className={fieldClassName}
                          value={rule.mood}
                          maxLength={FIELD_LIMITS.short}
                          onChange={(event) => setRuleField(index, "mood", event.target.value)}
                        />
                      </label>
                      <label className={labelClassName}>
                        Vibe
                        <input
                          className={fieldClassName}
                          value={rule.vibe}
                          maxLength={FIELD_LIMITS.short}
                          onChange={(event) => setRuleField(index, "vibe", event.target.value)}
                        />
                      </label>
                      <label className={`${labelClassName} md:col-span-2 lg:col-span-6`}>
                        Suggestion
                        <textarea
                          className={`${fieldClassName} min-h-20 resize-y`}
                          value={rule.suggestion}
                          maxLength={FIELD_LIMITS.suggestion}
                          onChange={(event) => setRuleField(index, "suggestion", event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/55 p-5 text-sm font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/55 dark:text-zinc-300">
                  No schedule rules configured.
                </div>
              )}
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
