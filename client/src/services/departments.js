import api from './api'

export const fetchDepartments = () =>
  api.get('/departments').then(r => r.data)

export const fetchSubDepartments = department =>
  api.get('/departments/sub-departments', { params: { department } }).then(r => r.data)
