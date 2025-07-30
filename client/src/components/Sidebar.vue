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
        <div class="brand-logo">
          <i class="pi pi-heart-fill brand-icon"></i>
          <div class="brand-glow"></div>
        </div>
        <div class="brand-content" v-if="!isCollapsed || isMobile">
          <span class="brand-text">Sister</span>
          <span class="brand-subtitle">管理系統</span>
        </div>
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
        <div class="nav-section-title" v-if="!isCollapsed || isMobile">主要功能</div>
        <ul class="nav-list">
          <li v-for="item in navItems" :key="item.route" class="nav-item">
            <router-link 
              :to="item.route" 
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === item.route }"
              @click="closeSidebar"
            >
              <div class="nav-icon-wrapper">
                <i :class="item.icon" class="nav-icon"></i>
                <div class="nav-icon-bg" v-if="$route.path === item.route"></div>
              </div>
              <span class="nav-text" v-if="!isCollapsed || isMobile">{{ item.label }}</span>
              <div class="nav-indicator" v-if="$route.path === item.route"></div>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <div class="user-profile" v-if="!isCollapsed || isMobile">
        <div class="user-avatar-wrapper">
          <Avatar 
            :label="store.user?.name?.charAt(0) || 'U'" 
            class="user-avatar" 
            shape="circle" 
            size="normal"
          />
          <div class="user-status"></div>
        </div>
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

  <!-- Mobile Overlay - 修復透明背景問題 -->
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
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #1a1d29 0%, #16192a 100%);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.layout-sidebar-collapsed {
  width: 5rem;
}

/* Sidebar Header */
.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80px;
  background: rgba(255, 255, 255, 0.02);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-logo {
  position: relative;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.brand-icon {
  font-size: 1.5rem;
  color: white;
  z-index: 2;
}

.brand-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 14px;
  opacity: 0.5;
  filter: blur(8px);
  z-index: 1;
}

.brand-content {
  display: flex;
  flex-direction: column;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  margin-top: -2px;
}

.sidebar-controls {
  display: flex;
  gap: 0.5rem;
}

.collapse-btn, .close-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.collapse-btn:hover, .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transform: scale(1.05);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 1.5rem;
  margin-bottom: 1rem;
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
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  transform: translateX(4px);
}

.nav-link:hover::before {
  transform: scaleY(1);
}

.nav-link-active {
  background: rgba(102, 126, 234, 0.15);
  color: white;
  box-shadow: inset 0 0 0 1px rgba(102, 126, 234, 0.3);
}

.nav-link-active::before {
  transform: scaleY(1);
}

.nav-link-active:hover {
  transform: none;
}

.nav-icon-wrapper {
  position: relative;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.nav-icon {
  font-size: 1.125rem;
  z-index: 2;
  transition: all 0.3s ease;
}

.nav-icon-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  opacity: 0.2;
  z-index: 1;
}

.nav-text {
  font-weight: 500;
  flex: 1;
  font-size: 0.95rem;
}

.nav-indicator {
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(102, 126, 234, 0.6);
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.user-profile:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.user-avatar-wrapper {
  position: relative;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.user-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid #1a1d29;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: white;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 100%;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fecaca;
  transform: translateY(-1px);
}

/* Mobile Styles */
@media screen and (max-width: 991px) {
  .layout-sidebar {
    transform: translateX(-100%);
    box-shadow: none;
    /* 確保手機版有完整的背景，不透明 */
    background: #1a1d29;
    backdrop-filter: none;
  }

  .layout-sidebar-mobile-visible {
    transform: translateX(0);
    box-shadow: 
      25px 0 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .layout-sidebar-mobile-hidden {
    transform: translateX(-100%);
  }

  .layout-sidebar-collapsed {
    width: 280px;
  }

  .layout-sidebar-collapsed .nav-text,
  .layout-sidebar-collapsed .brand-text,
  .layout-sidebar-collapsed .brand-subtitle,
  .layout-sidebar-collapsed .nav-section-title {
    display: block;
  }

  .sidebar-header {
    padding: 1.5rem;
  }
}

/* 修復手機版遮罩層 - 確保不透明 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8); /* 增加不透明度 */
  z-index: 999;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Dark theme enhancements */
:global(.dark-theme) .layout-sidebar {
  background: linear-gradient(180deg, #0f1419 0%, #0d1117 100%);
  border-right-color: rgba(255, 255, 255, 0.05);
}

:global(.dark-theme) .sidebar-header {
  background: rgba(255, 255, 255, 0.01);
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

/* Animation improvements */
@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.layout-sidebar-mobile-visible {
  animation: slideInLeft 0.3s ease-out;
}

.sidebar-overlay {
  animation: fadeIn 0.3s ease-out;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .layout-sidebar,
  .nav-link,
  .user-profile,
  .logout-btn {
    transition: none;
  }
  
  .layout-sidebar-mobile-visible,
  .sidebar-overlay {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .layout-sidebar {
    border-right: 2px solid white;
  }
  
  .nav-link-active {
    background: white;
    color: black;
  }
}
</style>
