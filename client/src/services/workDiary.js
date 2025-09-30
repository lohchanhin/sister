import api from './api'

const toArray = (value) => {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && Array.isArray(value.records)) return value.records
  return []
}

export const listWorkDiaries = (params = {}) =>
  api
    .get('/work-diaries', { params })
    .then((res) => res.data)

export const getWorkDiary = (diaryId) =>
  api
    .get(`/work-diaries/${diaryId}`)
    .then((res) => res.data)

export const updateWorkDiary = (diaryId, payload) =>
  api
    .put(`/work-diaries/${diaryId}`, payload)
    .then((res) => res.data)

export const updateWorkDiaryStatus = (diaryId, status, extra = {}) =>
  updateWorkDiary(diaryId, { ...extra, status })

export const uploadWorkDiaryImages = (diaryId, files = []) => {
  const formData = new FormData()
  toArray(files).forEach((file) => {
    const payload = file?.raw || file?.file || file
    if (payload) formData.append('images', payload)
  })
  return api
    .post(`/work-diaries/${diaryId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((res) => res.data)
}

export const removeWorkDiaryImage = (diaryId, imageId) =>
  api
    .delete(`/work-diaries/${diaryId}/images/${imageId}`)
    .then((res) => res.data)

export default {
  listWorkDiaries,
  getWorkDiary,
  updateWorkDiary,
  updateWorkDiaryStatus,
  uploadWorkDiaryImages,
  removeWorkDiaryImage
}
