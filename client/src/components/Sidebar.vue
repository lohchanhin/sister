<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ThemeToggle from './ThemeToggle.vue'
import { ElMessage } from 'element-plus'

const isCollapsed = ref(false)
const store = useAuthStore()
const router = useRouter()

const menus = {
  employee: [
    { path: '/', icon: '🏠', label: '首頁' },
    { path: '/progress', icon: '📈', label: '進度追踪' },
    { path: '/assets', icon: '🎞️', label: '素材庫' },
    { path: '/account', icon: '👤', label: '帳號資訊' }
  ],
  manager: [
    { path: '/', icon: '🏠', label: '首頁' },
    { path: '/progress', icon: '📈', label: '進度追踪' },
    { path: '/assets', icon: '🎞️', label: '素材庫' },
    { path: '/account', icon: '👤', label: '帳號資訊' },
    { path: '/analytics', icon: '📊', label: '廣告分析' }
  ],
  outsource: [
    { path: '/assets', icon: '🎞️', label: '素材庫' },
    { path: '/progress', icon: '📈', label: '任務追踪' }
  ]
}

const navItems = computed(() => menus[store.role] ?? [])

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function logout() {
  store.logout()
  router.push('/login')
  ElMessage.success('已登出')
}

watch(isCollapsed, (v) => {
  const main = document.querySelector('main')
  if (main) main.style.paddingLeft = v ? '4rem' : '15rem'
})
</script>

<template>
  <aside
    :class="[
      // 邊欄寬度
      isCollapsed ? 'w-16' : 'w-60',
      // 背景顏色與文字顏色
      'bg-slate-800 text-white',
      // 高度滿版
      'h-screen',
      // 內距
      'p-4',
      // 隱藏溢位避免動畫時出現捲軸
      'overflow-hidden',
      // 寬度動畫效果
      'transition-width'
    ]"
  >
    <!-- 上邊距、全寬、文字靠右 -->
    <button
      @click="toggleCollapse"
      class="mb-4 w-full text-right"
    >
      <span
        class="inline-block transition-transform"
        :class="!isCollapsed ? 'rotate-90' : ''"
      >☰</span>
    </button>
    <!-- 圖示尺寸與置中 -->
    <img
      v-if="isCollapsed"
      src="/vite.svg"
      alt="logo"
      class="w-8 h-8 mx-auto mb-6"
    />
    <!-- 字級、粗體、下邊距 -->
    <h2 v-else class="text-xl font-bold mb-6">系統選單</h2>
    <!-- 取消前導點 -->
    <ul class="list-none">
      <!-- 下邊距、游標指標 -->
      <li v-for="item in navItems" :key="item.path" class="mb-3 cursor-pointer">
        <!-- 水平排列、間距、懸停顏色、動畫 -->
        <a
          @click.prevent="router.push(item.path)"
          class="flex items-center gap-2 hover:text-amber-300 transition"
        >
          <span>{{ item.icon }}</span>
          <span v-if="!isCollapsed">{{ item.label }}</span>
        </a>
      </li>
      <!-- 與上方選單間距 -->
      <li class="mt-10">
        <!-- 全寬、紅色背景、懸停變色、內距、圓角、置中排列 -->
        <button
          @click="logout"
          class="w-full bg-red-600 hover:bg-red-700 py-2 rounded flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          <span v-if="!isCollapsed">登出</span>
        </button>
      </li>
      <li>
        <ThemeToggle :collapsed="isCollapsed" />
      </li>
    </ul>
  </aside>
</template>

