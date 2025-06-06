<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const props = defineProps({
  collapsed: Boolean
})

const theme = useThemeStore()

const label = computed(() => (theme.dark ? '切換為白天模式' : '切換為黑夜模式'))
const icon = computed(() => (theme.dark ? '🌞' : '🌙'))
</script>

<template>
  <button @click="theme.toggle()" class="w-full py-2 mt-4 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center">
    <span>{{ icon }}</span>
    <span v-if="!props.collapsed" class="ml-2">{{ label }}</span>
  </button>
</template>
