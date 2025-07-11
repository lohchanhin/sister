import api from './api'


export const fetchAssets = (folderId, type, tags = [], deep = false) => {
  const params = {}
  if (folderId) params.folderId = folderId
  if (type) params.type = type
  if (tags.length) params.tags = tags
  if (deep) params.deep = 'true'

  return api.get('/assets', { params }).then(res =>
    res.data.map(a => ({
      ...a,
      url: a.url || null
    }))
  )
}

export const fetchProducts = (folderId, tags = [], deep = false, withProgress = false) => {
  const params = {}
  if (folderId) params.folderId = folderId
  if (tags.length) params.tags = tags
  if (deep) params.deep = 'true'
  if (withProgress) params.progress = 'true'

  return api.get('/products', { params }).then(res =>
    res.data.map(a => ({
      ...a,
      url: a.url || null
    }))
  )
}

export const uploadAsset = (file, folderId, extraData = null, onUploadProgress = null) => {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) formData.append('folderId', folderId)
  if (extraData) {
    for (const [k, v] of Object.entries(extraData)) {
      formData.append(k, v)
    }
  }

  return api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  }).then((res) => res.data)
}

export const updateAsset = (id, data) =>
  api.put(`/assets/${id}`, data).then(res => res.data)

export const deleteAsset = id =>
  api.delete(`/assets/${id}`).then(res => res.data)

export const reviewAsset = (id, status) =>
  api.put(`/assets/${id}/review`, { reviewStatus: status }).then(res => res.data)

export const fetchAssetStages = id =>
  api.get(`/assets/${id}/stages`).then(res => res.data)

export const updateAssetStage = (assetId, stageId, completed) =>
  api.put(`/assets/${assetId}/stages/${stageId}`, { completed }).then(res => res.data)

export const updateAssetsViewers = async (ids, users) => {
  try {
    const res = await api.put('/assets/viewers', { ids, allowedUsers: users })
    return res.data
  } catch (e) {
    throw e.response?.data?.message || '更新失敗'
  }
}

export const getAssetUrl = (id, download = false) =>
  api
    .get(`/assets/${id}/url`, { params: download ? { download: 1 } : {} })
    .then(res => res.data.url)


