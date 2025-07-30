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
        <h2 class="m-0">Sister 管理系統</h2>
      </div>
      <div class="mobile-header-actions">
        <ThemeToggle />
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
            <h1 class="page-title">{{ getPageTitle() }}</h1>
          </div>
          <div class="header-right">
            <ThemeToggle />
            <div class="user-info">
              <Avatar 
                :label="store.user?.name?.charAt(0) || 'U'" 
                class="mr-2" 
                shape="circle" 
                size="normal"
              />
              <span class="user-name">{{ store.user?.name || '用戶' }}</span>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
          <router-view />
        </div>
      </div>
    </main>

    <!-- Progress Tracker -->
    <ProgressTracker />
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

const getPageTitle = () => {
  const path = route.path.substring(1)
  return MENU_NAMES[path] || '儀表板'
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
  background: var(--surface-ground);
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding-left: 250px;
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
  height: 60px;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  padding: 0 1rem;
  z-index: 1002;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mobile-menu-btn {
  margin-right: 1rem;
}

.mobile-header-title h2 {
  color: var(--text-color);
  font-weight: 600;
  font-size: 1.25rem;
}

.mobile-header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Desktop Header */
.desktop-header {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -2rem -2rem 2rem -2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.page-title {
  margin: 0;
  color: var(--text-color);
  font-size: 1.5rem;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--surface-a);
  border-radius: 2rem;
  border: 1px solid var(--surface-border);
}

.user-name {
  font-weight: 500;
  color: var(--text-color);
}

/* Main Content */
.layout-main {
  width: 100%;
  min-height: 100vh;
}

.layout-main-content {
  padding: 2rem;
}

.page-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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
    padding-top: 60px;
  }

  .layout-wrapper.layout-sidebar-collapsed {
    padding-left: 0;
  }

  .layout-main-content {
    padding: 1rem;
  }

  .desktop-header {
    display: none;
  }
}

/* Tablet Responsive */
@media screen and (min-width: 992px) and (max-width: 1199px) {
  .layout-main-content {
    padding: 1.5rem;
  }
  
  .desktop-header {
    padding: 1rem 1.5rem;
    margin: -1.5rem -1.5rem 1.5rem -1.5rem;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .mobile-header-title h2 {
    font-size: 1rem;
  }
  
  .layout-main-content {
    padding: 0.75rem;
  }
}
</style>
