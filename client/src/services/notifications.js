import api from './api'

export const fetchNotifications = (limit = 10) =>
  api.get('/assets/recent', { params: { limit } }).then(res => res.data)
