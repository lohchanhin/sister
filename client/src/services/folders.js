import api from './api'

export const fetchFolders = (parentId = null, tags = [], type) => {
  const params = {}
  if (parentId) params.parentId = parentId
  if (tags.length) params.tags = tags
  if (type) params.type = type
  return api.get('/folders', { params }).then((res) => res.data)
}

export const createFolder = (data, type) => {
  const payload = { ...data }
  if (type) payload.type = type
  return api.post('/folders', payload).then((res) => res.data)
}

export const getFolder = (id) => {
  return api.get(`/folders/${id}`).then((res) => res.data)
}

export const updateFolder = (id, data) => {
  return api.put(`/folders/${id}`, data).then((res) => res.data)
}

export const deleteFolder = id =>
  api.delete(`/folders/${id}`).then(res => res.data)
