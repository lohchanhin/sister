import api from './api'

export const fetchDaily = clientId =>
  api.get(`/clients/${clientId}/ad-daily`).then(r => r.data)

export const createDaily = (clientId, data) =>
  api.post(`/clients/${clientId}/ad-daily`, data).then(r => r.data)

export const fetchWeekly = clientId =>
  api.get(`/clients/${clientId}/ad-daily/weekly`).then(r => r.data)
