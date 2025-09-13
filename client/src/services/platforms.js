import api from './api'

export const fetchPlatforms = clientId =>
  api.get(`/clients/${clientId}/platforms`).then(r => r.data)

export const createPlatform = (clientId, data) =>
  api.post(`/clients/${clientId}/platforms`, data).then(r => r.data)

export const updatePlatform = (clientId, id, data) =>
  api.put(`/clients/${clientId}/platforms/${id}`, data).then(r => r.data)

export const deletePlatform = (clientId, id) =>
  api.delete(`/clients/${clientId}/platforms/${id}`).then(r => r.data)

export const getPlatform = (clientId, id) =>
  api.get(`/clients/${clientId}/platforms/${id}`).then(r => r.data)

export const transferPlatform = (id, clientId) =>
  api.put(`/platforms/${id}/transfer`, { clientId }).then(r => r.data)

export const renamePlatformField = (clientId, platformId, data) =>
  api.put(`/clients/${clientId}/platforms/${platformId}/rename-field`, data).then(r => r.data)

export const getPlatformAliases = (clientId, id) =>
  api.get(`/clients/${clientId}/platforms/${id}/aliases`).then(r => r.data)

export const updatePlatformAliases = (clientId, id, fieldAliases) =>
  api.put(`/clients/${clientId}/platforms/${id}/aliases`, { fieldAliases }).then(r => r.data)
