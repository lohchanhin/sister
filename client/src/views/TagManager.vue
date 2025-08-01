<!-- TagManager.vue (PrimeVue Refactored) -->
<template>
  <Card>
    <template #title>
      <div class="flex justify-content-between align-items-center">
        <h1 class="text-2xl font-bold">标签管理</h1>
        <Button label="新增标签" icon="pi pi-plus" @click="openCreate" />
      </div>
    </template>
    <template #content>
      <DataTable :value="tags" :loading="loading" responsiveLayout="scroll">
        <Column field="name" header="名稱" :sortable="true"></Column>
        <Column header="操作" :exportable="false" style="min-width:8rem">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="openEdit(data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteTag(data)" />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog v-model:visible="dialog" :header="editing ? '编辑标签' : '新增标签'" :modal="true" class="p-fluid w-full md:w-20rem">
    <div class="field">
      <label for="name">标签名称</label>
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
import { fetchTags, createTag, updateTag, deleteTag } from '../services/tags'
import { useAuthStore } from '../stores/auth'

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
const authStore = useAuthStore()

if (!authStore.hasPermission('tag:manage')) {
  router.replace('/')
}

const loading = ref(true)
const tags = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '' })

const loadTags = async () => {
  loading.value = true
  try {
    tags.value = await fetchTags()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load tags', life: 3000 })
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '' }
  dialog.value = true
}

const openEdit = (tag) => {
  editing.value = true
  form.value = { ...tag }
  dialog.value = true
}

const submit = async () => {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Tag name is required', life: 3000 })
    return
  }

  try {
    if (editing.value) {
      await updateTag(form.value._id, { name: form.value.name })
      toast.add({ severity: 'success', summary: 'Success', detail: 'Tag updated', life: 3000 })
    } else {
      await createTag({ name: form.value.name })
      toast.add({ severity: 'success', summary: 'Success', detail: 'Tag created', life: 3000 })
    }
    dialog.value = false
    loadTags()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Operation failed', life: 3000 })
  }
}

const confirmDeleteTag = (tag) => {
  confirm.require({
    message: `确定要删除「${tag.name}」吗？`,
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteTag(tag._id)
        toast.add({ severity: 'success', summary: 'Success', detail: 'Tag deleted', life: 3000 })
        loadTags()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Deletion failed', life: 3000 })
      }
    }
  });
}

onMounted(loadTags)
</script>
