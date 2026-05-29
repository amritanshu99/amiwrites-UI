// src/api/authApi.js
import axios from 'axios';
import { apiUrl } from "../config/api";

export const verifyToken = async (token) => {
  try {
    const res = await axios.post(
      apiUrl("/api/auth/verify-token"),
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data.valid; // backend must return { valid: true } or 401
  } catch {
    return false;
  }
};
