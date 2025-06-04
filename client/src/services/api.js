import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api',
  timeout: 10000
})

/* ---------- 請求攔截：帶上 JWT ---------- */
api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* ---------- 回應攔截：統一錯誤處理 ---------- */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message
    alert(`API 錯誤：${msg}`)
    return Promise.reject(err)
  }
)

export default api
