// src/services/notifications.js
import api from "./api";

// Derive backend root from your api axios instance (which likely uses baseURL ".../api/v1")
const API_ROOT = (api.defaults && api.defaults.baseURL)
  ? api.defaults.baseURL.replace(/\/api\/v1\/?$/, "")
  : "http://localhost:8080";

function getAuthHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
  } catch (e) {
    return {};
  }
}

/**
 * Fetch notifications for the logged-in user (backend: GET /api/notifications/me)
 * Returns an axios Response (res.data expected to be an array of notifications)
 */
export async function fetchNotifications() {
  return api.get(`${API_ROOT}/api/notifications/me`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
}

/**
 * Mark a notification as seen (backend: POST /api/notifications/markSeen/{id})
 */
export async function markNotificationSeen(id) {
  return api.post(`${API_ROOT}/api/notifications/markSeen/${id}`, null, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
}
