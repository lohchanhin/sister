import { defineStore } from 'pinia'
import Cookies from 'js-cookie'
import api from '../services/api'
import { login as loginService } from '../services/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: { menus: [], permissions: [] }, // 使用者資訊
    token: Cookies.get('token') || null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role ?? 'guest'
  },
  actions: {
    /* ---------- 登入 ---------- */
    async login(username, password) {
      const data = await loginService({ username, password })
      this.token = data.token
      Cookies.set('token', data.token, { secure: true })
      this.user = data.user
    },
    /* ---------- 登出 ---------- */
    logout() {
      this.token = null
      this.user = { menus: [], permissions: [] }
      Cookies.remove('token')
    },
    /* ---------- 讀取個人資料 ---------- */
    async fetchProfile() {
      if (!this.token) return
      try {
        const { data } = await api.get('/user/profile')
        this.user = data
      } catch (e) {
        this.logout() // token 失效
      }
    }
  }
})
