// src/services/users.js
import api from './api'

export const fetchUsers = (params = {}) =>
  api.get('/user', { params }).then(r => r.data)          // GET /api/user

export const createUser = data =>
  api.post('/user', data).then(r => r.data)   // POST /api/user

export const updateUser = (id, data) =>
  api.put(`/user/${id}`, data).then(r => r.data) // PUT /api/user/:id

export const deleteUser = id =>
  api.delete(`/user/${id}`).then(r => r.data) // DELETE /api/user/:id

export const fetchUserClients = id =>
  api.get(`/user/${id}/clients`).then(r => r.data) // GET /api/user/:id/clients

export const updateUserClients = (id, clients) =>
  api.put(`/user/${id}/clients`, { clients }).then(r => r.data) // PUT /api/user/:id/clients
