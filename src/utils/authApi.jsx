// src/api/authApi.js
import axios from 'axios';

export const verifyToken = async (token) => {
  debugger
  try {
    const res = await axios.post(
      'https://amiwrites-backend-app-2lp5.onrender.com/api/auth/verify-token',
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
