import api from './api'

export const POPULAR_DATA_PLATFORMS = Object.freeze({
  XHS: 'xhs',
  TIKTOK: 'tiktok',
  FACEBOOK: 'facebook'
})

export const listPopularContents = (clientId, platformKey) =>
  api
    .get(`/clients/${clientId}/popular-contents`, {
      params: { platformKey }
    })
    .then((res) => res.data)

export const createPopularContent = (clientId, payload) =>
  api.post(`/clients/${clientId}/popular-contents`, payload).then((res) => res.data)

export const updatePopularContent = (clientId, contentId, payload) =>
  api.put(`/clients/${clientId}/popular-contents/${contentId}`, payload).then((res) => res.data)

export const deletePopularContent = (clientId, contentId) =>
  api.delete(`/clients/${clientId}/popular-contents/${contentId}`).then((res) => res.data)

export const uploadPopularContentCover = (clientId, contentId, file) => {
  const formData = new FormData()
  formData.append('cover', file)
  return api
    .post(`/clients/${clientId}/popular-contents/${contentId}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((res) => res.data)
}
