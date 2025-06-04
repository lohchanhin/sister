import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// import './assets/main.css' // 若有自訂樣式

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
