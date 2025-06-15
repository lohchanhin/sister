<!-- src/views/AdData.vue – 修正版：單一 <template>、Dialog 新增、匯入 Excel/CSV -->
<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <el-button @click="router.back()">返回上層</el-button>
    <h1 class="text-2xl font-bold">廣告數據</h1>

    <el-tabs v-model="activeTab">
      <!-- ───── 每日記錄 ───── -->
      <el-tab-pane label="每日記錄" name="daily">
        <!-- 工具列 -->
        <div class="flex justify-between items-center mb-4">
          <!-- 匯入檔案 -->
          <el-upload
            :show-file-list="false"
            accept=".xlsx,.csv"
            drag
            :before-upload="importFile"
          >
            <el-button>匯入 CSV/Excel</el-button>
          </el-upload>

          <!-- 右側：新增＋說明 -->
          <div class="space-x-2">
            <el-button type="primary" @click="dialogVisible = true">新增記錄</el-button>
            <el-button link size="small" @click="openHelp">
              <el-icon><InfoFilled /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 每日清單 -->
        <el-table
          :data="dailyData"
          stripe
          style="width: 100%"
          empty-text="尚無資料"
        >
          <el-table-column prop="date" label="日期"
            :formatter="(_, __, cell) => formatDate(cell)" />
          <el-table-column prop="spent"       label="花費" />
          <el-table-column prop="enquiries"   label="詢問" />
          <el-table-column prop="reach"       label="觸及" />
          <el-table-column prop="impressions" label="曝光" />
          <el-table-column prop="clicks"      label="點擊" />
        </el-table>
      </el-tab-pane>

      <!-- ───── 週報表 ───── -->
      <el-tab-pane label="週報表" name="weekly">
        <!-- 圖表：固定高 300px -->
        <div style="height: 300px; width: 100%;">
          <canvas id="weekly-chart"></canvas>
        </div>

        <!-- 週統計表 -->
        <el-table
          :data="weeklyData"
          stripe
          style="width: 100%"
          class="mt-4"
          empty-text="尚無資料"
        >
          <el-table-column prop="week"        label="週"       width="100" />
          <el-table-column prop="spent"       label="總花費"   width="100" />
          <el-table-column prop="enquiries"   label="總詢問"   width="100" />
          <el-table-column prop="reach"       label="總觸及"   width="100" />
          <el-table-column prop="impressions" label="總曝光"   width="100" />
          <el-table-column prop="clicks"      label="總點擊"   width="100" />
          <el-table-column label="備註" width="80">
            <template #default="{ row }">
              <el-button link type="primary" @click="openNote(row)">備註</el-button>
              <el-icon v-if="row.hasNote" class="ml-1"><InfoFilled/></el-icon>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ───── Dialog：新增每日記錄 ───── -->
    <el-dialog
      v-model="dialogVisible"
      title="新增每日記錄"
      width="460px"
      destroy-on-close
    >
      <el-form label-position="top" :model="recordForm" @submit.prevent>
        <el-form-item label="日期">
          <el-date-picker
            v-model="recordForm.date"
            type="date"
            placeholder="請選擇日期"
            style="width: 100%"
          />
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

    <!-- 說明 Dialog -->
    <el-dialog
      v-model="showHelp"
      title="填寫說明"
      width="360px"
      @close="closeHelp"
    >
      <p>可手動輸入或匯入 CSV / Excel，日期格式需為 YYYY-MM-DD。</p>
      <template #footer>
        <el-button type="primary" @click="closeHelp">確定</el-button>
      </template>
    </el-dialog>

    <!-- 備註 Dialog -->
    <el-dialog v-model="noteDialog" title="週備註" width="460px" destroy-on-close>
      <el-input v-model="noteForm.text" type="textarea" rows="4" placeholder="輸入備註" />
      <el-upload :before-upload="() => false" multiple v-model:file-list="noteForm.images">
        <el-button>上傳圖片</el-button>
      </el-upload>
      <template #footer>
        <el-button @click="noteDialog=false">取消</el-button>
        <el-button type="primary" @click="saveNote">儲存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
/* ------------------------------------------------------------------
 * 匯入
 * ---------------------------------------------------------------- */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
const formatDate = d => dayjs(d).format('YYYY-MM-DD')
import {
  fetchDaily,
  fetchWeekly,
  createDaily,
  bulkCreateDaily        // 請在 services/adDaily.js 實作此批次 API
} from '../services/adDaily'
import {
  fetchWeeklyNote,
  createWeeklyNote,
  updateWeeklyNote
} from '../services/weeklyNotes'
import {
  Chart, LineController, LineElement,
  PointElement, LinearScale, Title, CategoryScale
} from 'chart.js'
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

/* ------------------------------------------------------------------
 * 參數與狀態
 * ---------------------------------------------------------------- */
const route       = useRoute()
const router      = useRouter()
const clientId    = route.params.clientId
const platformId  = route.params.platformId

