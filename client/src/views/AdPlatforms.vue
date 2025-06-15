<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchPlatforms, createPlatform, updatePlatform, deletePlatform } from '../services/platforms'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId
const platforms = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '', platformType: '', fields: [] })
const newField = ref('')

const addField = () => {
  const v = newField.value.trim()
  if (v && !form.value.fields.includes(v)) {
    form.value.fields.push(v)
  }
  newField.value = ''
}

const removeField = i => {
  form.value.fields.splice(i, 1)
}

const loadPlatforms = async () => {
  platforms.value = await fetchPlatforms(clientId)
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '', platformType: '', fields: [] }
  dialog.value = true
}

const openEdit = p => {
  editing.value = true
  form.value = { ...p, fields: p.fields || [] }
  dialog.value = true
}

const submit = async () => {
  try {
    if (editing.value) {
      await updatePlatform(clientId, form.value._id, form.value)
      ElMessage.success('已更新平台')
    } else {
      await createPlatform(clientId, form.value)
      ElMessage.success('已新增平台')
    }
    dialog.value = false
    await loadPlatforms()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message)
  }
}

const manageData = p => {
  router.push(`/clients/${clientId}/platforms/${p._id}/data`)
}

const removePlatform = async p => {
  await ElMessageBox.confirm(`確定刪除「${p.name}」？`, '警告', { confirmButtonText: '刪除', cancelButtonText: '取消', type: 'warning' })
  await deletePlatform(clientId, p._id)
  ElMessage.success('已刪除平台')
  await loadPlatforms()
}

onMounted(loadPlatforms)
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <el-button @click="router.back()">返回上層</el-button>
    <h1 class="text-2xl font-bold">平台管理</h1>
    <el-button type="primary" @click="openCreate">＋ 新增平台</el-button>
    <el-table :data="platforms" stripe style="width:100%" class="mt-4">
      <el-table-column prop="name" label="名稱" />
      <el-table-column prop="platformType" label="類型" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="manageData(row)">數據</el-button>
          <el-button link type="primary" @click="openEdit(row)">編輯</el-button>
          <el-button link type="danger" @click="removePlatform(row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? '編輯平台' : '新增平台'" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="平台名稱"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="類型"><el-input v-model="form.platformType" /></el-form-item>
      <el-form-item label="自訂欄位">
        <div class="flex items-center gap-2 mb-2">
          <el-input v-model="newField" @keyup.enter.native.prevent="addField" placeholder="欄位名稱" class="flex-1" />
          <el-button type="primary" @click="addField">新增</el-button>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-tag v-for="(f,i) in form.fields" :key="i" closable @close="removeField(i)">{{ f }}</el-tag>
        </div>
      </el-form-item>
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
