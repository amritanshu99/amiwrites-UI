import { useEffect, useState } from "react";
import { isTokenExpired, parseJwt } from "../utils/auth";
import { verifyToken } from "../utils/authApi";
import { ADMIN_USERNAME } from "../config/auth";

const MAX_TIMEOUT_MS = 2_147_483_647;
const ADMIN_VERIFICATION_MAX_AGE_MS = 30_000;

let inFlightVerification = null;
let verifiedAdminToken = null;
let verifiedAdminAtMs = 0;
let verificationGeneration = 0;
const invalidatedEvents = new WeakSet();

const getStoredToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem("token");

const hasVerifiedAdminToken = (token) => {
  if (!token || verifiedAdminToken !== token) return false;

  if (
    getStoredToken() !== token ||
    isTokenExpired(token) ||
    Date.now() - verifiedAdminAtMs > ADMIN_VERIFICATION_MAX_AGE_MS
  ) {
    verifiedAdminToken = null;
    verifiedAdminAtMs = 0;
    return false;
  }

  return true;
};

const invalidateAdminVerification = (event) => {
  // Every mounted auth consumer receives the same browser event. Invalidate it
  // once so their subsequent refreshes can still share one verification call.
  if (event && invalidatedEvents.has(event)) return;

  if (event) {
    invalidatedEvents.add(event);
    Promise.resolve().then(() => invalidatedEvents.delete(event));
  }

  verifiedAdminToken = null;
  verifiedAdminAtMs = 0;
  inFlightVerification = null;
  verificationGeneration += 1;
};

const getLocalAuth = () => {
  const token = getStoredToken();
  const decoded = parseJwt(token);
  const isAuthenticated = Boolean(token && decoded && !isTokenExpired(token));
  const username =
    isAuthenticated && typeof decoded?.username === "string"
      ? decoded.username
      : null;

  return { token, decoded, isAuthenticated, username };
};

const getInitialState = () => {
  const localAuth = getLocalAuth();
  const isAdminCandidate =
    localAuth.isAuthenticated && localAuth.username === ADMIN_USERNAME;
  const isAdmin =
    isAdminCandidate && hasVerifiedAdminToken(localAuth.token);

  return {
    isAuthenticated: localAuth.isAuthenticated,
    username: localAuth.username,
    isAdmin,
    isVerifyingAdmin: isAdminCandidate && !isAdmin,
    verifiedAdminToken: isAdmin ? localAuth.token : null,
  };
};

const verifyAdminCandidate = (token) => {
  if (hasVerifiedAdminToken(token)) return Promise.resolve(true);

  if (inFlightVerification?.token === token) {
    return inFlightVerification.promise;
  }

  const currentGeneration = verificationGeneration;
  const promise = Promise.resolve(verifyToken(token))
    .then((result) => {
      const isVerified = result === true;

      if (
        isVerified &&
        currentGeneration === verificationGeneration &&
        getStoredToken() === token &&
        !isTokenExpired(token)
      ) {
        verifiedAdminToken = token;
        verifiedAdminAtMs = Date.now();
      }

      return isVerified;
    })
    .catch(() => false)
    .finally(() => {
      if (inFlightVerification?.promise === promise) {
        inFlightVerification = null;
      }
    });

  inFlightVerification = { token, promise };
  return promise;
};

const statesMatch = (left, right) =>
  left.isAuthenticated === right.isAuthenticated &&
  left.username === right.username &&
  left.isAdmin === right.isAdmin &&
  left.isVerifyingAdmin === right.isVerifyingAdmin &&
  left.verifiedAdminToken === right.verifiedAdminToken;

export function useVerifiedAuth() {
  const [authState, setAuthState] = useState(getInitialState);

  useEffect(() => {
    let disposed = false;
    let requestVersion = 0;
    let expiryTimer = null;

    const publish = (nextState) => {
      if (disposed) return;
      setAuthState((previousState) =>
        statesMatch(previousState, nextState) ? previousState : nextState,
      );
    };

    const clearExpiryTimer = () => {
      if (expiryTimer !== null) {
        window.clearTimeout(expiryTimer);
        expiryTimer = null;
      }
    };

    const refresh = async () => {
      const currentVersion = ++requestVersion;
      clearExpiryTimer();

      const localAuth = getLocalAuth();
      const isAdminCandidate =
        localAuth.isAuthenticated &&
        localAuth.username === ADMIN_USERNAME;
      const hasCachedAdminVerification =
        isAdminCandidate && hasVerifiedAdminToken(localAuth.token);

      publish({
        isAuthenticated: localAuth.isAuthenticated,
        username: localAuth.username,
        isAdmin: hasCachedAdminVerification,
        isVerifyingAdmin:
          isAdminCandidate && !hasCachedAdminVerification,
        verifiedAdminToken: hasCachedAdminVerification
          ? localAuth.token
          : null,
      });

      if (!localAuth.isAuthenticated) return;

      const expiresAt = Number(localAuth.decoded?.exp) * 1000;
      const expiresIn = expiresAt - Date.now();
      if (Number.isFinite(expiresIn) && expiresIn > 0) {
        expiryTimer = window.setTimeout(
          refresh,
          Math.min(expiresIn + 50, MAX_TIMEOUT_MS),
        );
      }

      if (!isAdminCandidate || hasCachedAdminVerification) return;

      const isVerified = await verifyAdminCandidate(localAuth.token);
      const tokenIsCurrent = getStoredToken() === localAuth.token;

      if (
        disposed ||
        currentVersion !== requestVersion ||
        !tokenIsCurrent ||
        isTokenExpired(localAuth.token)
      ) {
        return;
      }

      publish(
        isVerified
          ? {
              isAuthenticated: true,
              username: localAuth.username,
              isAdmin: true,
              isVerifyingAdmin: false,
              verifiedAdminToken: localAuth.token,
            }
          : {
              isAuthenticated: false,
              username: null,
              isAdmin: false,
              isVerifyingAdmin: false,
              verifiedAdminToken: null,
            },
      );
    };

    const handleTokenChanged = (event) => {
      invalidateAdminVerification(event);
      refresh();
    };
    const handleStorage = (event) => {
      if (event.key === null || event.key === "token") {
        invalidateAdminVerification(event);
        refresh();
      }
    };

    refresh();
    window.addEventListener("tokenChanged", handleTokenChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      disposed = true;
      requestVersion += 1;
      clearExpiryTimer();
      window.removeEventListener("tokenChanged", handleTokenChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return authState;
}
