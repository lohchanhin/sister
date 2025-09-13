<template>
  <Card>
    <template #title>
      <div class="flex justify-content-between align-items-center">
        <h1 class="text-2xl font-bold">使用者客戶授權</h1>
        <Button label="儲存" icon="pi pi-save" @click="save" />
      </div>
    </template>
    <template #content>
      <DataTable
        v-model:selection="selected"
        v-model:filters="filters"
        :globalFilterFields="['name']"
        :value="clients"
        dataKey="_id"
        :paginator="true"
        :rows="10"
        filterDisplay="menu"
      >
        <template #header>
          <div class="flex justify-content-end">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="filters['global'].value" placeholder="搜尋客戶" />
            </span>
          </div>
        </template>
        <Column selectionMode="multiple" headerStyle="width:3rem"></Column>
        <Column field="name" header="客戶名稱" sortable></Column>
      </DataTable>
    </template>
  </Card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode } from 'primevue/api'
import { fetchClients } from '../services/clients'
import { fetchUserClients, updateUserClients } from '../services/user'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const userId = route.params.userId
const clients = ref([])
const selected = ref([])
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

onMounted(async () => {
  clients.value = await fetchClients()
  const userClients = await fetchUserClients(userId)
  selected.value = clients.value.filter(c => userClients.some(u => u._id === c._id))
})

const save = async () => {
  await updateUserClients(userId, selected.value.map(c => c._id))
  toast.add({ severity: 'success', summary: '成功', detail: '已更新', life: 3000 })
  router.back()
}
</script>
