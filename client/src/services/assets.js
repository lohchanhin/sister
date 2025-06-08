import api from './api'

export const fetchAssets = folderId => {
  const params = folderId ? { folderId } : {}
  return api.get('/assets', { params }).then(res =>
    res.data.map(a => {
      const hasStatic = /^\/static\//.test(a.url || '')
      return {
        ...a,
        url: hasStatic ? a.url : `/static/${a.filename}`
      }
    })
  )
}

// 上傳素材，可額外傳入 extraData 例如 { type: 'edited' }
export const uploadAsset = (file, folderId, extraData = null) => {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) formData.append('folderId', folderId)
  if (extraData) {
    for (const [k, v] of Object.entries(extraData)) {
      formData.append(k, v)
    }
  }
  return api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)
}

export const updateAsset = (id, data) =>
  api.put(`/assets/${id}`, data).then(res => res.data)

export const deleteAsset = id =>
  api.delete(`/assets/${id}`).then(res => res.data)