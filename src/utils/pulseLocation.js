import axios from "axios";
import { apiUrl } from "../config/api";

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

function createPulseLocationError(code, message, cause) {
  const error = new Error(message);
  error.pulseLocationCode = code;
  if (cause) error.cause = cause;
  return error;
}

function getBrowserGeolocation() {
  return typeof navigator === "undefined" ? null : navigator.geolocation;
}

function getCurrentPosition(geolocation) {
  if (!geolocation?.getCurrentPosition) {
    return Promise.reject(
      createPulseLocationError(
        "unsupported",
        "Geolocation is not available in this browser.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, reject, GEOLOCATION_OPTIONS);
  });
}

function normalizeCoordinate(value, min, max, label) {
  if (value === null || value === undefined || value === "") {
    throw createPulseLocationError(
      "invalid-position",
      `The browser returned an invalid ${label}.`,
    );
  }

  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    throw createPulseLocationError(
      "invalid-position",
      `The browser returned an invalid ${label}.`,
    );
  }

  return Number(coordinate.toFixed(6));
}

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function ensureCurrentAdminSession(token) {
  if (
    typeof window !== "undefined" &&
    window.localStorage.getItem("token") !== token
  ) {
    throw createPulseLocationError(
      "session-changed",
      "The admin session changed before the location update completed.",
    );
  }
}

export function getGeolocationErrorMessage(error) {
  if (error?.pulseLocationCode === "unsupported") {
    return "Geolocation is not available in this browser. Use HTTPS or localhost and try again.";
  }

  if (error?.pulseLocationCode === "session-changed") {
    return "Ami Pulse location was not changed because the admin session ended.";
  }

  if (error?.pulseLocationCode === "lookup-failed") {
    return "Your position was detected, but its city could not be identified. Ami Pulse was not changed.";
  }

  if (error?.pulseLocationCode === "update-failed") {
    return "Your location was detected, but Ami Pulse could not be updated. Try again from Pulse settings.";
  }

  if (!error || typeof error.code !== "number") {
    return "Current location could not be detected. Please try again.";
  }

  if (error.code === error.PERMISSION_DENIED || error.code === 1) {
    return "Location permission was denied. Allow location access for this site and try again.";
  }

  if (error.code === error.POSITION_UNAVAILABLE || error.code === 2) {
    return "Current location is unavailable. Check device location services and try again.";
  }

  if (error.code === error.TIMEOUT || error.code === 3) {
    return "Location detection timed out. Move near a clearer signal or try again.";
  }

  return "Current location could not be detected. Please try again.";
}

export async function updatePulseLocationFromBrowser(
  token,
  { geolocation = getBrowserGeolocation(), client = axios } = {},
) {
  if (typeof token !== "string" || !token) {
    throw createPulseLocationError(
      "session-changed",
      "An authenticated admin session is required.",
    );
  }

  const position = await getCurrentPosition(geolocation);
  const latitude = normalizeCoordinate(
    position?.coords?.latitude,
    -90,
    90,
    "latitude",
  );
  const longitude = normalizeCoordinate(
    position?.coords?.longitude,
    -180,
    180,
    "longitude",
  );
  const authHeaders = { Authorization: `Bearer ${token}` };

  ensureCurrentAdminSession(token);

  let location;
  try {
    const response = await client.get(
      apiUrl("/api/pulse/admin/reverse-geocode"),
      {
        headers: authHeaders,
        params: { lat: latitude, lon: longitude },
      },
    );
    location = response.data?.data;
  } catch (error) {
    throw createPulseLocationError(
      "lookup-failed",
      "The current city could not be identified.",
      error,
    );
  }

  const ownerCity = String(location?.ownerCity || "").trim();
  const ownerRegion = String(location?.ownerRegion || "").trim();
  const ownerCountry = String(location?.ownerCountry || "").trim();
  const locationLabel = String(
    location?.locationLabel ||
      [ownerCity, ownerCountry].filter(Boolean).join(", "),
  ).trim();

  if (!locationLabel) {
    throw createPulseLocationError(
      "lookup-failed",
      "The current city could not be identified.",
    );
  }

  const payload = {
    ownerLatitude: latitude,
    ownerLongitude: longitude,
    ownerCity,
    ownerRegion,
    ownerCountry,
    locationLabel,
  };
  const ownerTimezone = getBrowserTimezone();
  if (ownerTimezone) payload.ownerTimezone = ownerTimezone;

  ensureCurrentAdminSession(token);

  try {
    await client.put(apiUrl("/api/pulse/admin"), payload, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });
  } catch (error) {
    throw createPulseLocationError(
      "update-failed",
      "Ami Pulse could not be updated.",
      error,
    );
  }

  return payload;
}
