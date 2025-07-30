<template>
  <div class="theme-toggle-wrapper">
    <Button
      class="theme-toggle-btn"
      @click="toggleTheme"
      v-tooltip.bottom="isDark ? '切換到淺色主題' : '切換到深色主題'"
    >
      <div class="toggle-container">
        <div class="toggle-track" :class="{ 'toggle-track-dark': isDark }">
          <div class="toggle-thumb" :class="{ 'toggle-thumb-dark': isDark }">
            <i :class="isDark ? 'pi pi-moon' : 'pi pi-sun'" class="toggle-icon"></i>
          </div>
        </div>
      </div>
    </Button>
  </div>
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
  
  // Add transition effect
  document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease'
  setTimeout(() => {
    document.body.style.transition = ''
  }, 300)
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
.theme-toggle-wrapper {
  display: flex;
  align-items: center;
}

.theme-toggle-btn {
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.theme-toggle-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.05);
}

.toggle-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-track {
  width: 3rem;
  height: 1.5rem;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 1rem;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(251, 191, 36, 0.3);
}

.toggle-track-dark {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(30, 41, 59, 0.4);
}

.toggle-thumb {
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.toggle-thumb-dark {
  transform: translateX(1.5rem);
  background: #1e293b;
}

.toggle-icon {
  font-size: 0.75rem;
  color: #f59e0b;
  transition: all 0.3s ease;
}

.toggle-thumb-dark .toggle-icon {
  color: #fbbf24;
}

/* Hover effects */
.theme-toggle-btn:hover .toggle-track {
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 16px rgba(251, 191, 36, 0.4);
}

.theme-toggle-btn:hover .toggle-track-dark {
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(30, 41, 59, 0.5);
}

.theme-toggle-btn:hover .toggle-thumb {
  transform: scale(1.1);
}

.theme-toggle-btn:hover .toggle-thumb-dark {
  transform: translateX(1.5rem) scale(1.1);
}

/* Active state */
.theme-toggle-btn:active .toggle-thumb {
  transform: scale(0.95);
}

.theme-toggle-btn:active .toggle-thumb-dark {
  transform: translateX(1.5rem) scale(0.95);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .toggle-track,
  .toggle-thumb,
  .toggle-icon,
  .theme-toggle-btn {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .toggle-track {
    border: 2px solid currentColor;
  }
  
  .toggle-thumb {
    border: 1px solid currentColor;
  }
}
</style>
