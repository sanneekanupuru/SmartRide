// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
      console.log(`[API] JWT Token sent for role ${user.role}:`, user.token);
    } else {
      console.log("[API] No JWT token found in localStorage");
    }
  } catch (err) {
    console.error("[API] Error reading token:", err);
  }
  return config;
});

export default api;

// ---- Named helpers for reviews + profiles ----
export const submitReview = (payload) => {
  // payload: { rideId, bookingId, revieweeId, rating, comment }
  return api.post("/reviews", payload);
};

export const fetchUserProfile = (userId) => api.get(`/users/${userId}`);
