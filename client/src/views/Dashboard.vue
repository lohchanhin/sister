<!-- Dashboard.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

/* ===== 響應式狀態 ===== */
const recentAssets   = ref([])
const recentReviews  = ref([])
const adSummary      = ref({})
const assetStats     = ref({})

/* ===== API 請求 ===== */
async function fetchDashboard () {
  const { data } = await api.get('/dashboard/summary')
  recentAssets.value = data.recentAssets
  recentReviews.value = data.recentReviews
  adSummary.value = data.adSummary
  assetStats.value = data.assetStats
}

onMounted(fetchDashboard)
</script>

<template>
  <h1 class="text-2xl font-bold mb-6">儀表板</h1>

  <!-- === 素材統計 === -->
  <el-card shadow="hover" class="mb-6">
    <template #header>
      <span class="text-lg font-semibold">素材統計</span>
    </template>
    <el-row :gutter="20" class="text-center">
      <el-col :span="4">
        <div>素材總數<br><b>{{ assetStats.rawTotal || 0 }}</b></div>
      </el-col>
      <el-col :span="4">
        <div>成品總數<br><b>{{ assetStats.editedTotal || 0 }}</b></div>
      </el-col>
      <el-col :span="4">
        <div>待審<br><b>{{ assetStats.pending || 0 }}</b></div>
      </el-col>
      <el-col :span="4">
        <div>通過<br><b>{{ assetStats.approved || 0 }}</b></div>
      </el-col>
      <el-col :span="4">
        <div>退回<br><b>{{ assetStats.rejected || 0 }}</b></div>
      </el-col>
    </el-row>
  </el-card>


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

  <!-- === 最近審查結果 === -->
  <el-card shadow="hover" class="mt-6">
    <template #header>
      <span class="text-lg font-semibold">最近審查結果</span>
    </template>
    <el-table :data="recentReviews" stripe style="width:100%" empty-text="尚無審查紀錄">
      <el-table-column label="時間" width="180">
        <template #default="{ row }">{{ new Date(row.updatedAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="assetFile" label="素材" />
      <el-table-column prop="stage" label="階段" />
      <el-table-column label="狀態" width="100">
        <template #default="{ row }">
          <el-tag type="success" v-if="row.completed">完成</el-tag>
          <el-tag v-else>未完成</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedBy" label="審核者" width="120" />
    </el-table>
  </el-card>

  <!-- === 最新廣告數據 === -->
  <el-card shadow="hover" class="mt-6">
    <template #header>
      <span class="text-lg font-semibold">最新廣告數據 (近 7 天)</span>
    </template>
    <el-row :gutter="20" class="text-center">
      <el-col :span="4">
        <div>花費<br><b>{{ adSummary.spent || 0 }}</b></div>
      </el-col>
      <el-col :span="4">
        <div>詢問<br><b>{{ adSummary.enquiries || 0 }}</b></div>
      </el-col>
      <el-col :span="4">
        <div>觸及<br><b>{{ adSummary.reach || 0 }}</b></div>
      </el-col>
      <el-col :span="4">
        <div>曝光<br><b>{{ adSummary.impressions || 0 }}</b></div>
      </el-col>
      <el-col :span="4">
        <div>點擊<br><b>{{ adSummary.clicks || 0 }}</b></div>
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
/* 如需客製化樣式可在此擴充 */
</style>
