export const parseJwt = (token) => {
  if (typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;

    const normalizedPayload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(paddedPayload));

    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload
      : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = parseJwt(token);
  const expiresAt = Number(payload?.exp);

  return !Number.isFinite(expiresAt) || Date.now() >= expiresAt * 1000;
};
