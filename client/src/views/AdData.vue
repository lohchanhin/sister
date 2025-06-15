<!-- src/views/AdData.vue – 完整優化版，直接覆蓋即可編譯 -->
<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <el-button @click="router.back()">返回上層</el-button>
    <h1 class="text-2xl font-bold">廣告數據</h1>

    <el-tabs v-model="activeTab">
      <!-- ── 每日記錄 ── -->
      <el-tab-pane label="每日記錄" name="daily">
        <!-- 工具列 -->
        <div class="flex justify-between items-center mb-4">
          <!-- 匯入 -->
          <el-upload :show-file-list="false" accept=".xlsx,.csv" drag :before-upload="importFile">
            <el-button>匯入 CSV / Excel</el-button>
          </el-upload>

          <!-- 右側：新增 / 說明 -->
          <div class="space-x-2">
            <el-button type="primary" @click="dialogVisible = true">新增記錄</el-button>
            <el-button link size="small" @click="showHelp = true">
              <el-icon>
                <InfoFilled />
              </el-icon>
            </el-button>
          </div>
        </div>

        <!-- 每日清單 -->
        <el-table :data="dailyData" stripe style="width:100%" empty-text="尚無資料">
          <el-table-column prop="date" label="日期" :formatter="dateFmt" />
          <el-table-column prop="spent" label="花費" />
          <el-table-column prop="enquiries" label="詢問" />
          <el-table-column prop="avgCost" label="平均成本" />
          <el-table-column prop="reach" label="觸及" />
          <el-table-column prop="impressions" label="曝光" />
          <el-table-column prop="clicks" label="點擊" />
        </el-table>
      </el-tab-pane>

      <!-- ── 週報表 ── -->
      <el-tab-pane label="週報表" name="weekly">
        <!-- 指標切換 -->
        <div class="mb-2 text-right">
          <el-select v-model="metric" size="small" style="width:120px">
            <el-option v-for="(lbl, val) in metricLabel" :key="val" :label="lbl" :value="val" />
          </el-select>
        </div>

        <!-- 圖表 -->
        <div style="height:300px;width:100%">
          <canvas id="weekly-chart" />
        </div>

        <!-- 週統計表 -->
        <el-table :data="weeklyData" stripe style="width:100%" class="mt-4" empty-text="尚無資料">
          <el-table-column prop="week" label="週" width="100" />
          <el-table-column prop="spent" label="總花費" width="100" />
          <el-table-column prop="enquiries" label="總詢問" width="100" />
          <el-table-column prop="reach" label="總觸及" width="100" />
          <el-table-column prop="impressions" label="總曝光" width="100" />
          <el-table-column prop="clicks" label="總點擊" width="100" />
          <el-table-column label="備註">
            <template #default="{ row }">
              <div>
                <el-button link type="primary" @click="openNote(row)">備註</el-button>
                <el-icon v-if="row.hasNote" class="ml-1">
                  <InfoFilled />
                </el-icon>
              </div>
              <div v-if="row.note" class="text-xs text-gray-600 whitespace-pre-line mt-1">
                {{ row.note }}
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Dialog：新增每日 -->
    <el-dialog v-model="dialogVisible" title="新增每日記錄" width="460px" destroy-on-close>
      <el-form label-position="top" :model="recordForm" @submit.prevent>
        <el-form-item label="日期">
          <el-date-picker v-model="recordForm.date" type="date" style="width:100%" />
        </el-form-item>
        <el-form-item label="花費"><el-input v-model.number="recordForm.spent" /></el-form-item>
        <el-form-item label="詢問"><el-input v-model.number="recordForm.enquiries" /></el-form-item>
        <el-form-item label="觸及"><el-input v-model.number="recordForm.reach" /></el-form-item>
        <el-form-item label="曝光"><el-input v-model.number="recordForm.impressions" /></el-form-item>
        <el-form-item label="點擊"><el-input v-model.number="recordForm.clicks" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">確定</el-button>
      </template>
    </el-dialog>

    <!-- Dialog：說明 -->
    <el-dialog v-model="showHelp" title="操作說明" width="360px">
      <ul class="list-disc pl-5 leading-7">
        <li>點 <b>新增記錄</b>：手動輸入每日數據。</li>
        <li>點 <b>匯入 CSV / Excel</b>：批量匯入多筆資料。</li>
        <li>切換指標下拉，折線圖即時更新。</li>
        <li>在週統計表點 <b>備註</b> 可編輯說明與圖片。</li>
      </ul>
      <template #footer>
        <el-button type="primary" @click="showHelp = false">了解</el-button>
      </template>
    </el-dialog>

    <!-- Dialog：週備註 -->
    <el-dialog v-model="noteDialog" title="週備註" width="460px" destroy-on-close>
      <el-input v-model="noteForm.text" type="textarea" rows="4" placeholder="輸入備註" />
      <el-upload multiple :before-upload="() => false" v-model:file-list="noteForm.images">
        <el-button>上傳圖片</el-button>
      </el-upload>
      <template #footer>
        <el-button @click="noteDialog = false">取消</el-button>
        <el-button type="primary" @click="saveNote">儲存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
