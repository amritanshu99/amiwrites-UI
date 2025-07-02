// src/api/authApi.js
import axios from 'axios';

export const verifyToken = async (token) => {
  try {
    const res = await axios.post(
      'https://amiwrites-backend-app-1.onrender.com/api/auth/verify-token',
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
