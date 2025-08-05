import api from './api'

export const fetchWeeklyNote = (clientId, platformId, week) => {
  return api
    .get(
      `/clients/${clientId}/platforms/${platformId}/weekly-notes/${week}`
    )
    .then(r => r.data)
}

export const fetchWeeklyNotes = (clientId, platformId) => {
  return api
    .get(`/clients/${clientId}/platforms/${platformId}/weekly-notes`)
    .then(r => r.data)
}

export const createWeeklyNote = (clientId, platformId, data) => {
  const formData = new FormData()
  formData.append('week', data.week)
  formData.append('text', data.text || '')
  ;(data.images || []).forEach(f => {
    const file = f.raw || f.file || f
    formData.append('images', file)
  })
  return api
    .post(
      `/clients/${clientId}/platforms/${platformId}/weekly-notes`,
      formData
    )
    .then(r => r.data)
}

export const updateWeeklyNote = (clientId, platformId, week, data) => {
  const formData = new FormData()
  formData.append('text', data.text || '')
  ;(data.images || []).forEach(f => {
    const file = f.raw || f.file || f
    formData.append('images', file)
  })
  if (Array.isArray(data.keepImages)) {
    if (data.keepImages.length) {
      data.keepImages.forEach(i => formData.append('keepImages', i))
    } else {
      formData.append('keepImages', '')
    }
  }
  return api
    .put(
      `/clients/${clientId}/platforms/${platformId}/weekly-notes/${week}`,
      formData
    )
    .then(r => r.data)
}

export const getWeeklyNoteImageUrl = (clientId, platformId, path) => {
  return api
    .get(
      `/clients/${clientId}/platforms/${platformId}/weekly-notes/image-url`,
      { params: { path } }
    )
    .then(r => r.data.url)
}
