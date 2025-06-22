import api from './api'

export const fetchDailyData = (days, clientId, platformId) => {
  const params = { days }
  if (clientId) params.clientId = clientId
  if (platformId) params.platformId = platformId
  return api.get('/dashboard/daily', { params }).then(r => r.data)
}
