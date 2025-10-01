<template>
  <div class="popular-data">
    <header class="popular-data__header">
      <div>
        <h1>爆款數據</h1>
        <p class="subtitle">選擇客戶以檢視不同平台的爆款內容</p>
      </div>
      <span class="search">
        <i class="pi pi-search"></i>
        <InputText v-model="keyword" placeholder="搜尋客戶名稱" />
      </span>
    </header>

    <section v-if="loading" class="loading">載入客戶中…</section>

    <section v-else class="popular-data__content">
      <p v-if="filteredClients.length === 0" class="empty">目前沒有符合條件的客戶</p>
      <div v-else class="client-grid">
        <Card v-for="client in filteredClients" :key="client._id" class="client-card">
          <template #content>
            <h2>{{ client.name }}</h2>
            <p class="client-meta">{{ client.industry || '未設定產業' }}</p>
            <Button label="選擇" icon="pi pi-chevron-right" class="p-button-rounded" @click="goToPlatforms(client)" />
          </template>
        </Card>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { fetchClients } from '@/services/clients'

const router = useRouter()
const toast = useToast()

const loading = ref(true)
const keyword = ref('')
const clients = ref([])

const filteredClients = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return clients.value
  return clients.value.filter((client) => {
    const name = (client?.name ?? '').toLowerCase()
    return name.includes(k)
  })
})

const loadClients = async () => {
  loading.value = true
  try {
    clients.value = await fetchClients()
  } catch (error) {
    toast.add({ severity: 'error', summary: '載入失敗', detail: '無法取得客戶列表', life: 3000 })
  } finally {
    loading.value = false
  }
}

const goToPlatforms = (client) => {
  router.push({ name: 'PopularDataPlatforms', params: { clientId: client._id } })
}

onMounted(loadClients)
</script>

<style scoped>
.popular-data {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.popular-data__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.popular-data__header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
}

.search {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
}

.search i {
  color: #9ca3af;
}

.loading {
  text-align: center;
  color: #6b7280;
}

.popular-data__content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.client-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.client-card {
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.client-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.15);
}

.client-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #111827;
}

.client-meta {
  margin: 0 0 1rem;
  color: #6b7280;
}

.empty {
  text-align: center;
  color: #9ca3af;
}

@media (max-width: 600px) {
  .popular-data {
    padding: 1.5rem;
  }
  .search {
    width: 100%;
    justify-content: center;
  }
}
</style>
