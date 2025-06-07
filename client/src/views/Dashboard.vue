<!-- Dashboard.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

/* ===== 響應式狀態 ===== */
const recentProgress = ref([])  // 近 7 筆進度
const recentAssets   = ref([])  // 近 7 筆素材

/* ===== API 請求 ===== */
async function fetchDashboard () {
  const [{ data: progress }, { data: assets }] = await Promise.all([
    api.get('/progress/recent?limit=7'),
    api.get('/assets/recent?limit=7')
  ])
  recentProgress.value = progress
  recentAssets.value   = assets
}

onMounted(fetchDashboard)
</script>

<template>
  <h1 class="text-2xl font-bold mb-6">儀表板</h1>

  <!-- === 區塊 1：最近進度紀錄 === -->
  <el-card class="mb-8" shadow="hover">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold">最近進度更新</span>
        <el-button type="primary" link @click="$router.push('/progress')">
          查看全部
        </el-button>
      </div>
    </template>

    <el-table
      :data="recentProgress"
      stripe
      style="width: 100%"
      empty-text="尚無進度更新"
    >
      <el-table-column label="更新時間" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>

      <!-- 動態欄位範例：顯示標題 / 負責人，可依實際資料調整 -->
      <el-table-column prop="title" label="標題" />
      <el-table-column prop="ownerName" label="負責人" width="120" />

      <el-table-column label="狀態" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === '完成' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <!-- === 區塊 2：最近素材上傳 === -->
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
