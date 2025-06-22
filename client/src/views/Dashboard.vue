<!-- Dashboard.vue -->
<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../services/api'
import { fetchDailyData } from '../services/dashboard'
import { fetchClients } from '../services/clients'
import { fetchPlatforms } from '../services/platforms'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale
} from 'chart.js'
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale
)

/* ===== 響應式狀態 ===== */
const recentAssets   = ref([])
const recentReviews  = ref([])
const adSummary      = ref({})
const dailyData      = ref([])
const days           = ref(7)
const clients        = ref([])
const platforms      = ref([])
const clientId       = ref('')
const platformId     = ref('')
const yMetric        = ref('')
const metrics        = ['spent', 'enquiries', 'reach', 'impressions', 'clicks']
let chartCtx = null
let chart = null
const assetStats     = ref({})


/* ===== API 請求 ===== */
async function fetchDashboard () {
  const { data } = await api.get('/dashboard/summary', {
    params: { clientId: clientId.value, platformId: platformId.value }
  })
  recentAssets.value = data.recentAssets
  recentReviews.value = data.recentReviews
  adSummary.value = data.adSummary
  assetStats.value = data.assetStats
}

async function fetchDaily () {
  dailyData.value = await fetchDailyData(
    days.value,
    clientId.value,
    platformId.value
  )
  drawChart()
}

function drawChart () {
  if (!chartCtx) chartCtx = document.getElementById('daily-chart')
  if (!chartCtx || !yMetric.value) return
  const labels = dailyData.value.map(d => d.date)
  const data = dailyData.value.map(d => d[yMetric.value] ?? 0)
  chart && chart.destroy()
  chart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: yMetric.value,
        data,
        borderColor: '#409EFF',
        tension: 0.35
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })
}

async function loadClients () {
  clients.value = await fetchClients()
}

async function loadPlatforms () {
  if (!clientId.value) {
    platforms.value = []
    platformId.value = ''
    return
  }
  platforms.value = await fetchPlatforms(clientId.value)
  if (!platforms.value.find(p => p._id === platformId.value)) {
    platformId.value = platforms.value[0]?._id || ''
  }
}

onMounted(async () => {
  await loadClients()
  yMetric.value = metrics[0]
})

watch(clientId, async () => {
  await loadPlatforms()
})

watch([clientId, platformId], () => {
  fetchDashboard()
  fetchDaily()
})

onMounted(fetchDashboard)
onMounted(fetchDaily)
watch(days, fetchDaily)
watch(yMetric, drawChart)
</script>

<template>
  <h1 class="text-2xl font-bold mb-6">儀表板</h1>
  <el-row :gutter="20" class="mb-4">
    <el-col :span="8">
      <el-select v-model="clientId" placeholder="選擇客戶" clearable style="width:100%">
        <el-option v-for="c in clients" :key="c._id" :label="c.name" :value="c._id" />
      </el-select>
    </el-col>
    <el-col :span="8">
      <el-select v-model="platformId" placeholder="選擇平台" clearable style="width:100%">
        <el-option v-for="p in platforms" :key="p._id" :label="p.name" :value="p._id" />
      </el-select>
    </el-col>
    <el-col :span="8">
      <el-select v-model="yMetric" size="small" style="width:100%">
        <el-option v-for="m in metrics" :key="m" :label="m" :value="m" />
      </el-select>
    </el-col>
  </el-row>

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

  <!-- === 廣告指標趨勢 === -->
  <el-card shadow="hover" class="mt-6">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold">廣告指標趨勢</span>
        <el-select v-model="days" size="small" style="width: 100px">
          <el-option label="近 7 天" :value="7" />
          <el-option label="近 14 天" :value="14" />
          <el-option label="近 30 天" :value="30" />
        </el-select>
      </div>
    </template>
    <canvas id="daily-chart" class="w-full" style="height:300px" />
  </el-card>
</template>

<style scoped>
/* 如需客製化樣式可在此擴充 */
</style>
