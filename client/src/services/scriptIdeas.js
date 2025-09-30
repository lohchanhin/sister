import api from './api'

export const SCRIPT_IDEA_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REVISION: 'revision'
})

const toFormData = (data = {}) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item))
      return
    }
    formData.append(key, value)
  })
  return formData
}

export const listScriptIdeas = (clientId, params = {}) =>
  api
    .get(`/clients/${clientId}/script-ideas`, { params })
    .then((res) => res.data)

export const createScriptIdea = (clientId, payload) => {
  const formData = toFormData(payload)
  return api
    .post(`/clients/${clientId}/script-ideas`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((res) => res.data)
}

export const updateScriptIdea = (clientId, ideaId, payload) => {
  const formData = toFormData(payload)
  return api
    .put(`/clients/${clientId}/script-ideas/${ideaId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((res) => res.data)
}

export const deleteScriptIdea = (clientId, ideaId) =>
  api
    .delete(`/clients/${clientId}/script-ideas/${ideaId}`)
    .then((res) => res.data)

export const getScriptIdea = (clientId, ideaId) =>
  api
    .get(`/clients/${clientId}/script-ideas/${ideaId}`)
    .then((res) => res.data)

export const uploadScriptIdeaVideo = (clientId, ideaId, file, extra = {}) => {
  const formData = toFormData({ ...extra, video: file })
  return api
    .post(`/clients/${clientId}/script-ideas/${ideaId}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((res) => res.data)
}
