<!-- ReviewSettings.vue (PrimeVue Refactored) -->
<template>
  <Card>
    <template #title>
      <div class="flex justify-content-between align-items-center">
        <h1 class="text-2xl font-bold">審查關卡設定</h1>
        <Button label="新增關卡" icon="pi pi-plus" @click="openCreate" />
      </div>
    </template>
    <template #content>
      <DataTable :value="stages" :loading="loading" responsiveLayout="scroll">
        <Column field="order" header="順序" :sortable="true" style="width: 80px"></Column>
        <Column field="name" header="名稱" :sortable="true"></Column>
        <Column field="responsible.username" header="負責人" :sortable="true"></Column>
        <Column header="操作" :exportable="false" style="min-width:8rem">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="openEdit(data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteStage(data)" />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog v-model:visible="dialog" :header="editing ? '編輯關卡' : '新增關卡'" :modal="true" class="p-fluid w-full md:w-25rem">
    <div class="field">
      <label for="name">名稱</label>
      <InputText id="name" v-model.trim="form.name" required="true" autofocus />
    </div>
    <div class="field">
      <label for="order">順序</label>
      <InputNumber id="order" v-model="form.order" :min="1" />
    </div>
    <div class="field">
      <label for="responsible">負責人</label>
      <Dropdown id="responsible" v-model="form.responsible" :options="users" optionLabel="username" optionValue="_id" placeholder="選擇負責人" />
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
import { fetchReviewStages, createReviewStage, updateReviewStage, deleteReviewStage } from '../services/reviewStages'
import { fetchUsers } from '../services/user'
import { useAuthStore } from '../stores/auth'

// PrimeVue Components
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const authStore = useAuthStore()

if (!authStore.hasPermission('review:manage')) {
  router.replace('/')
}

const loading = ref(true)
const stages = ref([])
const users = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '', order: 1, responsible: '' })

const loadStages = async () => {
  loading.value = true
  try {
    stages.value = await fetchReviewStages()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load stages', life: 3000 })
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    users.value = await fetchUsers()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users', life: 3000 })
  }
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '', order: 1, responsible: '' }
  dialog.value = true
}

const openEdit = (stage) => {
  editing.value = true
  form.value = { ...stage, responsible: stage.responsible?._id }
  dialog.value = true
}

const submit = async () => {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Stage name is required', life: 3000 })
    return
  }

  try {
    const data = { name: form.value.name, order: form.value.order, responsible: form.value.responsible }
    if (editing.value) {
      await updateReviewStage(form.value._id, data)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Stage updated', life: 3000 })
    } else {
      await createReviewStage(data)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Stage created', life: 3000 })
    }
    dialog.value = false
    loadStages()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Operation failed', life: 3000 })
  }
}

const confirmDeleteStage = (stage) => {
  confirm.require({
    message: `確定要刪除「${stage.name}」嗎？`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteReviewStage(stage._id)
        toast.add({ severity: 'success', summary: 'Success', detail: 'Stage deleted', life: 3000 })
        loadStages()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Deletion failed', life: 3000 })
      }
    }
  });
}

onMounted(() => {
  loadStages()
  loadUsers()
})
</script>
