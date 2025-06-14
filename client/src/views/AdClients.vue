<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchClients, createClient, updateClient, deleteClient } from '../services/clients'

const router = useRouter()
const clients = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '' })

const loadClients = async () => {
  clients.value = await fetchClients()
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '' }
  dialog.value = true
}

const openEdit = c => {
  editing.value = true
  form.value = { ...c }
  dialog.value = true
}

const submit = async () => {
  if (editing.value) {
    await updateClient(form.value._id, form.value)
    ElMessage.success('已更新客戶')
  } else {
    await createClient(form.value)
    ElMessage.success('已新增客戶')
  }
  dialog.value = false
  await loadClients()
}

const managePlatforms = c => {
  router.push(`/clients/${c._id}/platforms`)
}

const removeClient = async c => {
  await ElMessageBox.confirm(`確定刪除「${c.name}」？`, '警告', { confirmButtonText: '刪除', cancelButtonText: '取消', type: 'warning' })
  await deleteClient(c._id)
  ElMessage.success('已刪除客戶')
  await loadClients()
}

onMounted(loadClients)
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <h1 class="text-2xl font-bold">客戶管理</h1>
    <el-button type="primary" @click="openCreate">＋ 新增客戶</el-button>
    <el-table :data="clients" stripe style="width:100%" class="mt-4">
      <el-table-column prop="name" label="客戶名稱" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="managePlatforms(row)">平台</el-button>
          <el-button link type="primary" @click="openEdit(row)">編輯</el-button>
          <el-button link type="danger" @click="removeClient(row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? '編輯客戶' : '新增客戶'" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="客戶名稱"><el-input v-model="form.name" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog=false">取消</el-button>
        <el-button type="primary" @click="submit">{{ editing ? '更新' : '建立' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
</style>
