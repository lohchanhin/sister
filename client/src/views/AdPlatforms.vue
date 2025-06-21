<!-- src/views/AdPlatforms.vue – 平台管理 -->
<script setup>
/* ────────────────────────── 依賴 ────────────────────────── */
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

/* ────────────────────────── 服務呼叫 ─────────────────────── */
import {
  fetchPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform
} from '../services/platforms'

/* ────────────────────────── 路由 & 狀態 ─────────────────── */
const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId

const platforms = ref([])
const dialog = ref(false)
const editing = ref(false)

const form = ref({
  name: '',
  platformType: '',
  mode: 'custom',       // default | custom
  fields: []              // [{ name, type, order }]
})

/* ── 預設欄位 ── */
const defaultFields = [
  { name: 'spent', type: 'number', order: 1 },
  { name: 'enquiries', type: 'number', order: 2 },
  { name: 'reach', type: 'number', order: 3 },
  { name: 'impressions', type: 'number', order: 4 },
  { name: 'clicks', type: 'number', order: 5 }
]

/* ── 新增欄位輸入 ── */
const newFieldName = ref('')
const newFieldType = ref('number')

const addField = () => {
  const name = newFieldName.value.trim()
  const type = newFieldType.value
  if (name && !form.value.fields.find(f => f.name === name)) {
    const order = form.value.fields.length + 1
    form.value.fields.push({ name, type, order })
  }
  newFieldName.value = ''
}

const removeField = i => form.value.fields.splice(i, 1)

/* ────────────────────────── CRUD ────────────────────────── */
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
      typeof f === 'string'
        ? { name: f, type: 'text', order: 0 }
        : { name: f.name, type: f.type || 'text', order: f.order || 0 }
    ),
    mode: p.mode || 'custom'
  }
  dialog.value = true
}

const submit = async () => {
  try {
    form.value.fields.sort((a, b) => a.order - b.order)
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
  await ElMessageBox.confirm(`確定刪除「${p.name}」？`, '警告', {
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await deletePlatform(clientId, p._id)
  ElMessage.success('已刪除平台')
  await loadPlatforms()
}

/* ────────────────────────── 監看模式切換 ───────────────── */
watch(
  () => form.value.mode,
  m => {
    if (m === 'default') {
      form.value.fields = defaultFields.map(f => ({ ...f }))   // 深拷貝
    } else if (m === 'custom') {
      form.value.fields = []
    }
  }
)

/* ────────────────────────── 初始化 ─────────────────────── */
onMounted(loadPlatforms)
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <!-- 返回上一頁 -->
    <el-button @click="router.back()">返回上層</el-button>
    <h1 class="text-2xl font-bold">平台管理</h1>

    <!-- 新增平台 -->
    <el-button type="primary" @click="openCreate">＋ 新增平台</el-button>

    <!-- 平台列表 -->
    <el-table :data="platforms" stripe class="mt-4" style="width:100%">
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

    <!-- 新增 / 編輯對話框 -->
    <el-dialog v-model="dialog" :title="editing ? '編輯平台' : '新增平台'" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="平台名稱">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-form-item label="類型">
          <el-input v-model="form.platformType" />
        </el-form-item>

        <el-form-item label="模式">
          <el-select v-model="form.mode">
            <el-option label="預設" value="default" />
            <el-option label="自訂" value="custom" />
          </el-select>
        </el-form-item>

        <!-- 自訂欄位設定 -->
        <el-form-item label="自訂欄位">
          <!-- 新增欄位表單 -->
          <div class="flex items-center gap-2 mb-2">
            <el-input v-model="newFieldName" placeholder="欄位名稱" class="flex-1" @keyup.enter.native.prevent="addField" />
            <el-select v-model="newFieldType" style="width:100px">
              <el-option label="數字" value="number" />
              <el-option label="文字" value="text" />
              <el-option label="日期" value="date" />
            </el-select>
            <el-button type="primary" @click="addField">新增</el-button>
          </div>

          <div class="flex flex-col gap-2">
            <div v-for="(field, index) in form.fields" :key="field.name" class="flex items-center gap-2">
              <el-tag closable @close="removeField(index)">
                {{ field.name }}
                <span class="ml-1 text-xs">({{ field.type }})</span>
              </el-tag>
              <el-input-number v-model="field.order" :min="0" />
            </div>
          </div>

        </el-form-item>
      </el-form>

      <!-- 底部按鈕 -->
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">
          {{ editing ? '更新' : '建立' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
</style>