const dailyData   = ref([])
const weeklyData  = ref([])
const activeTab   = ref('daily')

const dialogVisible = ref(false)
const showHelp      = ref(false)
const noteDialog    = ref(false)
const noteForm      = ref({ week: '', text: '', images: [] })
const hasNote       = ref(false)

/* 新增表單 */
const recordForm = ref({
  date: '',
  spent: '',
  enquiries: '',
  reach: '',
  impressions: '',
  clicks: ''
})

/* ------------------------------------------------------------------
 * 資料載入
 * ---------------------------------------------------------------- */
const loadDaily  = async () => { dailyData.value  = await fetchDaily(clientId, platformId) }
const loadWeekly = async () => {
  weeklyData.value = await fetchWeekly(clientId, platformId)
  for (const r of weeklyData.value) {
    try { await fetchWeeklyNote(clientId, platformId, r.week); r.hasNote = true } catch { r.hasNote = false }
  }
  drawChart()
}

onMounted(async () => {
  await loadDaily()
  await loadWeekly()
})

/* ------------------------------------------------------------------
 * 圖表
 * ---------------------------------------------------------------- */
let chart = null
const drawChart = () => {
  const ctx = document.getElementById('weekly-chart')
  if (!ctx) return
  const labels = weeklyData.value.map(d => d.week)
  const data   = weeklyData.value.map(d => d.spent)
  if (chart) chart.destroy()
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: '花費', data, borderColor: '#409EFF', tension: 0.35 }] },
    options: { responsive: true, maintainAspectRatio: false }
  })
}

/* ------------------------------------------------------------------
 * 單筆新增
 * ---------------------------------------------------------------- */
const handleConfirm = async () => {
  if (!recordForm.value.date) {
    ElMessage.warning('請選擇日期')
    return
  }
  await createDaily(clientId, platformId, { ...recordForm.value })
  ElMessage.success('已新增記錄')
  Object.assign(recordForm.value, { date:'', spent:'', enquiries:'', reach:'', impressions:'', clicks:'' })
  dialogVisible.value = false
  await loadDaily(); await loadWeekly()
}

/* ------------------------------------------------------------------
 * 匯入 Excel / CSV
 * ---------------------------------------------------------------- */
const importFile = async (rawFile) => {
  try {
    const ext = rawFile.name.split('.').pop().toLowerCase()
    const records = ext === 'csv' ? await readCSV(rawFile) : await readExcel(rawFile)
    if (!records.length) throw new Error('檔案無有效資料')

    await bulkCreateDaily(clientId, platformId, records)
    ElMessage.success(`匯入完成，共 ${records.length} 筆`)
    await loadDaily(); await loadWeekly()
  } catch (err) {
    console.error(err)
    ElMessage.error(err.message || '匯入失敗')
  }
  // 阻止 el-upload 繼續自動上傳
  return false
}

/* CSV 解析（使用瀏覽器原生） */
const readCSV = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const rows = reader.result.trim().split(/\r?\n/)
      const [headerLine, ...dataLines] = rows
      const headers = headerLine.split(',').map(h => h.trim())
      const records = dataLines.map(l => {
        const cols = l.split(',')
        return Object.fromEntries(headers.map((h, i) => [h, cols[i]]))
      })
      resolve(normalizeRecords(records))
    }
    reader.onerror = reject
    reader.readAsText(file)
  })

/* Excel 解析 */
const readExcel = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' })
      resolve(normalizeRecords(json))
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

/* 欄位正規化 */
function normalizeRecords (rows) {
  return rows
    .map(r => ({
      date        : r.date        || r.日期,
      spent       : Number(r.spent       || r.花費       || 0),
      enquiries   : Number(r.enquiries   || r.詢問       || 0),
      reach       : Number(r.reach       || r.觸及       || 0),
      impressions : Number(r.impressions || r.曝光       || 0),
      clicks      : Number(r.clicks      || r.點擊       || 0)
    }))
    .filter(r => r.date)               // 必須有日期
}

/* ------------------------------------------------------------------
 * 說明 Dialog 控制
 * ---------------------------------------------------------------- */
const openHelp  = () => { showHelp.value = true }
const closeHelp = () => { showHelp.value = false }

const openNote = async (row) => {
  noteForm.value = { week: row.week, text: '', images: [] }
  hasNote.value = false
  try {
    const n = await fetchWeeklyNote(clientId, platformId, row.week)
    noteForm.value.text = n.text
    hasNote.value = true
  } catch {}
  noteDialog.value = true
}

const saveNote = async () => {
  if (hasNote.value) {
    await updateWeeklyNote(clientId, platformId, noteForm.value.week, noteForm.value)
  } else {
    await createWeeklyNote(clientId, platformId, noteForm.value)
  }
  ElMessage.success('已儲存備註')
  noteDialog.value = false
  await loadWeekly()
}
</script>

<style scoped></style>
