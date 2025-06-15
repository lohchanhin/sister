import api from './api'

export const fetchWeeklyNote = (clientId, platformId, week) =>
  api.get(`/clients/${clientId}/platforms/${platformId}/weekly-notes/${week}`).then(r => r.data)

export const fetchWeeklyNotes = (clientId, platformId) =>
  api.get(`/clients/${clientId}/platforms/${platformId}/weekly-notes`).then(r => r.data)

export const createWeeklyNote = (clientId, platformId, data) => {
  const formData = new FormData()
  formData.append('week', data.week)
  formData.append('text', data.text || '')
  ;(data.images || []).forEach(f => formData.append('images', f))
  return api.post(
    `/clients/${clientId}/platforms/${platformId}/weekly-notes`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ).then(r => r.data)
}

export const updateWeeklyNote = (clientId, platformId, week, data) => {
  const formData = new FormData()
  formData.append('text', data.text || '')
  ;(data.images || []).forEach(f => formData.append('images', f))
  return api.put(
    `/clients/${clientId}/platforms/${platformId}/weekly-notes/${week}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ).then(r => r.data)
}
