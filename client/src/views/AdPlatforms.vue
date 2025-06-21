<script setup>
import { ref, onMounted, watch } from 'vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'

import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchPlatforms, createPlatform, updatePlatform, deletePlatform } from '../services/platforms'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId
const platforms = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '', platformType: '', mode: 'custom', fields: [] })
const defaultFields = [
  { name: 'spent', type: 'number' },
  { name: 'enquiries', type: 'number' },
  { name: 'reach', type: 'number' },
  { name: 'impressions', type: 'number' },
  { name: 'clicks', type: 'number' }
]
const newFieldName = ref('')
const newFieldType = ref('number')

const addField = () => {
  const name = newFieldName.value.trim()
  const type = newFieldType.value
  if (name && !form.value.fields.find(f => f.name === name)) {
    form.value.fields.push({ name, type })
  }
  newFieldName.value = ''
}

const removeField = i => {
  form.value.fields.splice(i, 1)
}

const loadPlatforms = async () => {
  platforms.value = await fetchPlatforms(clientId)
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '', platformType: '', mode: 'custom', fields: [] }
  dialog.value = true
}

const openEdit = p => {
  editing.value = true
  form.value = {
    ...p,
    fields: (p.fields || []).map(f =>
      typeof f === 'string' ? { name: f, type: 'text' } : f
    ),
    mode: p.mode || 'custom'
  }
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

watch(
  () => form.value.mode,
  m => {
    if (m === 'default')
      form.value.fields = defaultFields.map(f => ({ ...f }))
    else if (m === 'custom') form.value.fields = []
  }
)

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
        <el-form-item label="模式">
          <el-select v-model="form.mode">
            <el-option label="預設" value="default" />
            <el-option label="自訂" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="自訂欄位">
          <div class="flex items-center gap-2 mb-2">
            <el-input v-model="newFieldName" @keyup.enter.native.prevent="addField" placeholder="欄位名稱" class="flex-1" />
            <el-select v-model="newFieldType" style="width:100px">
              <el-option label="數字" value="number" />
              <el-option label="文字" value="text" />
              <el-option label="日期" value="date" />
            </el-select>
            <el-button type="primary" @click="addField">新增</el-button>
          </div>
          <!-- 自訂欄位 tag 容器加個 class -->
          <draggable v-model="form.fields" item-key="name" class="tag-wrap flex flex-wrap gap-2" handle=".drag-handle">
            <template #item="{ element, index }">
              <el-tag closable @close="removeField(index)">
                <span class="drag-handle mr-1 cursor-move">☰</span>
                {{ element.name }}<span class="ml-1 text-xs">({{ element.type }})</span>
              </el-tag>
            </template>
          </draggable>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">{{ editing ? '更新' : '建立' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
:deep(.el-form-item__content) .tag-wrap {
  /* 把 nowrap 拔掉，並確保可以換行 */
  white-space: normal !important;
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;          /* 與 template 的 gap-2 對應 */
}
.drag-handle {
  cursor: move;
}
</style>
