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
  <aside :class="[isCollapsed ? 'w-16' : 'w-60', 'bg-slate-800 text-white h-screen p-4 transition-all']">
    <button @click="toggleCollapse" class="mb-4 w-full text-right">
      <span v-if="isCollapsed">➡️</span>
      <span v-else>⬅️</span>
    </button>
    <img v-if="isCollapsed" src="/vite.svg" alt="logo" class="w-8 h-8 mx-auto mb-6" />
    <h2 v-else class="text-xl font-bold mb-6">系統選單</h2>
    <ul class="list-none">
      <li v-for="item in navItems" :key="item.path" class="mb-3 cursor-pointer">
        <a @click.prevent="router.push(item.path)" class="flex items-center gap-2 hover:text-amber-300 transition">
          <span>{{ item.icon }}</span>
          <span v-if="!isCollapsed">{{ item.label }}</span>
        </a>
      </li>
      <li class="mt-10">
        <button @click="logout" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded flex items-center justify-center gap-2">
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

