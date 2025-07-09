<template>
  <transition name="slide-up">
    <div v-if="ui.uploading > 0" class="snackbar">
      正在上傳中...
    </div>
  </transition>
</template>

<script setup>
import { useUiStore } from '../stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.snackbar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(55, 65, 81, 0.9);
  color: #fff;
  border-radius: 4px;
  z-index: 5000;
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all .3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
