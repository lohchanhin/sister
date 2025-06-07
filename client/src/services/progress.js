/* services/progress.js – 完整 CRUD */
import api from './api'

/* ---------- 模板 ---------- */
export const fetchTemplates = () =>
  api.get('/progress/templates').then(r => r.data)

export const createTemplate = data =>
  api.post('/progress/templates', data).then(r => r.data)

/* ★ 新增：改名 */
export const updateTemplate = (id, data) =>
  api.put(`/progress/templates/${id}`, data).then(r => r.data)

/* ★ 新增：刪除 */
export const deleteTemplate = id =>
  api.delete(`/progress/templates/${id}`).then(r => r.data)

/* ---------- 紀錄 ---------- */
export const fetchRecords = tplId =>
  api.get(`/progress/records/${tplId}`).then(r => r.data)

export const createRecord = data =>
  api.post('/progress/records', data).then(r => r.data)
