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
      this.list = data.map(item => {
        const base = item.fileType === 'edited' ? '/products' : '/assets'
        const folderPath = item.folderId ? `${base}/${item.folderId}` : base
        const detailPath = item._id ? `${folderPath}/asset/${item._id}` : folderPath
        return {
          id: item._id,
          title: item.fileName,
          type: item.fileType,
          link: detailPath,
          read: false
        }
      })
    },
    markAsRead(id) {
      const target = this.list.find(n => n.id === id)
      if (target) target.read = true
    }
  }
})
