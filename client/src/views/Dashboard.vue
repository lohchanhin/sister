<!-- Dashboard.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

/* ===== 響應式狀態 ===== */
const recentAssets   = ref([])  // 近 7 筆素材

/* ===== API 請求 ===== */
async function fetchDashboard () {
  const { data: assets } = await api.get('/assets/recent?limit=7')
  recentAssets.value = assets
}

onMounted(fetchDashboard)
</script>

<template>
  <h1 class="text-2xl font-bold mb-6">儀表板</h1>


  <!-- === 最近素材上傳 === -->
  <el-card shadow="hover">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold">最近素材上傳</span>
        <el-button type="primary" link @click="$router.push('/assets')">
          查看全部
        </el-button>
      </div>
    </template>

    <el-table
      :data="recentAssets"
      stripe
      style="width: 100%"
      empty-text="尚無素材上傳"
    >
      <el-table-column label="上傳時間" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>

      <el-table-column prop="fileName" label="檔名" />

      <el-table-column label="類型" width="100">
        <template #default="{ row }">
          <el-tag>{{ row.fileType }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="uploaderName" label="上傳者" width="120" />
    </el-table>
  </el-card>
</template>

<style scoped>
/* 如需客製化樣式可在此擴充 */
</style>
