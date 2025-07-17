<template>
  <div class="layout-wrapper" :class="{ 'layout-sidebar-collapsed': isCollapsed }">
    <Sidebar @toggle-collapse="onToggleCollapse" />
    <main class="layout-main">
      <div class="layout-main-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'

const store = useAuthStore()
onMounted(() => store.fetchProfile()) // 重新整理時取個人資訊

const isCollapsed = ref(false)
const onToggleCollapse = (collapsed) => {
  isCollapsed.value = collapsed
}
</script>

<style scoped>
.layout-wrapper {
  transition: padding-left 0.2s ease-in-out;
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
</style>