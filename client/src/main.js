import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// PrimeVue 相關引入
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Aura from '@primeuix/themes/aura' // Aura Light Blue 主題
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './assets/shared-library-styles.css'

// 移除 ElementPlus 的樣式和全域樣式
// import './style.css'
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'none'
    }
  },
  ripple: true
})
app.use(ToastService)
app.use(ConfirmationService) // 啟用漣漪效果以增強互動感

app.mount('#app')
