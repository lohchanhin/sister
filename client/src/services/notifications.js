import api from './api'

export const fetchNotifications = (limit = 10) =>
  api.get('/notifications', { params: { limit } }).then(res => res.data)
