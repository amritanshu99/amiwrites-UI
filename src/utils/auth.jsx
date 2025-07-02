// src/utils/auth.js
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const [, payload] = token.split('.');
    const { exp } = JSON.parse(atob(payload));
    return Date.now() >= exp * 1000;
  } catch {
    return true; // if token is malformed
  }
};
