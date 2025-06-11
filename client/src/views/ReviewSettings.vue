<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchReviewStages, createReviewStage, updateReviewStage, deleteReviewStage } from '../services/reviewStages'
import { fetchUsers } from '../services/user'
import { useAuthStore } from '../stores/auth'

const store = useAuthStore()
if (!store.user.permissions.includes('review:manage')) {
  window.location.href = '/'
}

const stages = ref([])
const users = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '', order: 1, responsible: '' })

const loadStages = async () => { stages.value = await fetchReviewStages() }
const loadUsers = async () => { users.value = await fetchUsers() }

const openCreate = () => {
  editing.value = false
  form.value = { name: '', order: 1, responsible: '' }
  dialog.value = true
}

const openEdit = s => {
  editing.value = true
  form.value = { ...s, responsible: s.responsible?._id }
  dialog.value = true
}

const submit = async () => {
  const data = { name: form.value.name, order: form.value.order, responsible: form.value.responsible }
  if (editing.value) {
    await updateReviewStage(form.value._id, data)
    ElMessage.success('已更新階段')
  } else {
    await createReviewStage(data)
    ElMessage.success('已新增階段')
  }
  dialog.value = false
  await loadStages()
}

const removeStage = async s => {
  await ElMessageBox.confirm(`確定刪除「${s.name}」？`, '警告', {
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await deleteReviewStage(s._id)
  ElMessage.success('已刪除階段')
  await loadStages()
}

onMounted(() => {
  loadStages()
  loadUsers()
})
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <h1 class="text-2xl font-bold">審查關卡設定</h1>
    <el-button type="primary" @click="openCreate">＋ 新增關卡</el-button>
    <el-table :data="stages" style="width:100%" stripe border>
      <el-table-column prop="order" label="順序" width="80" />
      <el-table-column prop="name" label="名稱" />
      <el-table-column prop="responsible.username" label="負責人" />

      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">編輯</el-button>
          <el-button link type="danger" @click="removeStage(row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? '編輯關卡' : '新增關卡'" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="名稱"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="順序"><el-input-number v-model="form.order" :min="1" style="width:100%" /></el-form-item>
        <el-form-item label="負責人">
          <el-select v-model="form.responsible" placeholder="選擇負責人" style="width:100%">
            <el-option v-for="u in users" :key="u._id" :label="u.username" :value="u._id" />

          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog=false">取消</el-button>
        <el-button type="primary" @click="submit">{{ editing ? '更新' : '建立' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>
