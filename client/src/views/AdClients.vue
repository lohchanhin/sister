<!-- AdClients.vue (PrimeVue Refactored) -->
<template>
  <Card>
    <template #title>
      <div class="flex justify-content-between align-items-center">
        <h1 class="text-2xl font-bold">客戶管理</h1>
        <Button label="新增客戶" icon="pi pi-plus" @click="openCreate" />
      </div>
    </template>
    <template #content>
      <DataTable :value="clients" :loading="loading" responsiveLayout="scroll">
        <Column field="name" header="客戶名稱" :sortable="true"></Column>
        <Column header="操作" :exportable="false" style="min-width:12rem">
          <template #body="{ data }">
            <Button label="平台" icon="pi pi-sitemap" class="p-button-text p-button-info" @click="managePlatforms(data)" />
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="openEdit(data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteClient(data)" />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog v-model:visible="dialog" :header="editing ? '編輯客戶' : '新增客戶'" :modal="true" class="p-fluid w-full md:w-20rem">
    <div class="field">
      <label for="name">客戶名稱</label>
      <InputText id="name" v-model.trim="form.name" required="true" autofocus />
    </div>
    <template #footer>
      <Button label="取消" icon="pi pi-times" class="p-button-text" @click="dialog = false"/>
      <Button :label="editing ? '更新' : '建立'" icon="pi pi-check" @click="submit" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { fetchClients, createClient, updateClient, deleteClient } from '../services/clients'

// PrimeVue Components
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()

const loading = ref(true)
const clients = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '' })

const loadClients = async () => {
  loading.value = true
  try {
    clients.value = await fetchClients()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load clients', life: 3000 })
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '' }
  dialog.value = true
}

const openEdit = (client) => {
  editing.value = true
  form.value = { ...client }
  dialog.value = true
}

const submit = async () => {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Client name is required', life: 3000 })
    return
  }

  try {
    if (editing.value) {
      await updateClient(form.value._id, form.value)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Client updated', life: 3000 })
    } else {
      await createClient(form.value)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Client created', life: 3000 })
    }
    dialog.value = false
    loadClients()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Operation failed', life: 3000 })
  }
}

const managePlatforms = (client) => {
  router.push(`/clients/${client._id}/platforms`)
}

const confirmDeleteClient = (client) => {
  confirm.require({
    message: `確定要刪除「${client.name}」嗎？`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteClient(client._id)
        toast.add({ severity: 'success', summary: 'Success', detail: 'Client deleted', life: 3000 })
        loadClients()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Deletion failed', life: 3000 })
      }
    }
  });
}

onMounted(loadClients)
</script>