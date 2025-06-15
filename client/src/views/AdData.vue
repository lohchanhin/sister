<!-- AdData.vue – 改良版：按鈕＋Dialog 填寫 -->
<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <h1 class="text-2xl font-bold">廣告數據</h1>

    <el-tabs v-model="activeTab">
      <!-- ───── 每日記錄 ───── -->
      <el-tab-pane label="每日記錄" name="daily">
        <!-- 工具列：新增按鈕 -->
        <div class="mb-4 text-right">
          <el-button type="primary" @click="dialogVisible = true">
            新增記錄
          </el-button>
        </div>

        <!-- 每日清單 -->
        <el-table :data="dailyData" stripe style="width:100%" empty-text="尚無資料">
          <el-table-column prop="date" label="日期" />
          <el-table-column prop="spent" label="花費" />
          <el-table-column prop="enquiries" label="詢問" />
          <el-table-column prop="reach" label="觸及" />
          <el-table-column prop="impressions" label="曝光" />
          <el-table-column prop="clicks" label="點擊" />
        </el-table>
      </el-tab-pane>

      <!-- ───── 週報表 ───── -->
      <el-tab-pane label="週報表" name="weekly">
        <!-- 1️⃣ 先包一層 div，並固定高度 300px；width 100% 方便自適應寬度 -->
        <div style="height: 300px; width: 100%;">
          <canvas id="weekly-chart"></canvas>
        </div>

        <el-table :data="weeklyData" stripe style="width:100%" class="mt-4" empty-text="尚無資料">
          <el-table-column prop="week" label="週" width="100" />
          <el-table-column prop="spent" label="總花費" width="100" />
          <el-table-column prop="enquiries" label="總詢問" width="100" />
          <el-table-column prop="reach" label="總觸及" width="100" />
          <el-table-column prop="impressions" label="總曝光" width="100" />
          <el-table-column prop="clicks" label="總點擊" width="100" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ───── Dialog：新增每日記錄 ───── -->
    <el-dialog v-model="dialogVisible" title="新增每日記錄" width="460px" destroy-on-close>
      <el-form label-position="top" ref="recordFormRef" :model="recordForm" @submit.prevent>
        <el-form-item label="日期">
          <el-date-picker v-model="recordForm.date" type="date" placeholder="請選擇日期" style="width: 100%" />
        </el-form-item>

        <el-form-item label="花費">
          <el-input v-model.number="recordForm.spent" placeholder="花費金額" />
        </el-form-item>

        <el-form-item label="詢問">
          <el-input v-model.number="recordForm.enquiries" placeholder="詢問數" />
        </el-form-item>

        <el-form-item label="觸及">
          <el-input v-model.number="recordForm.reach" placeholder="觸及數" />
        </el-form-item>

        <el-form-item label="曝光">
          <el-input v-model.number="recordForm.impressions" placeholder="曝光數" />
        </el-form-item>

        <el-form-item label="點擊">
          <el-input v-model.number="recordForm.clicks" placeholder="點擊數" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">確定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
/* ------------------------------------------------------------------
 * 匯入
 * ---------------------------------------------------------------- */
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { fetchDaily, createDaily, fetchWeekly } from '../services/adDaily'
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale } from 'chart.js'
import * as XLSX from 'xlsx'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale
)

/* ------------------------------------------------------------------
 * 參數 & 響應式狀態
 * ---------------------------------------------------------------- */
const route = useRoute()
const clientId = route.params.clientId
const platformId = route.params.platformId

const dailyData = ref([])
const weeklyData = ref([])
const activeTab = ref('daily')
const dialogVisible = ref(false)

const showHelp = ref(false)
const openHelp = () => { showHelp.value = true }
const closeHelp = () => { showHelp.value = false }

const loadDaily = async () => {
  dailyData.value = await fetchDaily(clientId, platformId)
}

const recordForm = ref({
  date: '',
  spent: '',
  enquiries: '',
  reach: '',
  impressions: '',
  clicks: ''
})

/* ------------------------------------------------------------------
 * 載入資料
 * ---------------------------------------------------------------- */
const loadDaily = async () => { dailyData.value = await fetchDaily(clientId, platformId) }
const loadWeekly = async () => {
  weeklyData.value = await fetchWeekly(clientId, platformId)
  drawChart()
}

onMounted(async () => {
  await loadDaily()
  await loadWeekly()
})

const importExcel = file => {
  const raw = file.raw || file.target?.files?.[0]
  if (!raw) return
  const reader = new FileReader()
  reader.onload = async e => {
    const data = new Uint8Array(e.target.result)
    const wb = XLSX.read(data, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const records = XLSX.utils.sheet_to_json(sheet)
    for (const r of records) {
      await createDaily(clientId, platformId, r)
    }
    ElMessage.success('匯入完成')
    await loadDaily()
    await loadWeekly()
  }
  reader.readAsArrayBuffer(raw)
}


  await createDaily(clientId, platformId, { ...recordForm.value })
  ElMessage.success('已新增記錄')

  // 重置表單
  Object.assign(recordForm.value, {
    date: '',
    spent: '',
    enquiries: '',
    reach: '',
    impressions: '',
    clicks: ''
  })

  dialogVisible.value = false
  await loadDaily()
  await loadWeekly()
}

/* ------------------------------------------------------------------
 * 畫圖
 * ---------------------------------------------------------------- */
const drawChart = () => {
  const ctx = document.getElementById('weekly-chart')
  if (!ctx) return
  const labels = weeklyData.value.map(d => d.week)
  const data = weeklyData.value.map(d => d.spent)
  if (chart) chart.destroy()
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: '花費', data, borderColor: '#409EFF', tension: 0.35 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: '週次' } },
        y: { title: { display: true, text: '花費' } }
      }
    }
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
        <div class="my-4">
          <el-upload :show-file-list="false" accept=".xlsx,.csv" @change="importExcel">
            <el-button>匯入 Excel</el-button>
          </el-upload>
        </div>
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
