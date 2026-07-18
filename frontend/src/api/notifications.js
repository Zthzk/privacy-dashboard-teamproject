import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

export const NOTIFICATIONS_REFRESH_EVENT = 'notifications:refresh';

export function requestNotificationsRefresh() {
  // Mutation APIs emit this browser-local event after the backend has created
  // its notification, allowing the header badge to refresh immediately.
  window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
}

export async function getNotifications() {
  const response = await apiClient.get('/notifications/');
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await apiClient.patch(`/notifications/${notificationId}/read/`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await apiClient.post('/notifications/read-all/');
  return response.data;
}
