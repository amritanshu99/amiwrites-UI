import axios from "axios";
import { apiUrl } from "../../config/api";

export async function evalRequest(path, { method = "get", data, signal } = {}) {
  const token = localStorage.getItem("token");
  const response = await axios({
    url: apiUrl(`/api/amibot/admin/evals${path}`),
    method,
    data,
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    timeout: 180000,
  });
  return response.data;
}

export const evalError = (error) =>
  error.response?.data?.error ||
  "Could not reach evaluations. Check your connection and try again.";
export const percent = (value) =>
  value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`;
export const runDate = (value) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function compareRuns(current, previous) {
  if (
    !current ||
    !previous ||
    current.summary.status !== "completed" ||
    previous.summary.status !== "completed" ||
    current.evaluatorVersion !== previous.evaluatorVersion ||
    current.suiteFingerprint !== previous.suiteFingerprint
  )
    return null;
  return Math.round(
    (current.summary.passRate - previous.summary.passRate) * 100,
  );
}

export function downloadRun(run) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(run, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `amibot-eval-${run._id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
