<!-- Sidebar.vue – 固定白色主題，無暗色切換 -->
<template>
  <el-aside :width="isCollapsed ? '64px' : '200px'"
    class="sidebar bg-white text-gray-800 border-r transition-all duration-200">
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

    <!-- ===== 底部：登出 ===== -->
    <div class="sidebar__bottom">
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
import { MENU_NAMES } from '../menuNames'
import { Menu, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

/* 折疊狀態 */
const isCollapsed = ref(false)

/* 基本狀態 */
const store = useAuthStore()
const router = useRouter()
const route = useRoute()

/* 全部選單定義 */
const allMenus = {
  dashboard: { path: '/', icon: '🏠' },
  progress: { path: '/progress', icon: '📈' },
  assets: { path: '/assets', icon: '🎞️' },
  products: { path: '/products', icon: '🎬' },
  employees: { path: '/employees', icon: '👥' },
  roles: { path: '/roles', icon: '🛡️' },
  tags: { path: '/tags', icon: '🏷️' },
  'review-stages': { path: '/review-stages', icon: '✅' },
  'ad-data': { path: '/ad-data', icon: '📊' },
  account: { path: '/account', icon: '👤' }
}

const navItems = computed(() => {
  const codes = store.user?.menus || []
  return codes.map(c => ({
    path: allMenus[c]?.path || '/',
    icon: allMenus[c]?.icon || '❓',
    label: MENU_NAMES[c] || c
  }))
})

/* 事件 */
const toggleCollapse = () => (isCollapsed.value = !isCollapsed.value)
const handleSelect = idx => { if (route.path !== idx) router.push(idx) }
const logout = () => {
  store.logout()
  router.push('/login')
  ElMessage.success('已登出')
}

/* 自動調整 main padding-left */
watch(isCollapsed, val => {
  const main = document.querySelector('main')
  if (main) main.style.paddingLeft = val ? '64px' : '200px'
})
</script>

<style scoped>
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
