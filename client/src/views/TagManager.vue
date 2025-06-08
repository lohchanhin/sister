<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchTags, createTag, updateTag, deleteTag } from '../services/tags'
import { useAuthStore } from '../stores/auth'

const store = useAuthStore()
if (store.role !== 'manager') {
  window.location.href = '/'
}

const tags = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '' })

const loadTags = async () => {
  tags.value = await fetchTags()
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '' }
  dialog.value = true
}

const openEdit = t => {
  editing.value = true
  form.value = { ...t }
  dialog.value = true
}

const submit = async () => {
  if (editing.value) {
    await updateTag(form.value._id, { name: form.value.name })
    ElMessage.success('已更新標籤')
  } else {
    await createTag({ name: form.value.name })
    ElMessage.success('已新增標籤')
  }
  dialog.value = false
  await loadTags()
}

const removeTag = async t => {
  await ElMessageBox.confirm(`確定刪除「${t.name}」？`, '警告', {
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await deleteTag(t._id)
  ElMessage.success('已刪除標籤')
  await loadTags()
}

onMounted(loadTags)
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <h1 class="text-2xl font-bold">標籤管理</h1>
    <el-button type="primary" @click="openCreate">＋ 新增標籤</el-button>
    <el-table :data="tags" style="width:100%" stripe border>
      <el-table-column prop="name" label="名稱" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">編輯</el-button>
          <el-button link type="danger" @click="removeTag(row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialog" :title="editing ? '編輯標籤' : '新增標籤'" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="標籤名稱"><el-input v-model="form.name" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog=false">取消</el-button>
        <el-button type="primary" @click="submit">{{ editing ? '更新' : '建立' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>
