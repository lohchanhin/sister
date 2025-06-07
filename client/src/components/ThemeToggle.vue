<script setup>
import { computed, toRefs } from 'vue'
import { useThemeStore } from '../stores/theme'

const props = defineProps({
  collapsed: Boolean
})

const { collapsed } = toRefs(props)
const theme = useThemeStore()

const label = computed(() => (theme.dark ? '' : ''))
const icon = computed(() => (theme.dark ? '🌞' : '🌙'))
</script>

<template>
  <button @click="theme.toggle()" class="w-full py-2 mt-4 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center">
    <span>{{ icon }}</span>
    <span v-if="!collapsed" class="ml-2">{{ label }}</span>
  </button>
</template>
