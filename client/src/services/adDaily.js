import api from './api'

export const fetchDaily = clientId =>
  api.get('/ad-daily', { params: { clientId } }).then(r => r.data)

export const createDaily = data =>
  api.post('/ad-daily', data).then(r => r.data)

export const fetchWeekly = clientId =>
  api.get('/ad-daily/weekly', { params: { clientId } }).then(r => r.data)
