import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    dark: localStorage.getItem('theme') === 'dark'
  }),
  actions: {
    toggle() {
      this.dark = !this.dark
      localStorage.setItem('theme', this.dark ? 'dark' : 'light')
      document.body.classList.toggle('dark', this.dark)
    },
    init() {
      document.body.classList.toggle('dark', this.dark)
    }
  }
})
