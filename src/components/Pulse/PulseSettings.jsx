import React, { useEffect, useMemo, useState } from "react";
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

const DEFAULT_FORM = {
  isEnabled: true,
  widgetTitle: "Ami Pulse",
  mode: "auto",
  manualStatus: "Building Amiverse",
  manualMood: "Focused",
  manualVibe: "Future-ready",
  manualSuggestion: "Small progress compounds daily.",
  ownerCity: "Greater Noida",
  ownerRegion: "Uttar Pradesh",
  ownerCountry: "India",
  ownerLatitude: "28.4744",
  ownerLongitude: "77.5040",
  ownerTimezone: "Asia/Kolkata",
  locationLabel: "Greater Noida, India",
  scheduleRules: [],
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
  "mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/82 px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-cyan-200/60 dark:focus:ring-cyan-200/10";

const labelClassName = "block text-sm font-semibold text-slate-700 dark:text-zinc-200";

function normalizePulseTitle(title) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) return DEFAULT_FORM.widgetTitle;
  if (/^(amiverse\s+)?(beacon|pulse)$/i.test(normalizedTitle)) return DEFAULT_FORM.widgetTitle;
  return normalizedTitle;
}

function normalizeRule(rule) {
  return {
    startHour: rule?.startHour ?? "",
    endHour: rule?.endHour ?? "",
    status: rule?.status || "",
    mood: rule?.mood || "",
    vibe: rule?.vibe || "",
    suggestion: rule?.suggestion || "",
  };
}

function toForm(data) {
  return {
    ...DEFAULT_FORM,
    ...data,
    isEnabled: Boolean(data?.isEnabled),
    widgetTitle: normalizePulseTitle(data?.widgetTitle),
    ownerLatitude:
      data?.ownerLatitude === undefined || data?.ownerLatitude === null
        ? ""
        : String(data.ownerLatitude),
    ownerLongitude:
      data?.ownerLongitude === undefined || data?.ownerLongitude === null
        ? ""
        : String(data.ownerLongitude),
    ownerTimezone: data?.ownerTimezone || DEFAULT_FORM.ownerTimezone,
    scheduleRules: Array.isArray(data?.scheduleRules)
      ? data.scheduleRules.map(normalizeRule)
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
    widgetTitle: form.widgetTitle,
    mode: form.mode,
    manualStatus: form.manualStatus,
    manualMood: form.manualMood,
    manualVibe: form.manualVibe,
    manualSuggestion: form.manualSuggestion,
    ownerCity: form.ownerCity,
    ownerRegion: form.ownerRegion,
    ownerCountry: form.ownerCountry,
    ownerLatitude: coordinateToPayload(form.ownerLatitude),
    ownerLongitude: coordinateToPayload(form.ownerLongitude),
    ownerTimezone: form.ownerTimezone || DEFAULT_FORM.ownerTimezone,
    locationLabel: form.locationLabel,
    scheduleRules: form.scheduleRules.map((rule) => ({
      startHour: hourToPayload(rule.startHour),
      endHour: hourToPayload(rule.endHour),
      status: rule.status,
      mood: rule.mood,
      vibe: rule.vibe,
      suggestion: rule.suggestion,
    })),
  };
}

function getErrorMessage(error) {
  const data = error.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join(" ");
  return data?.message || data?.error || error.message || "Something went wrong";
}

function getGeolocationErrorMessage(error) {
  if (!error || typeof error.code !== "number") {
    return "Current location could not be detected. Please try again.";
  }

  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Allow location access for this site and try again.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Current location is unavailable. Check device location services and try again.";
  }

  if (error.code === error.TIMEOUT) {
    return "Location detection timed out. Move near a clearer signal or try again.";
  }

  return "Current location could not be detected. Please try again.";
}

