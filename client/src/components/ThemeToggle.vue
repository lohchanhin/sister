<template>
  <Button
    :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
    class="p-button-text p-button-rounded theme-toggle"
    @click="toggleTheme"
    v-tooltip.bottom="isDark ? '切換到淺色主題' : '切換到深色主題'"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  
  // Update theme
  const themeLink = document.getElementById('theme-link')
  if (themeLink) {
    themeLink.href = `/themes/lara-${theme}-blue/theme.css`
  }
  
  // Save preference
  localStorage.setItem('theme', theme)
  
  // Update body class for custom styling
  document.body.classList.toggle('dark-theme', isDark.value)
}

onMounted(() => {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light'
  isDark.value = savedTheme === 'dark'
  
  if (isDark.value) {
    document.body.classList.add('dark-theme')
  }
})
</script>

<style scoped>
.theme-toggle {
  width: 2.5rem;
  height: 2.5rem;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: var(--surface-hover);
  transform: scale(1.05);
}
</style>
