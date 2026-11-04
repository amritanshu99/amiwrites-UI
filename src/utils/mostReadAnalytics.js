import { apiUrl } from "../config/api";

export const MIN_READ_MS = 30_000;
export const MOST_READ_SINCE_LABEL = "4 Nov 2026";
const READER_KEY = "amiverse:reader:v1";
let memoryReaderId;

export function getReaderId() {
  try {
    const stored = window.localStorage.getItem(READER_KEY);
    if (stored && /^[a-z0-9][a-z0-9._:-]{15,127}$/i.test(stored)) return stored;
  } catch { /* Private browsing may disable storage. */ }
  if (!memoryReaderId) {
    memoryReaderId = window.crypto?.randomUUID?.() ||
      `reader_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  }
  try { window.localStorage.setItem(READER_KEY, memoryReaderId); } catch { /* Keep this page's identity. */ }
  return memoryReaderId;
}

export async function sendQualifiedRead(postId, dwellMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await window.fetch(apiUrl("/api/most-read/reads"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, readerId: getReaderId(), dwell_ms: Math.min(21_600_000, Math.round(dwellMs)) }),
      credentials: "omit",
      keepalive: true,
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error("Read could not be recorded");
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
