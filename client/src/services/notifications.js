import api from './api'

export const fetchNotifications = (limit = 10) =>
  api.get('/notifications', { params: { limit } }).then(res => res.data)

export const markNotificationsRead = (ids = []) =>
  api.patch('/notifications/read', { ids }).then(res => res.data)
