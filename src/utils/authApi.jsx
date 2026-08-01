// src/api/authApi.js
import axios from 'axios';
import { apiUrl } from "../config/api";

export const verifyToken = async (token) => {
  if (typeof token !== "string" || !token || token.length > 8192) return false;

  try {
    const res = await axios.post(
      apiUrl("/api/auth/verify-token"),
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return res.data?.valid === true;
  } catch {
    return false;
  }
};
