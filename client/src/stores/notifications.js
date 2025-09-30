import { defineStore } from 'pinia'
import { fetchNotifications } from '../services/notifications'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    list: []
  }),
  getters: {
    unreadCount: state => state.list.filter(n => !n.read).length,
    productUnreadCount: state =>
      state.list.filter(n => !n.read && n.link.startsWith('/products')).length
  },
  actions: {
    async fetch() {
      const data = await fetchNotifications()
      this.list = data.map(item => ({
        id: item.id || item._id,
        title: item.title || item.message || '通知',
        message: item.message || '',
        type: item.type || 'general',
        link: item.link || '#',
        read: Boolean(item.read)
      }))
    },
    markAsRead(id) {
      const target = this.list.find(n => n.id === id)
      if (target) target.read = true
    }
  }
})
