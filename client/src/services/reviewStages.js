import api from './api'

export const fetchReviewStages = () =>
  api.get('/review-stages').then(r => r.data)

export const createReviewStage = data =>
  api.post('/review-stages', data).then(r => r.data)

export const updateReviewStage = (id, data) =>
  api.put(`/review-stages/${id}`, data).then(r => r.data)

export const deleteReviewStage = id =>
  api.delete(`/review-stages/${id}`).then(r => r.data)
