import api from './api'

export const fetchFolders = (
  parentId = null,
  tags = [],
  type,
  deep = false,
  withProgress = false
) => {
  const params = {}
  if (parentId) params.parentId = parentId
  if (tags.length) params.tags = tags
  if (type) params.type = type
  if (deep) params.deep = 'true'
  if (withProgress) params.progress = 'true'
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

export const updateFoldersViewers = async (ids, users) => {
  try {
    const res = await api.put('/folders/viewers', { ids, allowedUsers: users })
    return res.data
  } catch (e) {
    throw e.response?.data?.message || '更新失敗'
  }
}

export const reviewFolder = (id, status) =>
  api.put(`/folders/${id}/review`, { reviewStatus: status }).then(res => res.data)

export const fetchFolderStages = id =>
  api.get(`/folders/${id}/stages`).then(res => res.data)

export const updateFolderStage = (folderId, stageId, completed) =>
  api.put(`/folders/${folderId}/stages/${stageId}`, { completed }).then(res => res.data)

export const downloadFolder = (id, deep = false) => {
  const params = {}
  if (deep) params.deep = 'true'
  return api.get(`/folders/${id}/download`, { params }).then(res => res.data.url)
}

