import axios from "axios";
import { apiUrl } from "../config/api";
import { isTokenExpired, parseJwt } from "./auth";

const AUTH_REQUEST_TIMEOUT_MS = 10_000;
const MAX_APP_TOKEN_LENGTH = 8_192;
const MAX_GOOGLE_CREDENTIAL_LENGTH = 16_384;

export class AuthApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "AuthApiError";
    this.code = details.code || null;
    this.email = details.email || null;
    this.status = details.status || null;
  }
}

const toAuthApiError = (error, fallbackMessage) => {
  if (error instanceof AuthApiError) return error;

  const responseData = error?.response?.data;
  const message =
    responseData?.message ||
    responseData?.error ||
    (error?.code === "ECONNABORTED"
      ? "The request took too long. Please try again."
      : null) ||
    (error?.request ? "Unable to reach Amiverse. Check your connection and try again." : null) ||
    error?.message ||
    fallbackMessage;

  return new AuthApiError(message || fallbackMessage, {
    code: responseData?.code,
    email: responseData?.email,
    status: error?.response?.status,
  });
};

export const getValidAuthPayload = (token) => {
  if (
    typeof token !== "string" ||
    !token ||
    token.length > MAX_APP_TOKEN_LENGTH
  ) {
    return null;
  }

  const payload = parseJwt(token);
  if (
    !payload ||
    isTokenExpired(token) ||
    typeof payload.username !== "string" ||
    !payload.username.trim()
  ) {
    return null;
  }

  return payload;
};

const normalizeAuthResponse = (data) => {
  const token = typeof data?.token === "string" ? data.token.trim() : "";
  const payload = getValidAuthPayload(token);

  if (!payload) {
    throw new AuthApiError(
      "Amiverse returned an invalid session. Please try again.",
      { code: "INVALID_AUTH_RESPONSE" },
    );
  }

  return {
    token,
    payload,
    user: data?.user && typeof data.user === "object" ? data.user : null,
  };
};

const postForSession = async (path, body, fallbackMessage) => {
  try {
    const response = await axios.post(apiUrl(path), body, {
      timeout: AUTH_REQUEST_TIMEOUT_MS,
    });
    return normalizeAuthResponse(response.data);
  } catch (error) {
    throw toAuthApiError(error, fallbackMessage);
  }
};

export const loginWithPassword = async ({ identifier, password }) =>
  postForSession(
    "/api/auth/login",
    { identifier: identifier.trim(), password },
    "Unable to sign in. Please try again.",
  );

export const signupWithPassword = async ({ email, username, password }) =>
  postForSession(
    "/api/auth/signup",
    { email: email.trim().toLowerCase(), username: username.trim(), password },
    "Unable to create your account. Please try again.",
  );

export const continueWithGoogle = async ({ credential, password }) => {
  const normalizedCredential =
    typeof credential === "string" ? credential.trim() : "";

  if (
    !normalizedCredential ||
    normalizedCredential.length > MAX_GOOGLE_CREDENTIAL_LENGTH
  ) {
    throw new AuthApiError(
      "Google did not return a valid credential. Please try again.",
      { code: "INVALID_GOOGLE_CREDENTIAL" },
    );
  }

  return postForSession(
    "/api/auth/google",
    {
      credential: normalizedCredential,
      ...(typeof password === "string" && password ? { password } : {}),
    },
    "Unable to continue with Google. Please try again.",
  );
};

export const requestPasswordReset = async (email) => {
  try {
    await axios.post(
      apiUrl("/api/auth/request-reset"),
      { email: email.trim().toLowerCase() },
      { timeout: AUTH_REQUEST_TIMEOUT_MS },
    );
  } catch (error) {
    throw toAuthApiError(error, "Unable to send a reset link. Please try again.");
  }
};

export const verifyToken = async (token) => {
  if (typeof token !== "string" || !token || token.length > MAX_APP_TOKEN_LENGTH) {
    return false;
  }

  try {
    const response = await axios.post(
      apiUrl("/api/auth/verify-token"),
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: AUTH_REQUEST_TIMEOUT_MS,
      },
    );
    return response.data?.valid === true;
  } catch {
    return false;
  }
};
