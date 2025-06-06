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
    { path: '/account', icon: '👤', label: '帳號資訊' }
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

<script setup>
/*
  Sidebar.vue（JavaScript 版）
  ————————————————
  • 點箭頭切換收合/展開
  • 收合狀態寬度 64 px，只顯示 icon
  • 依使用者角色呈現不同選單
  • 自動調整 <main> padding-left
*/

import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ThemeToggle from './ThemeToggle.vue'
import { Menu, Fold, Expand } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

/* —— 響應式狀態 —— */
const isCollapsed = ref(false)
const store       = useAuthStore()
const router      = useRouter()
const route       = useRoute()

/* —— 角色對應選單 —— */
const menus = {
  employee: [
    { path: '/',         icon: '🏠', label: '首頁' },
    { path: '/progress', icon: '📈', label: '進度追踪' },
    { path: '/assets',   icon: '🎞️', label: '素材庫' },
    { path: '/account',  icon: '👤', label: '帳號資訊' },
  ],
  manager: [
    { path: '/',          icon: '🏠', label: '首頁' },
    { path: '/progress',  icon: '📈', label: '進度追踪' },
    { path: '/assets',    icon: '🎞️', label: '素材庫' },
    { path: '/account',   icon: '👤', label: '帳號資訊' },
    { path: '/analytics', icon: '📊', label: '廣告分析' },
  ],
  outsource: [
    { path: '/assets',   icon: '🎞️', label: '素材庫' },
    { path: '/progress', icon: '📈', label: '任務追踪' },
  ],
}

const navItems = computed(() => menus[store.role] || [])

/* —— 方法 —— */
function toggleCollapse () {
  isCollapsed.value = !isCollapsed.value
}
function handleSelect (index) {
  if (route.path !== index) router.push(index)
}
function logout () {
  store.logout()
  router.push('/login')
  ElMessage.success('已登出')
}

/* —— 自動調整 <main> padding —— */
watch(isCollapsed, (v) => {
  const main = document.querySelector('main')
  if (main) main.style.paddingLeft = v ? '4rem' : '15rem'
})
</script>

<style scoped>
/* —— 版面 —— */
.sidebar {
  width: 15rem;                       /* 240px */
  min-height: 100vh;
  padding: 1.25rem 1rem;
  background: #ffffff;
  color: #1a1a1a;
  box-shadow: 0 0 6px rgba(0,0,0,.08);
  display: flex;
  flex-direction: column;
  transition: width .2s ease;
}
.sidebar--collapsed {
  width: 4rem;                        /* 64px */
  padding: 1.25rem .5rem;
}

/* 收合/展開按鈕 */
.sidebar__collapse-btn {
  width: 100%;
  justify-content: flex-end;
  margin-bottom: 1rem;
  color: #606266;
}
.sidebar--collapsed .sidebar__collapse-btn { justify-content: center; }

/* 標題 */
.sidebar__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

/* Menu */
.sidebar__menu { flex: 1 1 auto; }

/* Item */
.sidebar__item {
  height: 42px !important;
  line-height: 42px !important;
  padding-left: .5rem !important;
  font-size: 15px;
  display: flex;
  align-items: center;
}
.sidebar--collapsed .sidebar__item {
  justify-content: center;
  padding-left: 0 !important;
}

/* Icon */
.sidebar__icon {
  width: 1.5rem;                       /* 24px */
  display: inline-flex;
  justify-content: center;
  margin-right: .5rem;
}
.sidebar--collapsed .sidebar__icon { margin-right: 0; }

/* Footer */
.sidebar__footer { display: grid; gap: .75rem; }
</style>
