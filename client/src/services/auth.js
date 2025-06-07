import api from './api'

export const login = credentials =>
  api.post('/auth/login', credentials).then(res => res.data)

export const register = data =>
  api.post('/auth/register', data).then(res => res.data)
