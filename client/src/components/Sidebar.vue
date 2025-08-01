<template>
  <div class="sidebar-wrapper">
    <!-- Mobile Overlay -->
    <div 
      v-if="isMobile && mobileVisible" 
      class="mobile-overlay"
      @click="$emit('update:mobileVisible', false)"
    ></div>
    
    <!-- Sidebar -->
    <aside 
      class="sidebar" 
      :class="{ 
        'sidebar-collapsed': isCollapsed, 
        'sidebar-mobile-visible': isMobile && mobileVisible 
      }"
    >
      <!-- Brand Section -->
      <div class="sidebar-brand">
        <div class="brand-content" :class="{ 'brand-collapsed': isCollapsed }">
          <div class="brand-icon">
            <i class="pi pi-heart-fill"></i>
          </div>
          <div v-if="!isCollapsed" class="brand-text">
            <h2>Golden Goose Media</h2>
            <span class="brand-subtitle">管理系統</span>
          </div>
        </div>
        <Button
          v-if="!isMobile"
          :icon="isCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
          class="collapse-btn"
          @click="toggleCollapse"
        />
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div v-if="!isCollapsed" class="nav-section-title">主要功能</div>
          <ul class="nav-list">
            <li v-for="item in mainMenuItems" :key="item.path" class="nav-item">
              <router-link 
                :to="item.path" 
                class="nav-link"
                :class="{ 'nav-link-active': isActiveRoute(item.path) }"
                @click="handleNavClick"
              >
                <div class="nav-link-content">
                  <i :class="item.icon" class="nav-icon"></i>
                  <span v-if="!isCollapsed" class="nav-text">{{ item.label }}</span>
                  <div v-if="item.badge && !isCollapsed" class="nav-badge">{{ item.badge }}</div>
                </div>
              </router-link>
            </li>
          </ul>
        </div>

        <div class="nav-section">
          <div v-if="!isCollapsed" class="nav-section-title">管理功能</div>
          <ul class="nav-list">
            <li v-for="item in adminMenuItems" :key="item.path" class="nav-item">
              <router-link 
                :to="item.path" 
                class="nav-link"
                :class="{ 'nav-link-active': isActiveRoute(item.path) }"
                @click="handleNavClick"
              >
                <div class="nav-link-content">
                  <i :class="item.icon" class="nav-icon"></i>
                  <span v-if="!isCollapsed" class="nav-text">{{ item.label }}</span>
                </div>
              </router-link>
            </li>
          </ul>
        </div>
      </nav>

      <!-- User Section -->
      <div class="sidebar-user">
        <div class="user-content" :class="{ 'user-collapsed': isCollapsed }">
          <div class="user-avatar">
            <Avatar 
              :label="authStore.user?.name?.charAt(0) || 'U'" 
              size="normal"
              shape="circle"
            />
            <div class="user-status"></div>
          </div>
          <div v-if="!isCollapsed" class="user-info">
            <div class="user-name">{{ authStore.user?.name || '用戶' }}</div>
            <div class="user-role">{{ authStore.user?.role || '一般用戶' }}</div>
          </div>
          <Button
            v-if="!isCollapsed"
            icon="pi pi-sign-out"
            class="logout-btn"
            @click="handleLogout"
            v-tooltip.top="'登出'"
          />
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

