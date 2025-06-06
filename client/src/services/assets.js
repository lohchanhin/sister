import api from './api'

export const fetchAssets = (folderId = null) => {
  const params = {}
  if (folderId) params.folderId = folderId
  return api.get('/assets', { params }).then((res) => res.data)
}

export const uploadAsset = (file, folderId) => {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) formData.append('folderId', folderId)
  return api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)
}
