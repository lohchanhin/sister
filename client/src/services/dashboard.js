import api from './api'

export const fetchDailyData = days =>
  api.get('/dashboard/daily', { params: { days } }).then(r => r.data)
