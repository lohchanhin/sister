import api from './api'

export const fetchAssets = (folderId, type) => {
  const params = {}
  if (folderId) params.folderId = folderId
  if (type) params.type = type
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

export const uploadAsset = (file, folderId) => {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) formData.append('folderId', folderId)
  return api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)
}

export const updateAsset = (id, data) =>
  api.put(`/assets/${id}`, data).then(res => res.data)

export const deleteAsset = id =>
  api.delete(`/assets/${id}`).then(res => res.data)

export const reviewAsset = (id, status) =>
  api.post(`/assets/${id}/review`, { reviewStatus: status }).then(res => res.data)
