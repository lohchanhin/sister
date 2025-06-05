<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const theme = useThemeStore()

const label = computed(() => (theme.dark ? '切換為白天模式' : '切換為黑夜模式'))
const icon = computed(() => (theme.dark ? '🌞' : '🌙'))
</script>

<template>
  <button @click="theme.toggle()" class="w-full py-2 mt-4 rounded bg-blue-600 hover:bg-blue-700 text-white">
    {{ icon }} {{ label }}
  </button>
</template>
