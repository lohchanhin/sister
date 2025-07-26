<template>
  <div class="layout-wrapper" :class="{ 'layout-sidebar-collapsed': isCollapsed }">
    <!-- Mobile menu button -->
    <Button
      v-if="isMobile"
      icon="pi pi-bars"
      class="p-button-text p-button-rounded layout-mobile-menu-button"
      @click="toggleMobileSidebar"
    />

    <Sidebar :mobileVisible="mobileSidebarVisible" @update:mobileVisible="mobileSidebarVisible = $event" @toggle-collapse="onToggleCollapse" />
    <main class="layout-main">
      <div class="layout-main-content">
        <router-view />
      </div>
    </main>
    <ProgressTracker />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'
import ProgressTracker from '../components/ProgressTracker.vue'
import Button from 'primevue/button' // Import Button component

const store = useAuthStore()
onMounted(() => store.fetchProfile()) // 重新整理時取個人資訊

const isCollapsed = ref(false)
const mobileSidebarVisible = ref(false) // New ref for mobile sidebar visibility
const isMobile = ref(window.innerWidth <= 991) // PrimeFlex 'md' breakpoint

const onToggleCollapse = (collapsed) => {
  isCollapsed.value = collapsed
}

const toggleMobileSidebar = () => {
  mobileSidebarVisible.value = !mobileSidebarVisible.value
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 991
  if (!isMobile.value) {
    mobileSidebarVisible.value = false; // Close mobile sidebar if resized to desktop
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
.layout-wrapper {
  transition: padding-left 0.2s ease-in-out;
  /* Default for larger screens */
  padding-left: 250px; /* Sidebar width */
}

.layout-wrapper.layout-sidebar-collapsed {
  padding-left: 5rem; /* Collapsed sidebar width */
}

.layout-main {
  width: 100%;
}

.layout-main-content {
  padding: 2rem;
}

/* Responsive adjustments for smaller screens */
@media screen and (max-width: 991px) { /* PrimeFlex 'md' breakpoint is 991px */
  .layout-wrapper {
    padding-left: 0; /* No padding on mobile, sidebar will overlay */
  }

  .layout-wrapper.layout-sidebar-collapsed {
    padding-left: 0; /* No padding on mobile, sidebar will overlay */
  }

  .layout-mobile-menu-button {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 1001; /* Above sidebar mask */
  }
}
</style>