/* ------------------------------------------------------------------ 匯入 ------------------------------------------------------------------ */
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import dayjs from 'dayjs'
import {
  fetchDaily, fetchWeekly, createDaily, bulkCreateDaily
} from '../services/adDaily'
import {
  fetchWeeklyNote, createWeeklyNote, updateWeeklyNote
} from '../services/weeklyNotes'
import {
  Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale
} from 'chart.js'
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

/* ------------------------------------------------------------------ 參數與狀態 ------------------------------------------------------------------ */
const route = useRoute()
const router = useRouter()
const { clientId, platformId } = route.params

const activeTab = ref('daily')
const dialogVisible = ref(false)
const showHelp = ref(false)

/* === 每日 === */
const dailyData = ref([])
/* 新增表單 */
const recordForm = ref({ date: '', spent: '', enquiries: '', reach: '', impressions: '', clicks: '' })

/* === 週 === */
const weeklyData = ref([])
const metric = ref('spent')
const metricLabel = { spent: '花費', enquiries: '詢問', reach: '觸及', impressions: '曝光', clicks: '點擊' }
const noteDialog = ref(false)
const noteForm = ref({ week: '', text: '', images: [] })
let chart = null

/* ------------------------------------------------------------------ 日期格式 & 表格 formatter ------------------------------------------------------------------ */
const dateFmt = row => dayjs(row.date).format('YYYY-MM-DD')

/* ------------------------------------------------------------------ 資料載入 ------------------------------------------------------------------ */
const loadDaily = async () => {
  const list = await fetchDaily(clientId, platformId)
  dailyData.value = list.map(r => ({
    ...r,
    avgCost: r.enquiries ? (r.spent / r.enquiries).toFixed(2) : '0.00'
  }))
}

const loadWeekly = async () => {
  weeklyData.value = await fetchWeekly(clientId, platformId)
  await Promise.all(
    weeklyData.value.map(async r => {
      try {
        const n = await fetchWeeklyNote(clientId, platformId, r.week)
        Object.assign(r, { hasNote: true, note: n.text })
      } catch { Object.assign(r, { hasNote: false, note: '' }) }
    })
  )
  drawChart()
}

onMounted(async () => {
  await loadDaily()
  await loadWeekly()
})
watch(metric, () => drawChart())

/* ------------------------------------------------------------------ 圖表 ------------------------------------------------------------------ */
const drawChart = () => {
  const ctx = document.getElementById('weekly-chart')
  if (!ctx) return
  const labels = weeklyData.value.map(r => r.week)
  const data = weeklyData.value.map(r => r[metric.value])
  chart && chart.destroy()
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: metricLabel[metric.value], data, borderColor: '#409EFF', tension: 0.35 }] },
    options: { responsive: true, maintainAspectRatio: false }
  })
}

/* ------------------------------------------------------------------ 新增每日 ------------------------------------------------------------------ */
const handleConfirm = async () => {
  if (!recordForm.value.date) return ElMessage.warning('請選擇日期')
  await createDaily(clientId, platformId, { ...recordForm.value })
  ElMessage.success('已新增記錄')
  Object.assign(recordForm.value, { date: '', spent: '', enquiries: '', reach: '', impressions: '', clicks: '' })
  dialogVisible.value = false
  await loadDaily(); await loadWeekly()
}

/* ------------------------------------------------------------------ 匯入 CSV / Excel ------------------------------------------------------------------ */
const importFile = async file => {
  try {
    const ext = file.name.split('.').pop().toLowerCase()
    const rows = ext === 'csv' ? await readCSV(file) : await readExcel(file)
    if (!rows.length) throw new Error('檔案無有效資料')
    await bulkCreateDaily(clientId, platformId, rows)
    ElMessage.success(`匯入完成，共 ${rows.length} 筆`)
    await loadDaily(); await loadWeekly()
  } catch (e) { ElMessage.error(e.message || '匯入失敗') }
  return false
}

const readExcel = file => new Promise((res, rej) => {
  const fr = new FileReader()
  fr.onload = e => {
    const wb = XLSX.read(e.target.result, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    res(normalize(XLSX.utils.sheet_to_json(ws, { defval: '' })))
  }
  fr.onerror = rej
  fr.readAsArrayBuffer(file)
})

const readCSV = file => new Promise((res, rej) => {
  Papa.parse(file, {
    header: true, skipEmptyLines: true,
    complete: r => res(normalize(r.data)), error: rej
  })
})

const normalize = rows => rows.map(r => ({
  date: r.date || r.日期,
  spent: + (r.spent || r.花費 || 0),
  enquiries: + (r.enquiries || r.詢問 || 0),
  reach: + (r.reach || r.觸及 || 0),
  impressions: + (r.impressions || r.曝光 || 0),
  clicks: + (r.clicks || r.點擊 || 0)
})).filter(r => r.date)

/* ------------------------------------------------------------------ 週備註 ------------------------------------------------------------------ */
const openNote = async row => {
  noteForm.value = { week: row.week, text: row.note || '', images: [] }
  noteDialog.value = true
}
const saveNote = async () => {
  const w = noteForm.value.week
  const body = { text: noteForm.value.text /* + images 上傳結果 */ }
  try {
    await updateWeeklyNote(clientId, platformId, w, body)
  } catch {
    await createWeeklyNote(clientId, platformId, body)
  }
  ElMessage.success('已儲存備註')
  noteDialog.value = false
  await loadWeekly()
}
</script>

<style scoped></style>
