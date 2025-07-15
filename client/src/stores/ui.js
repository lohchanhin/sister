import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    uploads: {}
  }),
  actions: {
    startUpload(uid, name) {
      this.uploads[uid] = { name, percent: 0 }
    },
    updateUpload(uid, percent) {
      if (this.uploads[uid]) this.uploads[uid].percent = percent
    },
    finishUpload(uid) {
      delete this.uploads[uid]
    }
  }
})
