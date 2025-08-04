import { defineStore } from 'pinia'
import { fetchNotifications } from '../services/notifications'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    list: []
  }),
  getters: {
    unreadCount: state => state.list.filter(n => !n.read).length,
    productUnreadCount: state =>
      state.list.filter(n => !n.read && n.link === '/products').length
  },
  actions: {
    async fetch() {
      const data = await fetchNotifications()
      this.list = data.map(item => ({
        id: item._id,
        title: item.fileName,
        type: item.fileType,
        link: item.fileType === 'edited' ? '/products' : '/assets',
        read: false
      }))
    },
    markAsRead(id) {
      const target = this.list.find(n => n.id === id)
      if (target) target.read = true
    }
  }
})
