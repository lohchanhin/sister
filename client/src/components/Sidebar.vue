<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

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

const onSelect = (path) => {
  router.push(path)
}

const onLogout = () => {
  store.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="w-60 h-screen bg-slate-800 text-white">
    <el-menu
      class="h-full"
      :default-active="router.currentRoute.value.path"
      @select="onSelect"
    >
      <h2 class="text-xl font-bold mb-6 p-4 text-white">系統選單</h2>
      <el-menu-item
        v-for="item in navItems"
        :index="item.path"
        :key="item.path"
      >
        <span>{{ item.icon }}</span>
        <span class="ml-2">{{ item.label }}</span>
      </el-menu-item>
      <div class="p-4 mt-10">
        <el-button
          type="danger"
          class="w-full logout-btn"
          @click="onLogout"
        >
          登出
        </el-button>
      </div>
    </el-menu>
  </aside>
</template>

<style scoped>
/* 簡易配色，可依 UI Kit 調整 */
.logout-btn:hover {
  cursor: copy;
}
</style>
