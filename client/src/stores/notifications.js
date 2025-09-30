import { defineStore } from 'pinia'
import { fetchNotifications, markNotificationsRead } from '../services/notifications'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    list: []
  }),
  getters: {
    unreadCount: state => state.list.filter(n => !n.read).length,
    productUnreadCount: state =>
      state.list.filter(n => !n.read && (n.link || '').startsWith('/products')).length,
    diaryUnreadCount: state =>
      state.list.filter(n => !n.read && n.type?.startsWith('work-diary')).length
  },
  actions: {
    async fetch(limit = 10) {
      const data = await fetchNotifications(limit)
      this.list = data.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message || '',
        type: item.type || 'general',
        link: item.link || '/',
        read: Boolean(item.read),
        createdAt: item.createdAt,
        metadata: item.metadata || {}
      }))
    },
    async markAsRead(id) {
      const target = this.list.find(n => n.id === id)
      if (!target || target.read) return
      target.read = true
      try {
        await markNotificationsRead([id])
      } catch (error) {
        target.read = false
        throw error
      }
    },
    async markManyAsRead(ids = []) {
      const validIds = ids.filter(Boolean)
      if (!validIds.length) return
      const previous = new Map()
      this.list.forEach((item) => {
        if (validIds.includes(item.id)) {
          previous.set(item.id, item.read)
          item.read = true
        }
      })
      try {
        await markNotificationsRead(validIds)
      } catch (error) {
        previous.forEach((read, id) => {
          const target = this.list.find((item) => item.id === id)
          if (target) target.read = read
        })
        throw error
      }
    }
  }
})