export default function PulseSettings() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    const controller = new AbortController();

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
  }, [authHeaders]);

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
      scheduleRules: [...previous.scheduleRules, { ...EMPTY_RULE }],
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

    setSaving(true);
    setError("");
    setSuccess("");

    try {
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950 dark:bg-black dark:text-white">
        <LoaderCircle className="h-8 w-8 animate-spin text-teal-600 dark:text-cyan-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc,#ecfdf5_42%,#fff7ed_78%,#f1f5f9)] px-4 py-8 text-slate-950 dark:bg-[linear-gradient(135deg,#030712,#092f2d_42%,#3b1020_78%,#09090b)] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/72 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.12)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-[0_18px_50px_rgba(0,0,0,0.45)] dark:ring-cyan-100/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:text-zinc-300 dark:hover:text-cyan-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-cyan-200/12 dark:text-cyan-100">
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-cyan-200 dark:text-slate-950 dark:hover:bg-emerald-200"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
            {success}
          </div>
        ) : null}

        <form id="pulse-settings-form" onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-white/70 bg-white/72 p-5 shadow-sm ring-1 ring-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/68 dark:ring-cyan-100/10 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold tracking-normal">Basic</h2>
              <label className="inline-flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white/74 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(event) => setField("isEnabled", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
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
                  onChange={(event) => setField("widgetTitle", event.target.value)}
                />
              </label>

              <div>
                <span className={labelClassName}>Mode</span>
                <div className="mt-1.5 grid grid-cols-2 rounded-xl border border-slate-200/80 bg-white/64 p-1 dark:border-white/10 dark:bg-white/[0.04]">
                  {["auto", "manual"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setField("mode", mode)}
                      className={`rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition ${
                        form.mode === mode
                          ? "bg-slate-950 text-white shadow-sm dark:bg-cyan-200 dark:text-slate-950"
                          : "text-slate-600 hover:bg-white/80 dark:text-zinc-300 dark:hover:bg-white/[0.07]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/70 bg-white/72 p-5 shadow-sm ring-1 ring-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/68 dark:ring-cyan-100/10 sm:p-6">
            <h2 className="mb-5 text-lg font-bold tracking-normal">Manual Status Values</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClassName}>
                Manual status/current mode
                <input
                  className={fieldClassName}
                  value={form.manualStatus}
                  onChange={(event) => setField("manualStatus", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Manual mood
                <input
                  className={fieldClassName}
                  value={form.manualMood}
                  onChange={(event) => setField("manualMood", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Manual vibe
                <input
                  className={fieldClassName}
                  value={form.manualVibe}
                  onChange={(event) => setField("manualVibe", event.target.value)}
                />
              </label>
              <label className={`${labelClassName} md:col-span-2`}>
                Manual suggestion
                <textarea
                  className={`${fieldClassName} min-h-24 resize-y`}
                  value={form.manualSuggestion}
                  onChange={(event) => setField("manualSuggestion", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/70 bg-white/72 p-5 shadow-sm ring-1 ring-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/68 dark:ring-cyan-100/10 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold tracking-normal">Owner Location</h2>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:-translate-y-0.5 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-65 dark:border-cyan-200/20 dark:bg-cyan-200/10 dark:text-cyan-100 dark:hover:bg-cyan-200/14 sm:w-auto"
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
                  onChange={(event) => setField("locationLabel", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner city
                <input
                  className={fieldClassName}
                  value={form.ownerCity}
                  onChange={(event) => setField("ownerCity", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner region
                <input
                  className={fieldClassName}
                  value={form.ownerRegion}
                  onChange={(event) => setField("ownerRegion", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner country
                <input
                  className={fieldClassName}
                  value={form.ownerCountry}
                  onChange={(event) => setField("ownerCountry", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner latitude
                <input
                  className={fieldClassName}
                  type="number"
                  step="0.000001"
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
                  value={form.ownerLongitude}
                  onChange={(event) => setField("ownerLongitude", event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                Owner timezone
                <input
                  className={fieldClassName}
                  value={form.ownerTimezone}
                  onChange={(event) => setField("ownerTimezone", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/70 bg-white/72 p-5 shadow-sm ring-1 ring-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/68 dark:ring-cyan-100/10 sm:p-6">
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
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/76 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.1] sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Add rule
              </button>
            </div>

            <div className="space-y-4">
              {form.scheduleRules.length ? (
                form.scheduleRules.map((rule, index) => (
                  <div
                    key={`${index}-${rule.status}`}
                    className="rounded-2xl border border-slate-200/75 bg-white/68 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.045]"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                        Rule {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:text-red-200 dark:hover:bg-red-400/10"
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
                          value={rule.endHour}
                          onChange={(event) => setRuleField(index, "endHour", event.target.value)}
                        />
                      </label>
                      <label className={`${labelClassName} lg:col-span-2`}>
                        Status
                        <input
                          className={fieldClassName}
                          value={rule.status}
                          onChange={(event) => setRuleField(index, "status", event.target.value)}
                        />
                      </label>
                      <label className={labelClassName}>
                        Mood
                        <input
                          className={fieldClassName}
                          value={rule.mood}
                          onChange={(event) => setRuleField(index, "mood", event.target.value)}
                        />
                      </label>
                      <label className={labelClassName}>
                        Vibe
                        <input
                          className={fieldClassName}
                          value={rule.vibe}
                          onChange={(event) => setRuleField(index, "vibe", event.target.value)}
                        />
                      </label>
                      <label className={`${labelClassName} md:col-span-2 lg:col-span-6`}>
                        Suggestion
                        <textarea
                          className={`${fieldClassName} min-h-20 resize-y`}
                          value={rule.suggestion}
                          onChange={(event) => setRuleField(index, "suggestion", event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-5 text-sm font-semibold text-slate-600 dark:border-white/15 dark:bg-white/[0.035] dark:text-zinc-300">
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
