<!-- src/views/AdData.vue – 動態欄位 + 週折線圖（Y 軸可選） -->
<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <!-- ===== 返回上一頁 ===== -->
    <el-button @click="router.back()">返回上層</el-button>
    <h1 class="text-2xl font-bold">廣告數據</h1>

    <el-tabs v-model="activeTab">
      <!-- ──────────────────── 每日記錄 ──────────────────── -->
      <el-tab-pane label="每日記錄" name="daily">
        <!-- 工具列 -->
        <div class="flex justify-between items-center mb-4">
          <!-- 左：匯入 / 格式說明 -->
          <div class="flex items-center gap-2">
            <el-upload :show-file-list="false" accept=".xlsx,.csv" drag :before-upload="importFile">
              <el-button>匯入 CSV / Excel</el-button>
            </el-upload>
            <el-button size="small" plain @click="excelDialog = true">Excel 格式說明</el-button>
          </div>

          <!-- 右：匯出 / 新增 / 說明 -->
          <div class="flex items-center gap-2">
            <el-button size="small" @click="exportDaily">匯出</el-button>
            <el-button type="primary" @click="openCreateDialog">新增記錄</el-button>
            <el-button link size="small" @click="showHelp = true">
              <el-icon>
                <InfoFilled />
              </el-icon>
            </el-button>
          </div>
        </div>

        <!-- 每日表格 -->
        <el-table :data="dailyData" stripe style="width:100%" empty-text="尚無資料">
          <el-table-column prop="date" label="日期" :formatter="dateFmt" width="140" />
          <el-table-column v-for="field in customColumns" :key="field" :label="field">
            <template #default="{ row }">{{ row.extraData?.[field] ?? '' }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ──────────────────── 週摘要 ──────────────────── -->
      <el-tab-pane label="週摘要" name="weekly">
        <!-- 指標切換 + 匯出 -->
        <div class="flex justify-between items-center mb-2">
          <div />
          <el-button size="small" @click="exportWeekly">匯出週報</el-button>
        </div>

        <!-- 折線圖（如需） -->
        <div style="height:300px;width:100%" class="mb-4"><canvas id="weekly-chart" /></div>

        <!-- 週表格 -->
        <el-table :data="weeklyAgg" stripe style="width:100%" empty-text="尚無資料">
          <el-table-column prop="week" label="週 (YYYY-WW)" width="110" />
          <el-table-column prop="count" label="筆數" width="70" />
          <!-- 動態欄位總計 -->
          <el-table-column v-for="field in customColumns" :key="field" :label="field" width="100">
            <template #default="{ row }">{{ row[field] }}</template>
          </el-table-column>

          <!-- 🆕 筆記欄 -->
          <el-table-column label="筆記" width="100">
            <template #default="{ row }">
              <!-- 文字 -->
              <span v-if="row.hasNote && !row.hasImage">📄</span>
              <!-- 圖片 -->
              <el-button v-if="row.hasImage" link type="primary" size="small"
                @click="previewImages(row.images)">查看圖片</el-button>
            </template>
          </el-table-column>

          <!-- 備註操作欄 -->
          <el-table-column label="備註" width="120">
            <template #default="{ row }">
              <el-button link type="primary" @click="openNote(row)">編輯</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ─────────── Dialog：新增每日 ─────────── -->
    <el-dialog v-model="dialogVisible" title="新增每日記錄" width="460px" destroy-on-close>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="日期">
          <el-date-picker v-model="recordForm.date" type="date" style="width:100%" />
        </el-form-item>
        <!-- 動態欄位輸入 -->
        <el-form-item v-for="field in customColumns" :key="field" :label="field">
          <el-input v-model="recordForm.extraData[field]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">確定</el-button>
      </template>
    </el-dialog>

    <!-- ─────────── Dialog：操作說明 ─────────── -->
    <el-dialog v-model="showHelp" title="操作說明" width="380px">
      <ul class="list-disc pl-5 leading-7">
        <li>點 <b>新增記錄</b>：手動輸入每日數據。</li>
        <li>點 <b>匯入 CSV / Excel</b>：批量匯入多筆資料。</li>
        <li>不了解欄位？可先點 <b>Excel 格式說明</b> 查看範例。</li>
        <li>週摘要折線圖可在右上角下拉選擇 Y 軸指標。</li>
      </ul>
      <template #footer>
        <el-button type="primary" @click="showHelp = false">了解</el-button>
      </template>
    </el-dialog>

    <!-- ─────────── Dialog：Excel 欄位規格 ─────────── -->
    <el-dialog v-model="excelDialog" title="Excel / CSV 欄位格式" width="500px" destroy-on-close>
      <el-table :data="excelSpec" border>
        <el-table-column prop="field" label="欄位名稱" width="180" />
        <el-table-column prop="type" label="資料型別" width="150" />
        <el-table-column prop="sample" label="範例值" />
      </el-table>
      <template #footer>
        <el-button @click="excelDialog = false">關閉</el-button>
        <el-button type="primary" @click="downloadTemplate">下載範例檔</el-button>
      </template>
    </el-dialog>

    <!-- ─────────── Dialog：週備註 ─────────── -->
    <el-dialog v-model="noteDialog" title="週備註" width="460px" destroy-on-close>
      <p class="text-sm text-gray-500 mb-2">週別：{{ noteForm.week }}</p>
      <el-input v-model="noteForm.text" type="textarea" rows="4" placeholder="輸入文字筆記" />
      <!-- 上傳圖片（僅本地暫存） -->
      <el-upload multiple list-type="picture-card" :auto-upload="false" v-model:file-list="noteForm.images">
        <el-icon>
          <Plus />
        </el-icon>
      </el-upload>
      <template #footer>
        <el-button @click="noteDialog = false">取消</el-button>
        <el-button type="primary" @click="saveNote">儲存</el-button>
      </template>
    </el-dialog>

    <!-- ─────────── Dialog：圖片預覽 ─────────── -->
    <el-dialog v-model="imgPreviewDialog" title="圖片預覽" width="600px" destroy-on-close>
      <el-carousel height="400px" indicator-position="none">
        <el-carousel-item v-for="(src, i) in imgList" :key="i">
          <img :src="src" class="w-full h-full object-contain" />
        </el-carousel-item>
      </el-carousel>
      <template #footer>
        <el-button type="primary" @click="imgPreviewDialog = false">關閉</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
