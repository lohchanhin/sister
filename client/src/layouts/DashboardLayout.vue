<template>
  <div class="layout-wrapper" :class="{ 'layout-sidebar-collapsed': isCollapsed }">
    <!-- Mobile Header -->
    <header v-if="isMobile" class="mobile-header">
      <Button
        icon="pi pi-bars"
        class="p-button-text p-button-rounded mobile-menu-btn"
        @click="toggleMobileSidebar"
      />
      <div class="mobile-header-title">
        <div class="mobile-brand">
          <i class="pi pi-heart-fill mobile-brand-icon"></i>
          <h2 class="mobile-brand-text">Golden Goose Media</h2>
        </div>
      </div>
      <div class="mobile-header-actions">
        <ThemeToggle />
        <div class="mobile-user-avatar">
          <Avatar 
            :label="store.user?.name?.charAt(0) || 'U'" 
            size="small"
            shape="circle"
          />
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <Sidebar 
      :mobileVisible="mobileSidebarVisible" 
      @update:mobileVisible="mobileSidebarVisible = $event" 
      @toggle-collapse="onToggleCollapse" 
    />

    <!-- Main Content -->
    <main class="layout-main">
      <div class="layout-main-content">
        <!-- Desktop Header -->
        <header v-if="!isMobile" class="desktop-header">
          <div class="header-left">
            <div class="page-title-section">
              <h1 class="page-title">{{ getPageTitle() }}</h1>
              <div class="page-breadcrumb">
                <span class="breadcrumb-item">{{ getBreadcrumb() }}</span>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="header-actions">
              <Button
                icon="pi pi-bell"
                class="p-button-text p-button-rounded notification-btn"
                v-tooltip.bottom="'通知'"
                badge="3"
                badgeClass="p-badge-danger"
              />
              <ThemeToggle />
              <div class="user-profile-dropdown">
                <div class="user-info">
                  <Avatar 
                    :label="store.user?.name?.charAt(0) || 'U'" 
                    class="user-avatar" 
                    shape="circle" 
                    size="normal"
                  />
                  <div class="user-details">
                    <span class="user-name">{{ store.user?.name || '用戶' }}</span>
                    <span class="user-role">{{ store.user?.role || '一般用戶' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
          <div class="content-container">
            <router-view />
          </div>
        </div>
      </div>
    </main>

    <!-- Progress Tracker -->
    <ProgressTracker />
    
    <!-- Floating Action Button (Mobile) -->
    <div v-if="isMobile" class="fab-container">
      <Button
        icon="pi pi-plus"
        class="p-button-rounded fab-button"
        @click="showQuickActions = !showQuickActions"
      />
      <div v-if="showQuickActions" class="quick-actions">
        <Button
          icon="pi pi-upload"
          class="p-button-rounded p-button-secondary quick-action-btn"
          v-tooltip.left="'上傳檔案'"
        />
        <Button
          icon="pi pi-folder-plus"
          class="p-button-rounded p-button-secondary quick-action-btn"
          v-tooltip.left="'新增資料夾'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'
import ProgressTracker from '../components/ProgressTracker.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import { MENU_NAMES } from '../menuNames'

const store = useAuthStore()
const route = useRoute()

const isCollapsed = ref(false)
const mobileSidebarVisible = ref(false)
const isMobile = ref(window.innerWidth <= 991)
const showQuickActions = ref(false)

const getPageTitle = () => {
  const path = route.path.substring(1)
  const menuKey = route.meta.menu || path
  return MENU_NAMES[menuKey] || '儀表板'
}

const getBreadcrumb = () => {
  const path = route.path.substring(1)
  const segments = path.split('/')
  const menuKey = route.meta.menu || segments[0]
  return segments.length > 1
    ? `${MENU_NAMES[menuKey]} / ${segments.slice(1).join('/')}`
    : MENU_NAMES[menuKey] || '首頁'
}

const onToggleCollapse = (collapsed) => {
  isCollapsed.value = collapsed
}

const toggleMobileSidebar = () => {
  mobileSidebarVisible.value = !mobileSidebarVisible.value
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 991
  if (!isMobile.value) {
    mobileSidebarVisible.value = false
    showQuickActions.value = false
  }
}

onMounted(() => {
  store.fetchProfile()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transition: padding-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding-left: 280px;
  position: relative;
}

.layout-wrapper.layout-sidebar-collapsed {
  padding-left: 5rem;
}

/* Mobile Header */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  z-index: 1002;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.mobile-menu-btn {
  margin-right: 1rem;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.mobile-menu-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mobile-brand-icon {
  font-size: 1.5rem;
  color: #667eea;
}

.mobile-brand-text {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.mobile-header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mobile-user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  padding: 2px;
}

/* Desktop Header */
.desktop-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 2rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -2rem -3rem 3rem -3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border-radius: 0 0 24px 24px;
}

.page-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;
}

.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-item {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-btn {
  position: relative;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
  width: 3rem;
  height: 3rem;
}

.notification-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

.user-profile-dropdown {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 0.75rem 1.25rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-profile-dropdown:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.user-role {
  font-size: 0.8rem;
  color: #64748b;
}

/* Main Content */
.layout-main {
  width: 100%;
  min-height: 100vh;
}

.layout-main-content {
  padding: 2rem 3rem;
}

.page-content {
  position: relative;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Floating Action Button */
.fab-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.fab-button {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  font-size: 1.25rem;
  transition: all 0.3s ease;
}

.fab-button:hover {
  transform: scale(1.1) rotate(45deg);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: slideInUp 0.3s ease-out;
}

.quick-action-btn {
  width: 3rem;
  height: 3rem;
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.quick-action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.05);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Responsive */
@media screen and (max-width: 991px) {
  .layout-wrapper {
    padding-left: 0;
    padding-top: 70px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .layout-wrapper.layout-sidebar-collapsed {
    padding-left: 0;
  }

  .layout-main-content {
    padding: 1.5rem;
  }

  .desktop-header {
    display: none;
  }

  .content-container {
    max-width: none;
  }
}

/* Tablet Responsive */
@media screen and (min-width: 992px) and (max-width: 1199px) {
  .layout-main-content {
    padding: 2rem;
  }
  
  .desktop-header {
    padding: 1.5rem 2rem;
    margin: -2rem -2rem 2rem -2rem;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .mobile-brand-text {
    font-size: 1.25rem;
  }
  
  .layout-main-content {
    padding: 1rem;
  }
  
  .fab-container {
    bottom: 1rem;
    right: 1rem;
  }
  
  .fab-button {
    width: 3.5rem;
    height: 3.5rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .content-container,
  .quick-actions,
  .fab-button {
    animation: none;
    transition: none;
  }
}

/* Print styles */
@media print {
  .mobile-header,
  .desktop-header,
  .fab-container {
    display: none !important;
  }
  
  .layout-main-content {
    padding: 0 !important;
  }
  
  .layout-wrapper {
    padding-left: 0 !important;
  }
}
</style>
