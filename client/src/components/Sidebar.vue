<script setup>
import { computed } from 'vue'
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
    { path: '/account', icon: '👤', label: '帳號資訊' }
  ],
  outsource: [
    { path: '/assets', icon: '🎞️', label: '素材庫' },
    { path: '/progress', icon: '📈', label: '任務追踪' }
  ]
}

/* ---------- 目前使用者可見選單 ---------- */
const navItems = computed(() => menus[store.role] ?? [])
</script>

<template>
  <aside class="w-60 bg-slate-800 text-white h-screen p-4">
    <h2 class="text-xl font-bold mb-6">系統選單</h2>
    <ul>
      <li v-for="item in navItems" :key="item.path" class="mb-3">
        <a
          @click.prevent="router.push(item.path)"
          class="flex items-center gap-2 hover:text-amber-300 transition"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </a>
      </li>
      <li class="mt-10">
        <button
          @click="store.logout(); router.push('/login')"
          class="w-full bg-red-600 hover:bg-red-700 py-2 rounded"
        >
          登出
        </button>
      </li>
      <li>
        <ThemeToggle />
      </li>
    </ul>
  </aside>
</template>

<style scoped>
/* 簡易配色，可依 UI Kit 調整 */
</style>