/**** ---------------------------------------------------- 套件 ---------------------------------------------------- ****/
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import dayjs from 'dayjs'            // ① 先引入 dayjs
import isoWeek from 'dayjs/plugin/isoWeek'
import advancedFormat from 'dayjs/plugin/advancedFormat'
dayjs.extend(isoWeek)                // ② 再掛 plug-in
dayjs.extend(advancedFormat)
import {
  Chart, LineController, LineElement,
  PointElement, LinearScale, Title, CategoryScale
} from 'chart.js'
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

/**** ------------------ API 服務（依專案實作，可替換為 axios 呼叫） ------------------ ****/
import { fetchDaily, createDaily, bulkCreateDaily } from '@/services/adDaily'
import { fetchWeeklyNote, createWeeklyNote, updateWeeklyNote } from '@/services/weeklyNotes'
import { getPlatform } from '@/services/platforms'

/**** ----------------------------- 路由 & 基本狀態 ----------------------------- ****/
const { clientId, platformId } = useRoute().params
const router = useRouter()

const activeTab = ref('daily')
const dialogVisible = ref(false)
const showHelp = ref(false)
const excelDialog = ref(false)
const noteDialog = ref(false)

/**** 自訂欄位 ****/
const customColumns = ref([])      // e.g. ['花費','詢問','觸及']
const platform = ref(null)

