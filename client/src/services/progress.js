import api from './api'

export const fetchTemplates = () => {
  return api.get('/progress/templates').then(res => res.data)
}

export const createTemplate = (data) => {
  return api.post('/progress/templates', data).then(res => res.data)
}

export const fetchRecords = (tplId) => {
  return api.get(`/progress/records/${tplId}`).then(res => res.data)
}

export const createRecord = (data) => {
  return api.post('/progress/records', data).then(res => res.data)
}
