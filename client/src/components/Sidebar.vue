<!-- Sidebar.vue – 完整版，背景色隨亮/暗主題正確切換 -->
<template>
  <el-aside :width="isCollapsed ? '64px' : '200px'" class="sidebar">
    <!-- ===== 漢堡按鈕 ===== -->
    <div class="sidebar__top">
      <el-button type="text" class="sidebar__toggle" @click="toggleCollapse">
        <el-icon :class="['transition-transform', isCollapsed ? '' : 'rotate-90']">
          <Menu />
        </el-icon>
      </el-button>
    </div>

    <!-- ===== 導航選單 ===== -->
    <el-menu :default-active="route.path" :collapse="isCollapsed" :collapse-transition="false" router
      class="sidebar__menu" @select="handleSelect" background-color="transparent" text-color="inherit"
      active-text-color="#409EFF">
      <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
        <el-icon>{{ item.icon }}</el-icon>
        <template #title>{{ item.label }}</template>
      </el-menu-item>
    </el-menu>

    <!-- ===== 底部操作 ===== -->
    <div class="sidebar__bottom">
      <!-- 主題切換 -->
      <template v-if="isCollapsed">
        <el-tooltip content="切換主題" placement="right">
          <ThemeToggle icon-only />
        </el-tooltip>
      </template>
      <template v-else>
        <ThemeToggle class="w-full" />
      </template>

      <!-- 登出 -->
      <template v-if="isCollapsed">
        <el-tooltip content="登出" placement="right">
          <el-button circle type="danger" @click="logout">
            <el-icon>
              <SwitchButton />
            </el-icon>
          </el-button>
        </el-tooltip>
      </template>
      <template v-else>
        <el-button type="danger" class="w-full" @click="logout">
          <el-icon class="mr-2">
            <SwitchButton />
          </el-icon>
          登出
        </el-button>
      </template>
    </div>
  </el-aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ThemeToggle from './ThemeToggle.vue'
import { Menu, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const isCollapsed = ref(false)
const store = useAuthStore()
const router = useRouter()
const route = useRoute()

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
const navItems = computed(() => menus[store.role] || [])

function toggleCollapse() { isCollapsed.value = !isCollapsed.value }
function handleSelect(index) { if (route.path !== index) router.push(index) }
function logout() {
  store.logout();
  router.push('/login');
  ElMessage.success('已登出')
}

/* 自動調整 main padding */
watch(isCollapsed, val => {
  const main = document.querySelector('main')
  if (main) main.style.paddingLeft = val ? '64px' : '200px'
})
</script>

<style scoped>
/* ===== 顏色：亮色 / 暗色 ===== */
.sidebar {
  @apply flex flex-col h-screen transition-width duration-200 border-r;
  background-color: #ffffff;
  /* default light */
  color: #1f2937;
}

.dark .sidebar {
  background-color: #1f2937;
  /* slate-800 */
  color: #f9fafb;
}

.sidebar__top {
  display: flex;
  justify-content: flex-end;
}

.sidebar__toggle {
  width: 100%;
  display: flex;
  justify-content: center;
}

.sidebar__menu {
  flex: 1 1 auto;
  border-right: none;
}

.sidebar__bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}
</style>
