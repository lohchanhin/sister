import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    uploading: 0
  }),
  actions: {
    startUpload() {
      this.uploading++
    },
    finishUpload() {
      if (this.uploading > 0) this.uploading--
    }
  }
})
