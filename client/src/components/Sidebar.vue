<template>
  <aside
    :class="[
      'layout-sidebar',
      { 
        'layout-sidebar-collapsed': isCollapsed,
        'layout-sidebar-mobile-visible': mobileVisible && isMobile,
        'layout-sidebar-mobile-hidden': !mobileVisible && isMobile
      }
    ]"
  >
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <i class="pi pi-heart-fill brand-icon"></i>
        <span class="brand-text">{{ !isCollapsed || isMobile ? 'Sister' : '' }}</span>
      </div>
      <div class="sidebar-controls">
        <Button
          v-if="!isMobile"
          :icon="isCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
          class="p-button-text p-button-rounded collapse-btn"
          @click="toggleCollapse"
          v-tooltip.right="isCollapsed ? '展開側邊欄' : '收合側邊欄'"
        />
        <Button
          v-if="isMobile"
          icon="pi pi-times"
          class="p-button-text p-button-rounded close-btn"
          @click="closeSidebar"
        />
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="nav-section-title">{{ !isCollapsed || isMobile ? '主要功能' : '' }}</div>
        <ul class="nav-list">
          <li v-for="item in navItems" :key="item.route" class="nav-item">
            <router-link 
              :to="item.route" 
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === item.route }"
              @click="closeSidebar"
            >
              <i :class="item.icon" class="nav-icon"></i>
              <span class="nav-text">{{ !isCollapsed || isMobile ? item.label : '' }}</span>
              <div class="nav-indicator" v-if="$route.path === item.route"></div>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <div class="user-profile" v-if="!isCollapsed || isMobile">
        <Avatar 
          :label="store.user?.name?.charAt(0) || 'U'" 
          class="user-avatar" 
          shape="circle" 
          size="normal"
        />
        <div class="user-details">
          <div class="user-name">{{ store.user?.name || '用戶' }}</div>
          <div class="user-role">{{ store.user?.role || '一般用戶' }}</div>
        </div>
      </div>
      <Button
        :icon="isCollapsed && !isMobile ? 'pi pi-sign-out' : undefined"
        :label="isCollapsed && !isMobile ? '' : '登出'"
        class="logout-btn"
        severity="danger"
        @click="logout"
        v-tooltip.right="isCollapsed && !isMobile ? '登出系統' : ''"
      />
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div 
    v-if="mobileVisible && isMobile" 
    class="sidebar-overlay" 
    @click="closeSidebar"
  ></div>
</template>

<script setup>
import { ref, computed, defineEmits, defineProps, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { MENU_NAMES } from '../menuNames'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

const emit = defineEmits(['toggle-collapse', 'update:mobileVisible'])
const props = defineProps({
  mobileVisible: {
    type: Boolean,
    default: false
  }
})

const isCollapsed = ref(false)
const store = useAuthStore()
const router = useRouter()
const route = useRoute()
const isMobile = ref(window.innerWidth <= 991)

const allMenus = {
  dashboard: { route: '/dashboard', icon: 'pi pi-home' },
  assets: { route: '/assets', icon: 'pi pi-video' },
  products: { route: '/products', icon: 'pi pi-box' },
  employees: { route: '/employees', icon: 'pi pi-users' },
  roles: { route: '/roles', icon: 'pi pi-shield' },
  tags: { route: '/tags', icon: 'pi pi-tags' },
  'review-stages': { route: '/review-stages', icon: 'pi pi-check-square' },
  'ad-data': { route: '/ad-clients', icon: 'pi pi-chart-bar' },
  account: { route: '/account', icon: 'pi pi-user' }
}

const navItems = computed(() => {
  const codes = store.user?.menus || []
  const perms = store.user?.permissions || []
  return codes
    .filter(c => (c !== 'roles' || perms.includes('role:manage')))
    .map(c => ({
      label: MENU_NAMES[c] || c,
      icon: allMenus[c]?.icon || 'pi pi-question-circle',
      route: allMenus[c]?.route || '/'
    }))
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('toggle-collapse', isCollapsed.value)
}

const logout = () => {
  store.logout()
  router.push('/login')
}

const closeSidebar = () => {
  emit('update:mobileVisible', false)
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 991
  if (!isMobile.value) {
    emit('update:mobileVisible', false)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(route, () => {
  if (isMobile.value) {
    closeSidebar()
  }
})
</script>

<style scoped>
.layout-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.layout-sidebar-collapsed {
  width: 5rem;
}

/* Sidebar Header */
.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 70px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: -0.025em;
}

.sidebar-controls {
  display: flex;
  gap: 0.5rem;
}

.collapse-btn, .close-btn {
  width: 2rem;
  height: 2rem;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin: 0.25rem 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 0.5rem;
  margin: 0 0.75rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.nav-link:hover {
  background: var(--surface-hover);
  color: var(--primary-color);
  transform: translateX(2px);
}

.nav-link-active {
  background: var(--primary-color);
  color: var(--primary-color-text);
  box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.3);
}

.nav-link-active:hover {
  background: var(--primary-color);
  color: var(--primary-color-text);
  transform: none;
}

.nav-icon {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
  margin-right: 0.75rem;
}

.nav-text {
  font-weight: 500;
  flex: 1;
}

.nav-indicator {
  position: absolute;
  right: 0.5rem;
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
  background: var(--surface-a);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-card);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid var(--surface-border);
}

.user-avatar {
  background: var(--primary-color);
  color: var(--primary-color-text);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 100%;
  justify-content: center;
}

/* Mobile Styles */
@media screen and (max-width: 991px) {
  .layout-sidebar {
    transform: translateX(-100%);
    box-shadow: none;
  }

  .layout-sidebar-mobile-visible {
    transform: translateX(0);
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.15);
  }

  .layout-sidebar-mobile-hidden {
    transform: translateX(-100%);
  }

  .layout-sidebar-collapsed {
    width: 250px;
  }

  .layout-sidebar-collapsed .nav-text,
  .layout-sidebar-collapsed .brand-text,
  .layout-sidebar-collapsed .nav-section-title {
    display: block;
  }
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
}

/* Scrollbar Styling */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--surface-border);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-secondary);
}
</style>
