<template>
  <div class="popular-platforms">
    <header class="platforms-header">
      <Button label="返回" icon="pi pi-arrow-left" class="p-button-text" @click="goBack" />
      <div class="title-group">
        <h1>{{ clientName || '選擇平台' }}</h1>
        <p>請選擇要查看的爆款數據平台</p>
      </div>
    </header>

    <section class="platforms-grid">
      <Button label="TikTok" icon="pi pi-video" disabled class="platform-button platform-button--muted" />
      <Button label="Facebook" icon="pi pi-facebook" disabled class="platform-button platform-button--muted" />
      <Button label="小紅書" icon="pi pi-book" class="platform-button platform-button--active" @click="goXhs" />
    </section>

    <p class="hint">TikTok 與 Facebook 功能即將推出，敬請期待。</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import { getClient } from '@/services/clients'

const props = defineProps({
  clientId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const route = useRoute()
const clientName = ref(route.query.clientName || '')

const goBack = () => {
  router.push({ name: 'PopularDataClients' })
}

const goXhs = () => {
  router.push({ name: 'PopularDataXhs', params: { clientId: props.clientId } })
}

onMounted(async () => {
  if (!clientName.value) {
    try {
      const client = await getClient(props.clientId)
      clientName.value = `${client.name}｜平台選擇`
    } catch {
      clientName.value = '平台選擇'
    }
  }
})
</script>

<style scoped>
.popular-platforms {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.platforms-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.title-group h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.title-group p {
  margin: 0.25rem 0 0;
  color: #6b7280;
}

.platforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.platform-button {
  padding: 1.5rem 1rem;
  border-radius: 1rem;
  font-size: 1.25rem;
}

.platform-button--muted {
  background: #f3f4f6 !important;
  color: #9ca3af !important;
  border: none !important;
}

.platform-button--active {
  background: linear-gradient(135deg, #f87171, #f97316);
  border: none;
  color: #fff;
  box-shadow: 0 15px 35px rgba(249, 115, 22, 0.25);
}

.platform-button--active:hover {
  box-shadow: 0 20px 40px rgba(249, 115, 22, 0.35);
}

.hint {
  color: #9ca3af;
}
</style>
