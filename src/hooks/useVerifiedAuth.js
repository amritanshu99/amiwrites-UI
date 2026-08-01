import { useEffect, useState } from "react";
import { isTokenExpired, parseJwt } from "../utils/auth";
import { verifyToken } from "../utils/authApi";

const ADMIN_USERNAME = "amritanshu99";
const MAX_TIMEOUT_MS = 2_147_483_647;

let inFlightVerification = null;

const getStoredToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem("token");

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

  return {
    isAuthenticated: localAuth.isAuthenticated,
    username: localAuth.username,
    isAdmin: false,
    isVerifyingAdmin: false,
    verifiedAdminToken: null,
  };
};

const verifyAdminCandidate = (token) => {
  if (inFlightVerification?.token === token) {
    return inFlightVerification.promise;
  }

  const promise = Promise.resolve(verifyToken(token))
    .then((result) => result === true)
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

      publish({
        isAuthenticated: localAuth.isAuthenticated,
        username: localAuth.username,
        isAdmin: false,
        isVerifyingAdmin: isAdminCandidate,
        verifiedAdminToken: null,
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

      if (!isAdminCandidate) return;

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

    const handleTokenChanged = () => {
      refresh();
    };
    const handleStorage = (event) => {
      if (event.key === null || event.key === "token") refresh();
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
