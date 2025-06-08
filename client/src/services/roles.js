import api from './api'

export const fetchRoles = () =>
  api.get('/roles').then(r => r.data)

export const createRole = data =>
  api.post('/roles', data).then(r => r.data)

export const updateRole = (id, data) =>
  api.put(`/roles/${id}`, data).then(r => r.data)

export const deleteRole = id =>
  api.delete(`/roles/${id}`).then(r => r.data)

export const fetchPermissions = () =>
  api.get('/permissions').then(r => r.data)