/**** 每日資料 ****/
const dailyData = ref([])         // [{ date:'2025-06-16', extraData:{ 花費:100, 詢問:5 } }]
const recordForm = ref({ date: '', extraData: {} })

/* 週備註狀態 */
const weeklyNotes = ref({})       // { '2025-W25': { week:'2025-W25', text:'...' } }

/**** 週資料（前端彙總） ****/
const weeklyAgg = computed(() => {
  // 以 YYYY-WW 為 Key，彙總每個欄位
  const map = {}
  dailyData.value.forEach(d => {
    const week = dayjs(d.date).format('YYYY-WW')
    if (!map[week]) {
      map[week] = { week }
      customColumns.value.forEach(f => (map[week][f] = 0))
    }
    customColumns.value.forEach(f => {
      const val = Number(d.extraData[f] || 0)
      map[week][f] += isNaN(val) ? 0 : val
    })
  })
  // 合併備註資訊
  Object.keys(map).forEach(w => {
    const note = weeklyNotes.value[w]
    map[w].note = note?.text || ''
    map[w].hasNote = !!(note && note.text)
  })
  Object.keys(weeklyNotes.value).forEach(w => {
    if (!map[w]) {
      const note = weeklyNotes.value[w]
      map[w] = { week: w }
      customColumns.value.forEach(f => (map[w][f] = 0))
      map[w].note = note?.text || ''
      map[w].hasNote = !!(note && note.text)
    }
  })
  // 轉陣列並按週期排序
  return Object.values(map).sort((a, b) => a.week.localeCompare(b.week))
})

/**** 折線圖狀態 ****/
const yMetric = ref('')     // 使用者選的欄位
let chartCtx = null
let chart = null

/**** --------------------------------------------------- 動態 Excel 說明 --------------------------------------------------- ****/
const excelSpec = computed(() => {
  const base = [{
    field: '日期',
    type: '日期 (YYYY-MM-DD)',
    sample: dayjs().format('YYYY-MM-DD')
  }]
  return base.concat(
    customColumns.value.map(f => ({ field: f, type: '文字', sample: '' }))
  )
})

/**** 日期 formatter ****/
const dateFmt = row => dayjs(row.date).format('YYYY-MM-DD')

/**** --------------------------------------------------- 資料載入 --------------------------------------------------- ****/
const loadPlatform = async () => {
  platform.value = await getPlatform(clientId, platformId)
  customColumns.value = platform.value?.fields || []
  // 預設 Y 軸選第一個欄位
  if (!yMetric.value && customColumns.value.length) yMetric.value = customColumns.value[0]
}

const loadDaily = async () => {
  const list = await fetchDaily(clientId, platformId)
  dailyData.value = list
}

