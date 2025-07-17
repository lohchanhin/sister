<template>
  <div class="grid">
    <!-- Filters -->
    <div class="col-12">
      <Card>
        <template #content>
          <div class="grid formgrid align-items-center">
            <div class="col-12 md:col-4">
              <Dropdown v-model="clientId" :options="clients" optionLabel="name" optionValue="_id" placeholder="選擇客戶" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
              <Dropdown v-model="platformId" :options="platforms" optionLabel="name" optionValue="_id" placeholder="選擇平台" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
              <Dropdown v-model="yMetric" :options="metrics" placeholder="選擇指標" class="w-full" />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Ad Summary -->
    <div class="col-12">
      <Card>
        <template #title>最新廣告數據 (近 7 天)</template>
        <template #content>
          <div class="grid text-center">
            <div class="col">
              <div>花費</div>
              <div class="text-2xl font-bold mt-1">{{ adSummary.spent || 0 }}</div>
            </div>
            <div class="col">
              <div>詢問</div>
              <div class="text-2xl font-bold mt-1">{{ adSummary.enquiries || 0 }}</div>
            </div>
            <div class="col">
              <div>觸及</div>
              <div class="text-2xl font-bold mt-1">{{ adSummary.reach || 0 }}</div>
            </div>
            <div class="col">
              <div>曝光</div>
              <div class="text-2xl font-bold mt-1">{{ adSummary.impressions || 0 }}</div>
            </div>
            <div class="col">
              <div>點擊</div>
              <div class="text-2xl font-bold mt-1">{{ adSummary.clicks || 0 }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Chart -->
    <div class="col-12">
      <Card>
        <template #title>
          <div class="flex justify-content-between align-items-center">
            <span>廣告指標趨勢</span>
            <Dropdown v-model="days" :options="dayOptions" optionLabel="label" optionValue="value" />
          </div>
        </template>
        <template #content>
          <Chart type="line" :data="chartData" :options="chartOptions" style="height: 300px" />
        </template>
      </Card>
    </div>

    <!-- Asset Stats -->
    <div class="col-12">
       <Card>
        <template #title>素材統計</template>
        <template #content>
          <div class="grid text-center">
            <div class="col">
              <div>素材總數</div>
              <div class="text-2xl font-bold mt-1">{{ assetStats.rawTotal || 0 }}</div>
            </div>
            <div class="col">
              <div>成品總數</div>
              <div class="text-2xl font-bold mt-1">{{ assetStats.editedTotal || 0 }}</div>
            </div>
            <div class="col">
              <div>待審</div>
              <div class="text-2xl font-bold mt-1">{{ assetStats.pending || 0 }}</div>
            </div>
            <div class="col">
              <div>通過</div>
              <div class="text-2xl font-bold mt-1">{{ assetStats.approved || 0 }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Recent Assets & Reviews -->
    <div class="col-12 md:col-6">
      <Card>
        <template #title>
            <div class="flex justify-content-between align-items-center">
                <span>最近素材上傳</span>
                <Button label="查看全部" class="p-button-link" @click="$router.push('/assets')" />
            </div>
        </template>
        <template #content>
          <DataTable :value="recentAssets" :rows="5" responsiveLayout="scroll" emptyMessage="尚無素材上傳">
            <Column field="createdAt" header="上傳時間">
              <template #body="{data}">{{ new Date(data.createdAt).toLocaleString() }}</template>
            </Column>
            <Column field="fileName" header="檔名"></Column>
            <Column field="fileType" header="類型">
                <template #body="{data}"><Tag :value="data.fileType" /></template>
            </Column>
            <Column field="uploaderName" header="上傳者"></Column>
          </DataTable>
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-6">
       <Card>
        <template #title>最近審查結果</template>
        <template #content>
          <DataTable :value="recentReviews" :rows="5" responsiveLayout="scroll" emptyMessage="尚無審查紀錄">
            <Column field="updatedAt" header="時間">
                <template #body="{data}">{{ new Date(data.updatedAt).toLocaleString() }}</template>
            </Column>
            <Column field="assetFile" header="素材"></Column>
            <Column field="stage" header="階段"></Column>
            <Column field="completed" header="狀態">
                <template #body="{data}">
                    <Tag :severity="data.completed ? 'success' : 'warning'" :value="data.completed ? '完成' : '未完成'" />
                </template>
            </Column>
            <Column field="updatedBy" header="審核者"></Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '../services/api'
import { fetchDailyData } from '../services/dashboard'
import { fetchClients } from '../services/clients'
import { fetchPlatforms } from '../services/platforms'

import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Chart from 'primevue/chart'

/* ===== Reactive State ===== */
const recentAssets = ref([])
const recentReviews = ref([])
const adSummary = ref({})
const dailyData = ref([])
const days = ref(7)
const clients = ref([])
const platforms = ref([])
const clientId = ref('')
const platformId = ref('')
const yMetric = ref('')
const assetStats = ref({})

const dayOptions = ref([
  { label: '近 7 天', value: 7 },
  { label: '近 14 天', value: 14 },
  { label: '近 30 天', value: 30 }
])

const defaultMetrics = ['spent', 'enquiries', 'reach', 'impressions', 'clicks']
const metrics = computed(() => {
  const plat = platforms.value.find(p => p._id === platformId.value)
  const nums = (plat?.fields || [])
    .map(f => typeof f === 'string' ? { name: f, type: 'text' } : f)
    .filter(f => f.type === 'number')
    .map(f => f.name)
  return nums.length ? nums : defaultMetrics
})

/* ===== Chart ===== */
const chartData = ref({})
const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#495057'
            }
        }
    },
    scales: {
        x: {
            ticks: { color: '#495057' },
            grid: { color: '#ebedef' }
        },
        y: {
            ticks: { color: '#495057' },
            grid: { color: '#ebedef' }
        }
    }
})

const setChartData = () => {
  if (!dailyData.value.length || !yMetric.value) return
  const labels = dailyData.value.map(d => d.date)
  const data = dailyData.value.map(d => d[yMetric.value] ?? 0)
  
  chartData.value = {
    labels,
    datasets: [{
      label: yMetric.value,
      data,
      fill: false,
      borderColor: '#42A5F5',
      tension: 0.4
    }]
  }
}

/* ===== API Requests ===== */
async function fetchDashboard () {
  const { data } = await api.get('/dashboard/summary', {
    params: { clientId: clientId.value, platformId: platformId.value }
  })
  recentAssets.value  = data.recentAssets
  recentReviews.value = data.recentReviews
  adSummary.value     = data.adSummary
  assetStats.value    = data.assetStats
}

async function fetchDaily () {
  dailyData.value = await fetchDailyData(days.value, clientId.value, platformId.value)
  setChartData()
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

/* ===== Watchers / Lifecycle ===== */
onMounted(async () => {
  await loadClients()
  yMetric.value = metrics.value[0]
  await fetchDashboard()
  await fetchDaily()
})

watch(clientId, async () => { await loadPlatforms() })
watch([clientId, platformId], () => { fetchDashboard(); fetchDaily() })
watch(days, fetchDaily)
watch(yMetric, setChartData)
watch(metrics, m => { if (!m.includes(yMetric.value)) yMetric.value = m[0] })
</script>