const props = defineProps({
  mobileVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:mobileVisible', 'toggle-collapse'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapsed = ref(false)
const isMobile = ref(window.innerWidth <= 991)

const mainMenuItems = [
  { path: '/dashboard', label: '儀表板', icon: 'pi pi-home', badge: null },
  { path: '/assets', label: '素材庫', icon: 'pi pi-images', badge: null },
  { path: '/products', label: '成品區', icon: 'pi pi-box', badge: '3' },

  // { path: '/ad-data', label: '廣告數據', icon: 'pi pi-chart-line', badge: null }
]

const adminMenuItems = computed(() => {
  const items = [
    // 由於沒有獨立路由，統一導向 ad-clients
    { path: '/ad-clients', label: '客戶管理', icon: 'pi pi-users' },
    { path: '/tags', label: '標籤管理', icon: 'pi pi-tags' }
  ]
  
  if (
    authStore.hasPermission('user:manage') ||
    authStore.hasPermission('role:manage')
  ) {
    items.push(
      { path: '/employees', label: '員工管理', icon: 'pi pi-user-edit' },
      { path: '/roles', label: '角色設定', icon: 'pi pi-shield' },
      { path: '/review-settings', label: '審查設定', icon: 'pi pi-cog' }
    )
  }
  
  return items
})

const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('toggle-collapse', isCollapsed.value)
}

const handleNavClick = () => {
  if (isMobile.value) {
    emit('update:mobileVisible', false)
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
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
</script>

<style scoped>
.sidebar-wrapper {
  position: relative;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1001;
  backdrop-filter: blur(4px);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  z-index: 1002;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-mobile-visible {
  transform: translateX(0);
}

/* Brand Section */
.sidebar-brand {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.brand-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.brand-collapsed {
  justify-content: center;
}

.brand-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.brand-text h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.collapse-btn {
  width: 2rem;
  height: 2rem;
  background: var(--surface-a);
  border: 1px solid var(--surface-border);
  color: var(--text-color);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: var(--surface-hover);
  transform: scale(1.05);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1.5rem 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-section-title {
  padding: 0 1.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color-secondary);
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
  display: block;
  padding: 0.75rem 1.5rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 0 24px 24px 0;
  margin-right: 1rem;
}

.nav-link::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-link:hover {
  background: rgba(102, 126, 234, 0.1);
  color: var(--text-color);
}

.nav-link:hover::before {
  opacity: 1;
}

.nav-link-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  font-weight: 600;
}

.nav-link-active::before {
  opacity: 1;
}

.nav-link-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-icon {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
  font-weight: 500;
}

.nav-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  min-width: 1.5rem;
  text-align: center;
}

/* User Section */
.sidebar-user {
  padding: 1.5rem;
  border-top: 1px solid var(--surface-border);
  background: var(--surface-a);
}

.user-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.user-collapsed {
  justify-content: center;
}

.user-avatar {
  position: relative;
  flex-shrink: 0;
}

.user-avatar .p-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.user-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid var(--surface-card);
  border-radius: 50%;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.logout-btn {
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

/* Mobile Styles */
@media screen and (max-width: 991px) {
  .sidebar {
    transform: translateX(-100%);
    background: white; /* 手機版強制白色背景 */
    color: #1e293b; /* 手機版強制深色文字 */
  }
  
  .sidebar-collapsed {
    width: 280px;
    transform: translateX(-100%);
    background: white; /* 手機版強制白色背景 */
  }
  
  .collapse-btn {
    display: none;
  }

  /* 手機版文字顏色覆蓋 */
  .sidebar .nav-link {
    color: #1e293b !important;
  }

  .sidebar .nav-section-title {
    color: #64748b !important;
  }

  .sidebar .brand-text h2 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sidebar .brand-subtitle {
    color: #64748b !important;
  }

  .sidebar .user-name {
    color: #1e293b !important;
  }

  .sidebar .user-role {
    color: #64748b !important;
  }

  .sidebar .logout-btn {
    border-color: #e2e8f0;
    color: #64748b;
  }

  .sidebar .logout-btn:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #dc2626;
  }
}

/* Dark Theme */
:global(.dark-theme) .sidebar {
  background: var(--surface-card);
  border-right-color: var(--surface-border);
}

:global(.dark-theme) .sidebar-brand {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-bottom-color: var(--surface-border);
}

:global(.dark-theme) .brand-text h2 {
  background: linear-gradient(135deg, #8b9cf7 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:global(.dark-theme) .brand-subtitle {
  color: var(--text-color-secondary);
}

:global(.dark-theme) .nav-section-title {
  color: var(--text-color-secondary);
}

:global(.dark-theme) .nav-link {
  color: var(--text-color);
}

:global(.dark-theme) .nav-link:hover {
  background: rgba(139, 156, 247, 0.1);
  color: var(--text-color);
}

:global(.dark-theme) .nav-link-active {
  background: linear-gradient(135deg, rgba(139, 156, 247, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%);
  color: #8b9cf7;
}

:global(.dark-theme) .sidebar-user {
  background: var(--surface-a);
  border-top-color: var(--surface-border);
}

:global(.dark-theme) .user-name {
  color: var(--text-color);
}

:global(.dark-theme) .user-role {
  color: var(--text-color-secondary);
}

:global(.dark-theme) .collapse-btn {
  background: var(--surface-a);
  border-color: var(--surface-border);
  color: var(--text-color);
}

:global(.dark-theme) .collapse-btn:hover {
  background: var(--surface-hover);
}

:global(.dark-theme) .logout-btn {
  border-color: var(--surface-border);
  color: var(--text-color-secondary);
}

:global(.dark-theme) .logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* Scrollbar */
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
