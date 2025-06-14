import api from './api'

export const fetchDaily = (clientId, platformId) =>
  api.get(`/clients/${clientId}/platforms/${platformId}/ad-daily`).then(r => r.data)

export const createDaily = (clientId, platformId, data) =>
  api.post(`/clients/${clientId}/platforms/${platformId}/ad-daily`, data).then(r => r.data)

export const fetchWeekly = (clientId, platformId) =>
  api.get(`/clients/${clientId}/platforms/${platformId}/ad-daily/weekly`).then(r => r.data)
