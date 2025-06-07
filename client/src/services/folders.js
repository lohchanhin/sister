import api from './api'

export const fetchFolders = (parentId = null) => {
  const params = {}
  if (parentId) params.parentId = parentId
  return api.get('/folders', { params }).then((res) => res.data)
}

export const createFolder = (data) => {
  return api.post('/folders', data).then((res) => res.data)
}

export const getFolder = (id) => {
  return api.get(`/folders/${id}`).then((res) => res.data)
}

export const updateFolder = (id, data) => {
  return api.put(`/folders/${id}`, data).then((res) => res.data)
}

export const deleteFolder = id =>
  api.delete(`/folders/${id}`).then(res => res.data)
