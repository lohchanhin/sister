<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../services/api'

const assets = ref([])
const fileInput = ref(null)
const type = ref('raw')
const commentMap = reactive({})

async function fetchAssets() {
  const { data } = await api.get('/assets')
  assets.value = data
}

async function upload() {
  if (!fileInput.value.files.length) return
  const file = fileInput.value.files[0]
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type.value)
  await api.post('/assets/upload', formData)
  fileInput.value.value = null
  await fetchAssets()
}

async function addComment(id) {
  const message = commentMap[id]
  if (!message) return
  const { data } = await api.post(`/assets/${id}/comment`, { message })
  const idx = assets.value.findIndex((a) => a._id === id)
  if (idx !== -1) assets.value[idx] = data
  commentMap[id] = ''
}

const STATIC_BASE = import.meta.env.VITE_API_BASE.replace(/\/api$/, '')

onMounted(fetchAssets)
</script>

<template>
  <h1 class="text-2xl font-bold mb-4">素材庫</h1>
  <div class="mb-4 space-y-4">
    <input type="file" ref="fileInput" />
    <el-select v-model="type" placeholder="選擇類型">
      <el-option label="Raw" value="raw" />
      <el-option label="Edited" value="edited" />
    </el-select>
    <el-button type="primary" @click="upload">上傳素材</el-button>
  </div>
  <el-table :data="assets" stripe style="width: 100%">
    <el-table-column prop="filename" label="檔名" />
    <el-table-column label="預覽">
      <template #default="{ row }">
        <a :href="`${STATIC_BASE}/static/${row.filename}`" target="_blank">預覽</a>
      </template>
    </el-table-column>
    <el-table-column prop="type" label="類型" />
    <el-table-column label="評論">
      <template #default="{ row }">
        <div class="flex items-center gap-2">
          <el-input v-model="commentMap[row._id]" placeholder="新增評論" size="small" />
          <el-button @click="addComment(row._id)" size="small">送出</el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>
