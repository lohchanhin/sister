<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { fetchDaily, createDaily, fetchWeekly } from '../services/adDaily'
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

const route = useRoute()
const clientId = route.params.clientId
const platformId = route.params.platformId

const dailyData = ref([])
const weeklyData = ref([])
const recordForm = ref({ date: '', spent: '', enquiries: '', reach: '', impressions: '', clicks: '' })

const activeTab = ref('daily')
let chart

const showHelp = ref(false)
const openHelp = () => { showHelp.value = true }
const closeHelp = () => { showHelp.value = false }

const loadDaily = async () => {
  dailyData.value = await fetchDaily(clientId, platformId)
}

const loadWeekly = async () => {
  weeklyData.value = await fetchWeekly(clientId, platformId)
  drawChart()
}

onMounted(async () => {
  await loadDaily()
  await loadWeekly()
})


const submitRecord = async () => {
  await createDaily(clientId, platformId, { ...recordForm.value })
  ElMessage.success('已新增記錄')
  recordForm.value = { date: '', spent: '', enquiries: '', reach: '', impressions: '', clicks: '' }

  await loadDaily()
  await loadWeekly()
}

const drawChart = () => {
  const ctx = document.getElementById('weekly-chart')
  if (!ctx) return
  const labels = weeklyData.value.map(d => d.week)
  const data = weeklyData.value.map(d => d.spent)
  if (chart) chart.destroy()
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: '花費', data, borderColor: '#409EFF' }] },
    options: { responsive: true }
  })
}
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <h1 class="text-2xl font-bold">廣告數據</h1>


    <el-tabs v-model="activeTab">
      <el-tab-pane label="每日記錄" name="daily">
        <el-table :data="dailyData" stripe style="width:100%" empty-text="尚無資料">
          <el-table-column prop="date" label="日期" width="100" />
          <el-table-column prop="spent" label="花費" width="100" />

          <el-table-column prop="enquiries" label="詢問" width="100" />

          <el-table-column prop="reach" label="觸及" width="100" />
          <el-table-column prop="impressions" label="曝光" width="100" />
          <el-table-column prop="clicks" label="點擊" width="100" />
        </el-table>
        <el-form label-position="top" class="mt-4" @submit.prevent="submitRecord">
          <div class="flex flex-wrap gap-4 items-end">
            <el-date-picker v-model="recordForm.date" type="date" placeholder="日期" />
            <el-input v-model.number="recordForm.spent" placeholder="花費" class="w-28" />

            <el-input v-model.number="recordForm.enquiries" placeholder="詢問" class="w-28" />

            <el-input v-model.number="recordForm.reach" placeholder="觸及" class="w-28" />
            <el-input v-model.number="recordForm.impressions" placeholder="曝光" class="w-28" />
            <el-input v-model.number="recordForm.clicks" placeholder="點擊" class="w-28" />
            <el-button type="primary" native-type="submit">新增記錄</el-button>
            <el-button link size="small" @click="openHelp" class="ml-2">
              <el-icon>
                <InfoFilled />
              </el-icon>
            </el-button>
          </div>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="週報表" name="weekly">
        <canvas id="weekly-chart" height="260"></canvas>
        <el-table :data="weeklyData" stripe style="width:100%" empty-text="尚無資料" class="mt-4">
          <el-table-column prop="week" label="週" width="100" />
          <el-table-column prop="spent" label="總花費" width="100" />
          <el-table-column prop="enquiries" label="總詢問" width="100" />

          <el-table-column prop="reach" label="總觸及" width="100" />
          <el-table-column prop="impressions" label="總曝光" width="100" />
          <el-table-column prop="clicks" label="總點擊" width="100" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
    <el-dialog v-model="showHelp" title="填寫說明" width="360px" @close="closeHelp">
      <p>可手動輸入或匯入 CSV/Excel，日期格式需為 YYYY-MM-DD</p>
      <template #footer>
        <el-button type="primary" @click="closeHelp">確定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
</style>
