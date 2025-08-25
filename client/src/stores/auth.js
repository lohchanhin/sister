import { defineStore } from 'pinia'
import Cookies from 'js-cookie'
import api from '../services/api'
import { login as loginService } from '../services/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: { menus: [], permissions: [] },          // 使用者資訊
    token: Cookies.get('token') || null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role ?? 'guest',
    hasPermission: (state) => (code) => {
      return Array.isArray(state.user.permissions) &&
        state.user.permissions.includes(code)
    },
    hasPerms: (state) => (codes = []) => {
      return Array.isArray(codes) &&
        codes.every(c => state.user.permissions.includes(c))
    }
  },
  actions: {
    /* ---------- 登入 ---------- */
    async login(username, password) {
      const data = await loginService({ username, password })
      this.token = data.token
      const isHttps = window.location.protocol === 'https:'
      Cookies.set('token', data.token, {
        secure: isHttps,
        sameSite: 'strict',
        path: '/'
      })
      this.user = data.user
    },
    /* ---------- 登出 ---------- */
    logout() {
      this.token = null
      this.user = { menus: [], permissions: [] }
      Cookies.remove('token', { path: '/' })
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
