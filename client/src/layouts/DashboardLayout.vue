<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'

const store = useAuthStore()
onMounted(() => store.fetchProfile()) // 重新整理時取個人資訊
</script>

<template>
  <div class="flex">
    <Sidebar />
    <main class="flex-1 p-6 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>