/**** --------------------------------------------------- 折線圖繪製 --------------------------------------------------- ****/
const drawChart = () => {
  if (!chartCtx) chartCtx = document.getElementById('weekly-chart')
  if (!chartCtx || !yMetric.value) return
  const labels = weeklyAgg.value.map(r => r.week)
  const data = weeklyAgg.value.map(r => r[yMetric.value] ?? 0)
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
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

/**** 監聽資料或指標變動即重繪 ****/
watch([weeklyAgg, yMetric], () => {
  if (activeTab.value === 'weekly') drawChart()
})

/**** Tab 切換（避免元件初始化時畫布尺寸不對） ****/
watch(activeTab, tab => {
  if (tab === 'weekly') drawChart()
})

/**** --------------------------------------------------- 生命週期 --------------------------------------------------- ****/
onMounted(async () => {
  await loadPlatform()
  // 初始化 recordForm.extraData
  customColumns.value.forEach(f => (recordForm.value.extraData[f] = ''))
  await loadDaily()
})

/**** --------------------------------------------------- CRUD：每日 --------------------------------------------------- ****/
const openCreateDialog = () => {
  recordForm.value.date = ''
  customColumns.value.forEach(f => (recordForm.value.extraData[f] = ''))
  dialogVisible.value = true
}

const handleConfirm = async () => {
  if (!recordForm.value.date) return ElMessage.warning('請選擇日期')
  try {
    await createDaily(clientId, platformId, { ...recordForm.value })
    ElMessage.success('已新增記錄')
    dialogVisible.value = false
    await loadDaily()
  } catch (err) {
    ElMessage.error(err.message || '新增失敗')
  }
}

/**** ------------------------------------------------------- 匯入 ------------------------------------------------------- ****/
const importFile = async file => {
  try {
    const ext = file.name.split('.').pop().toLowerCase()
    const rows = ext === 'csv' ? await parseCSV(file) : await parseExcel(file)
    if (!rows.length) throw new Error('檔案無有效資料')
    await bulkCreateDaily(clientId, platformId, rows)
    ElMessage.success(`匯入完成，共 ${rows.length} 筆`)
    await loadDaily()
  } catch (err) {
    ElMessage.error(err.message || '匯入失敗')
  }
  return false
}

/* ---- Excel / CSV 解析 + Normalize ---- */
const parseExcel = file => new Promise((res, rej) => {
  const fr = new FileReader()
  fr.onload = e => {
    const wb = XLSX.read(e.target.result, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    res(normalize(XLSX.utils.sheet_to_json(ws, { defval: '' })))
  }
  fr.onerror = rej
  fr.readAsArrayBuffer(file)
})

const parseCSV = file => new Promise((res, rej) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: r => res(normalize(r.data)),
    error: rej
  })
})

const normalize = arr => {
  return arr.map(r => {
    const extraData = {}
    customColumns.value.forEach(col => { extraData[col] = r[col] || '' })
    return { date: r['日期'] || r.date || '', extraData }
  }).filter(r => r.date)
}

/**** ------------------------------------------------------- 匯出 ------------------------------------------------------- ****/
const exportDaily = () => {
  if (!dailyData.value.length) return ElMessage.warning('無資料可匯出')
  const rows = dailyData.value.map(r => {
    const row = { 日期: dateFmt(r) }
    customColumns.value.forEach(col => { row[col] = r.extraData[col] ?? '' })
    return row
  })
  const csv = Papa.unparse(rows)
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'daily.csv')
}

const exportWeekly = () => {
  if (!weeklyAgg.value.length) return ElMessage.warning('無資料可匯出')
  const rows = weeklyAgg.value.map(r => {
    const obj = { 週: r.week }
    customColumns.value.forEach(col => { obj[col] = r[col] })
    obj['備註'] = r.note || ''
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'weekly')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'weekly.xlsx')
}

/* 下載 Excel 範例（日期 + 自訂欄位） */
const downloadTemplate = () => {
  const sample = { 日期: dayjs().format('YYYY-MM-DD') }
  customColumns.value.forEach(col => { sample[col] = '' })
  const ws = XLSX.utils.json_to_sheet([sample])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'ad-data-template.xlsx')
}

/**** ------------------------------------------------------- 週備註 ------------------------------------------------------- ****/
const noteForm = ref({ week: '', text: '', images: [] })

const openNote = async row => {
  const week = row.week
  let note = null
  try { note = await fetchWeeklyNote(clientId, platformId, week) }
  catch { /* ignore */ }
  if (note) weeklyNotes.value[week] = note
  noteForm.value = { week, text: note?.text || '', images: [] }
  noteDialog.value = true
}

const saveNote = async () => {
  const { week, text } = noteForm.value
  let note
  try {
    note = await updateWeeklyNote(clientId, platformId, week, { text })
  } catch {
    note = await createWeeklyNote(clientId, platformId, { week, text })
  }
  weeklyNotes.value[week] = note
  ElMessage.success('已儲存備註')
  noteDialog.value = false
}
</script>

<style scoped>
/* 自行視覺調整 */
</style>
