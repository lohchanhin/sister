<template>
  <div class="unauthorized-page">
    <div class="unauthorized-card">
      <div class="unauthorized-icon">
        <i class="pi pi-shield"></i>
      </div>
      <h1 class="unauthorized-title">無權限</h1>
      <p class="unauthorized-message">
        您沒有存取此功能的權限，若需要協助請聯繫管理員。
      </p>
      <p v-if="redirectPath" class="unauthorized-target" data-test="redirect-info">
        嘗試造訪的頁面：<span class="unauthorized-target-path">{{ redirectPath }}</span>
      </p>
      <div class="unauthorized-actions">
        <Button
          data-test="go-home"
          label="返回首頁"
          icon="pi pi-home"
          @click="goHome"
        />
        <Button
          data-test="go-back"
          label="返回上一頁"
          icon="pi pi-arrow-left"
          severity="secondary"
          @click="goBack"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()

const redirectPath = computed(() => {
  const redirect = Array.isArray(route.query.redirect)
    ? route.query.redirect[0]
    : route.query.redirect
  return typeof redirect === 'string' ? redirect : ''
})

const canNavigateBack = computed(() => {
  const historyState = router.options?.history?.state
  if (historyState && typeof historyState.back !== 'undefined') {
    return Boolean(historyState.back)
  }
  return window.history.length > 1
})

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  if (redirectPath.value && redirectPath.value !== route.fullPath) {
    router.push(redirectPath.value)
    return
  }
  if (canNavigateBack.value) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.unauthorized-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  padding: 2rem;
}

.unauthorized-card {
  max-width: 420px;
  width: 100%;
  background: #fff;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: 0 25px 65px -25px rgba(79, 70, 229, 0.4);
  text-align: center;
}

.unauthorized-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 70, 229, 0.12);
  color: #4f46e5;
  font-size: 1.75rem;
}

.unauthorized-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.unauthorized-message {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.unauthorized-target {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 1.75rem;
}

.unauthorized-target-path {
  display: inline-block;
  margin-top: 0.25rem;
  padding: 0.35rem 0.75rem;
  background: #f3f4f6;
  border-radius: 9999px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.85rem;
  color: #374151;
}

.unauthorized-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
