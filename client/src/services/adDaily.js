import api from './api'


export const fetchDaily = (clientId, platformId) =>
  api.get(`/clients/${clientId}/platforms/${platformId}/ad-daily`).then(r => r.data)

export const createDaily = (clientId, platformId, data) =>
  api.post(
    `/clients/${clientId}/platforms/${platformId}/ad-daily`,
    { ...data, extraData: data.extraData || {}, colors: data.colors || {} }
  ).then(r => r.data)

export const fetchWeekly = (clientId, platformId) =>
  api.get(`/clients/${clientId}/platforms/${platformId}/ad-daily/weekly`).then(r => r.data)

export const importDaily = (clientId, platformId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(
    `/clients/${clientId}/platforms/${platformId}/ad-daily/import`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ).then(r => r.data)
}

export const bulkCreateDaily = async (clientId, platformId, records) => {
  try {
    const res = await api.post(
      `/clients/${clientId}/platforms/${platformId}/ad-daily/bulk`,
      records.map(r => ({
        ...r,
        extraData: r.extraData || {},
        colors: r.colors || {}
      }))
    )
    return res.data
  } catch (e) {
    return Promise.all(
      records.map(r => createDaily(clientId, platformId, r))
    )
  }
}

export const updateDaily = (clientId, platformId, id, data) =>
  api
    .put(
      `/clients/${clientId}/platforms/${platformId}/ad-daily/${id}`,
      { ...data, colors: data.colors || {} }
    )
    .then(r => r.data)

export const deleteDaily = (clientId, platformId, id) =>
  api
    .delete(`/clients/${clientId}/platforms/${platformId}/ad-daily/${id}`)
    .then(r => r.data)

