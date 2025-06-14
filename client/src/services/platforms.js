import api from './api'

export const fetchPlatforms = clientId =>
  api.get(`/clients/${clientId}/platforms`).then(r => r.data)

export const createPlatform = (clientId, data) =>
  api.post(`/clients/${clientId}/platforms`, data).then(r => r.data)

export const updatePlatform = (clientId, id, data) =>
  api.put(`/clients/${clientId}/platforms/${id}`, data).then(r => r.data)

export const deletePlatform = (clientId, id) =>
  api.delete(`/clients/${clientId}/platforms/${id}`).then(r => r.data)
