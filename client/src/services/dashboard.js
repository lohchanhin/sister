import api from './api'

export const fetchDailyData = (days, clientId, platformId) => {
  const params = { days }
  if (clientId) params.clientId = clientId
  if (platformId) params.platformId = platformId
  return api.get('/dashboard/daily', { params }).then(r => r.data)
}

export const fetchDashboardSummary = ({ page, pageSize } = {}) => {
  const params = {}
  if (page) params.page = page
  if (pageSize) params.pageSize = pageSize
  return api.get('/dashboard/summary', { params }).then(r => r.data)
}
