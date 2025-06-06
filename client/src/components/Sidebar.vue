
<template>
  <!-- 240 ⇆ 64 -->
  <aside :class="['sidebar', { 'sidebar--collapsed': isCollapsed }]">
    <!-- 收合/展開按鈕 -->
    <el-button class="sidebar__collapse-btn" type="text" @click="toggleCollapse">
      <el-icon>
        <component :is="isCollapsed ? Expand : Fold" />
      </el-icon>
    </el-button>

    <!-- 標題 (收合時隱藏) -->
    <h2 v-show="!isCollapsed" class="sidebar__title">系統選單</h2>

    <!-- 主選單 -->
    <el-menu
      :default-active="route.path"
      router
      :collapse="isCollapsed"
      :collapse-transition="false"
      background-color="#ffffff"
      text-color="#1a1a1a"
      active-text-color="#409EFF"
      border="false"
      class="sidebar__menu"
      @select="handleSelect"
    >
      <template v-for="item in navItems" :key="item.path">
        <el-menu-item :index="item.path" class="sidebar__item">
          <span class="sidebar__icon">{{ item.icon }}</span>
          <span v-show="!isCollapsed">{{ item.label }}</span>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- 底部功能區 -->
    <div class="sidebar__footer">
      <!-- 主題切換：展開顯示完整，收合顯示 icon -->
      <ThemeToggle
        v-if="!isCollapsed"
        class="w-full"
      />
      <el-tooltip v-else content="切換主題" placement="right">
        <ThemeToggle icon-only />
      </el-tooltip>

      <!-- 登出按鈕 -->
      <template v-if="!isCollapsed">
        <el-button type="danger" class="w-full" @click="logout">
          <el-icon class="mr-1"><Menu /></el-icon>
          登出
        </el-button>
      </template>
      <template v-else>
        <el-tooltip content="登出" placement="right">
          <el-button circle type="danger" @click="logout">
            <el-icon><Menu /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </div>
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
