import api from "./api.js"

export async function getMyNotifications() {
  const response =
    await api.get(
      "/notifications",
    )

  return response.data
}

export async function markNotificationRead(
  notificationId,
) {
  const response =
    await api.patch(
      `/notifications/${notificationId}/read`,
    )

  return response.data
}

export async function markAllNotificationsRead() {
  const response =
    await api.patch(
      "/notifications/read-all",
    )

  return response.data
}
