<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

const store = useAuthStore()
const router = useRouter()

/* ---------- 依角色顯示選單 ---------- */
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
    { path: '/analytics', icon: '📊', label: '廣告分析' } // 之後擴充
  ],
  outsource: [
    { path: '/assets', icon: '🎞️', label: '素材庫' },
    { path: '/progress', icon: '📈', label: '任務追踪' }
  ]
}

/* ---------- 目前使用者可見選單 ---------- */
const navItems = computed(() => menus[store.role] ?? [])
const isCollapsed = ref(false)
</script>

<template>
  <aside :class="[isCollapsed ? 'w-16' : 'w-60', 'bg-slate-800 text-white h-screen p-4 transition-all']">
    <button @click="isCollapsed = !isCollapsed" class="mb-4 w-full text-right">
      <span v-if="isCollapsed">➡️</span>
      <span v-else>⬅️</span>
    </button>
    <h2 v-if="!isCollapsed" class="text-xl font-bold mb-6">系統選單</h2>
    <ul>
      <li v-for="item in navItems" :key="item.path" class="mb-3">
        <a
          @click.prevent="router.push(item.path)"
          class="flex items-center gap-2 hover:text-amber-300 transition"
        >
          <span>{{ item.icon }}</span>
          <span v-if="!isCollapsed">{{ item.label }}</span>
        </a>
      </li>
      <li class="mt-10">
        <button
          @click="store.logout(); router.push('/login')"
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

<style scoped>
/* 簡易配色，可依 UI Kit 調整 */
</style>
