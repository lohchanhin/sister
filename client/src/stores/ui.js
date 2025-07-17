import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    uploads: {},
    downloads: {}
  }),
  actions: {
    startUpload(uid, name) {
      this.uploads[uid] = { name, percent: 0, error: false }
    },
    updateUpload(uid, percent) {
      if (this.uploads[uid]) this.uploads[uid].percent = percent
    },
    finishUpload(uid) {
      delete this.uploads[uid]
    },
    startDownload(id, name) {
      this.downloads[id] = { name, percent: 0 }
    },
    updateDownload(id, percent) {
      if (this.downloads[id]) this.downloads[id].percent = percent
    },
    finishDownload(id) {
      delete this.downloads[id]
    }
  }
})
