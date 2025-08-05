// services/weeklyNotes.js
// ------------------------------------------------------------
// 加入詳細的 console 記錄，方便在瀏覽器 DevTools 或 Node.js
// 中追蹤每一步請求與資料轉換流程。
// ------------------------------------------------------------

import api from './api'

/* ══════════ 1. 取得單週筆記 ══════════ */
export const fetchWeeklyNote = (clientId, platformId, week) => {
  const url = `/clients/${clientId}/platforms/${platformId}/weekly-notes/${week}`
  console.log('[fetchWeeklyNote] → GET', url)
  return api
    .get(url)
    .then(r => {
      console.log('[fetchWeeklyNote] ← response', r.data)
      return r.data
    })
}

/* ══════════ 2. 取得所有週筆記 ══════════ */
export const fetchWeeklyNotes = (clientId, platformId) => {
  const url = `/clients/${clientId}/platforms/${platformId}/weekly-notes`
  console.log('[fetchWeeklyNotes] → GET', url)
  return api
    .get(url)
    .then(r => {
      console.log('[fetchWeeklyNotes] ← response', r.data)
      return r.data
    })
}

/* ══════════ 3. 建立週筆記 ══════════ */
export const createWeeklyNote = (clientId, platformId, data) => {
  const url = `/clients/${clientId}/platforms/${platformId}/weekly-notes`
  const formData = new FormData()

  formData.append('week', data.week)
  formData.append('text', data.text || '')
  ;(data.images || []).forEach(f => {
    const file = f.raw || f.file || f
    formData.append('images', file)
  })

  console.log('[createWeeklyNote] → POST', url, {
    week: data.week,
    text: data.text,
    images: (data.images || []).length
  })

  return api
    .post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(r => {
      console.log('[createWeeklyNote] ← response', r.data)
      return r.data
    })
}

/* ══════════ 4. 更新週筆記 ══════════ */
export const updateWeeklyNote = (clientId, platformId, week, data) => {
  const url = `/clients/${clientId}/platforms/${platformId}/weekly-notes/${week}`
  const formData = new FormData()

  formData.append('text', data.text || '')
  ;(data.images || []).forEach(f => {
    const file = f.raw || f.file || f
    formData.append('images', file)
  })

  if (Array.isArray(data.keepImages)) {
    if (data.keepImages.length) {
      data.keepImages.forEach(i => formData.append('keepImages', i))
    } else {
      formData.append('keepImages', '')
    }
  }

  console.log('[updateWeeklyNote] → PUT', url, {
    week,
    text: data.text,
    newImages: (data.images || []).length,
    keepImages: data.keepImages
  })

  return api
    .put(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(r => {
      console.log('[updateWeeklyNote] ← response', r.data)
      return r.data
    })
}

/* ══════════ 5. 取得圖片簽名 URL ══════════ */
export const getWeeklyNoteImageUrl = (clientId, platformId, path) => {
  const url =
    `/clients/${clientId}/platforms/${platformId}/weekly-notes/image-url`

  console.log('[getWeeklyNoteImageUrl] → GET', url, { path })

  return api
    .get(url, { params: { path } })
    .then(r => {
      console.log('[getWeeklyNoteImageUrl] ← response', r.data.url)
      return r.data.url
    })
}
