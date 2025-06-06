<template>
  <aside class="sidebar">
    <!-- ── 標題區 ── -->
    <h2 class="sidebar__title">系統選單</h2>

    <!-- ── 主選單 ── -->
    <el-menu
      :default-active="route.path"
      router
      class="sidebar__menu"
      background-color="#ffffff"
      text-color="#1a1a1a"
      active-text-color="#409EFF"
      @select="handleSelect"
      border="false"
    >
      <template v-for="item in navItems" :key="item.path">
        <el-menu-item :index="item.path" class="sidebar__item">
          <span class="sidebar__icon" aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- ── 功能區（Theme + 登出）── -->
    <div class="sidebar__footer">
      <ThemeToggle class="w-full" />

      <el-button
        type="danger"
        class="w-full"
        @click="logout"
      >
        <el-icon class="mr-1"><Menu /></el-icon>
        登出
      </el-button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ThemeToggle from './ThemeToggle.vue'
import { Menu } from '@element-plus/icons-vue'

const store  = useAuthStore()
const router = useRouter()
const route  = useRoute()

/* ===== 角色對應選單 ===== */
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

const navItems = computed(() => menus[store.role] ?? [])

/* ===== 事件處理 ===== */
function handleSelect(index: string) {
  if (route.path !== index) router.push(index)
}
function logout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ----------- 版面 ----------- */
.sidebar {
  width: 15rem;               /* 240px */
  min-height: 100vh;
  background: #ffffff;
  color: #1a1a1a;
  padding: 1.25rem 1rem;      /* 上下 20px, 左右 16px */
  box-shadow: 0 0 6px rgba(0,0,0,.08);
  box-sizing: border-box;
}

/* 標題 */
.sidebar__title {
  font-size: 1.25rem;         /* text-xl */
  font-weight: 700;
  margin-bottom: 1.5rem;      /* 與 menu 間距 24px */
}

/* Menu */
.sidebar__menu {
  margin-bottom: 2rem;        /* 與 footer 區間距 */
}

/* 移除 Element Plus 預設右邊框 */
.sidebar__menu :deep(.el-menu) { border-right: 0; }

/* 每個 item 行高 & 文字設定 */
.sidebar__item {
  padding-left: 0.75rem !important;   /* 左邊空間 */
  height: 42px !important;
  line-height: 42px !important;
  font-size: 15px;
}

/* Icon 區塊固定寬度，讓文字對齊 */
.sidebar__icon {
  display: inline-flex;
  width: 1.5rem;              /* 24px */
  justify-content: center;
  margin-right: 0.5rem;       /* 8px */
}

/* Footer 區域 */
.sidebar__footer {
  display: grid;
  gap: 0.75rem;               /* 12px */
}

/* 如果 main 內容和 Sidebar 平排，記得在 main 加 padding-left: 15rem; */
</style>
