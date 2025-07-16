<template>
  <transition name="slide-up">
    <div v-if="Object.keys(ui.uploads).length" class="snackbar">
      <div v-for="(u, id) in ui.uploads" :key="id" class="item">
        <span class="name">{{ u.name }}</span>
        <div class="progress">
          <div class="bar" :class="{ error: u.error }" :style="{ width: u.percent + '%' }"></div>
        </div>
      </div>
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
.item {
  margin-bottom: 4px;
}
.name {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 2px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.progress {
  width: 200px;
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
}
.bar {
  height: 100%;
  background: #4ade80;
  border-radius: 2px;
}
.bar.error {
  background: #f87171;
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
