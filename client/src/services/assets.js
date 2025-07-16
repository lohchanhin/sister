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

export const uploadAssetResumable = async (file, onProgress = null) => {
  const { sessionUri } = await api
    .post('/assets/presign', { filename: file.name, contentType: file.type })
    .then(res => res.data)

  const chunkSize = 1024 * 1024 * 8
  let uploaded = 0
  while (uploaded < file.size) {
    const chunk = file.slice(uploaded, uploaded + chunkSize)
    const end = uploaded + chunk.size - 1
    const headers = {
      'Content-Length': chunk.size,
      'Content-Type': file.type,
      'Content-Range': `bytes ${uploaded}-${end}/${file.size}`
    }
    const resp = await fetch(sessionUri, {
      method: 'PUT',
      headers,
      body: chunk
    })
    if (!resp.ok && resp.status !== 308) {
      throw new Error('上傳失敗')
    }
    uploaded += chunk.size
    if (onProgress) onProgress(uploaded)
  }
  return sessionUri
}

export const uploadAssetAuto = async (
  file,
  folderId,
  extraData = null,
  onProgress = null
) => {
  const limit = 500 * 1024 * 1024
  if (file.size < limit) {
    return uploadAsset(file, folderId, extraData, onProgress)
  }

  const wrapProgress = loaded => {
    if (onProgress) {
      const percent = Math.round((loaded / file.size) * 100)
      onProgress({ percent })
    }
  }

  return uploadAssetResumable(file, wrapProgress)
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


