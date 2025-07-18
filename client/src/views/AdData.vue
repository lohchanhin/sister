<!-- src/views/AdData.vue – 動態欄位 + 週折線圖（Y 軸可選） -->
<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <Toast />
    <ConfirmDialog />
    <!-- ===== 返回上一頁 ===== -->
    <Button @click="router.back()" label="返回上層" />
    <h1 class="text-2xl font-bold">廣告數據</h1>

    <TabView v-model:activeIndex="activeTabIndex">
      <!-- ──────────────────── 每日記錄 ──────────────────── -->
      <TabPanel header="每日記錄">
        <!-- 工具列 -->
        <div class="flex justify-between items-center mb-4">
          <!-- 左：匯入 / 格式說明 -->
          <div class="flex items-center gap-2">
            <FileUpload mode="basic" :auto="true" :customUpload="true" @uploader="importFile" chooseLabel="匯入 CSV / Excel" accept=".xlsx,.csv" />
            <Button label="Excel 格式說明" size="small" outlined @click="excelDialog = true" />
          </div>

          <!-- 右：匯出 / 新增 / 說明 -->
          <div class="flex items-center gap-2">
            <Button label="匯出" size="small" @click="exportDaily" />
            <Button label="新增記錄" @click="openCreateDialog" />
            <Button icon="pi pi-info-circle" link size="small" @click="showHelp = true" />
          </div>
        </div>

        <!-- 每日表格 -->
        <DataTable :value="dailyData" stripedRows style="width:100%" emptyMessage="尚無資料">
          <Column field="date" header="日期" width="140">
            <template #body="{ data }">
              {{ dateFmt(data) }}
            </template>
          </Column>
          <Column v-for="field in customColumns" :key="field.name" :header="field.name">
            <template #body="{ data }">
              <span v-if="field.type === 'date'" :style="{ backgroundColor: data.colors?.[field.name] }">
                {{ formatExtraDate(data.extraData?.[field.name]) }}
              </span>
              <span v-else :style="{ backgroundColor: data.colors?.[field.name] }">{{ data.extraData?.[field.name] ?? ''
              }}</span>
            </template>
          </Column>
          <Column header="操作" width="160">
            <template #body="{ data }">
              <Button link severity="primary" @click="openEdit(data)" label="編輯" />
              <Button link severity="danger" @click="removeDaily(data)" label="刪除" />
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- ──────────────────── 週摘要 ──────────────────── -->
      <TabPanel header="週摘要">
        <!-- 指標切換 + 匯出 -->
        <div class="flex justify-between items-center mb-2">
          <Dropdown v-model="yMetric" :options="numericColumns" style="width:160px" v-if="numericColumns.length" />
          <Button label="匯出週報" size="small" @click="exportWeekly" />
        </div>

        <!-- 折線圖（如需） -->
        <div style="height:300px;width:100%" class="mb-4">
          <canvas id="weekly-chart" />
        </div>

        <!-- 週表格 -->
        <DataTable :value="weeklyAgg" stripedRows style="width:100%" emptyMessage="尚無資料">
          <!-- 第一欄 -->
          <Column header="日期" width="200">
            <template #body="{ data }">
              {{ formatWeekRange(data.week) }}
            </template>
          </Column>
          <!-- 動態欄位總計 -->
          <Column v-for="field in numericColumns" :key="field" :header="field" width="100">
            <template #body="{ data }">{{ data[field] }}</template>
          </Column>

          <!-- 圖片欄 -->
          <Column header="圖片" width="120">
            <template #body="{ data }">
              <Button v-if="data.hasImage" link severity="primary" size="small"
                @click="previewImages(data.images)" label="查看圖片" />
            </template>
          </Column>

          <!-- 筆記欄 -->
          <Column header="筆記" width="160">
            <template #body="{ data }">
              <span v-html="formatNote(data.note)" />
            </template>
          </Column>

          <!-- 備註操作欄 -->
          <Column header="備註" width="120">
            <template #body="{ data }">
              <Button link severity="primary" @click="openNote(data)" label="編輯" />
            </template>
          </Column>
        </DataTable>
      </TabPanel>
    </TabView>

    <!-- ─────────── Dialog：新增/編輯每日 ─────────── -->
    <Dialog v-model:visible="dialogVisible" :header="editing ? '編輯每日記錄' : '新增每日記錄'" modal style="width: 460px">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
            <label for="date">日期</label>
            <DatePicker v-model="recordForm.date" inputId="date" style="width:100%" />
        </div>
        <!-- 動態欄位輸入 -->
        <div v-for="field in customColumns" :key="field.name" class="flex flex-col gap-2">
            <label :for="field.name">{{ field.name }}</label>
            <div class="flex items-center gap-2 w-full">
                <DatePicker v-if="field.type === 'date'" v-model="recordForm.extraData[field.name]" :inputId="field.name" style="flex:1" />
                <InputText v-else v-model="recordForm.extraData[field.name]" :inputId="field.name" style="flex:1" />
                <!-- 固定色票下拉 -->
                <Dropdown v-model="recordForm.colors[field.name]" :options="colorOptions" optionLabel="label" optionValue="value" placeholder="顏色" style="width: 100px" showClear>
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <span class="inline-block w-3 h-3 mr-2 align-middle rounded-sm" :style="{ backgroundColor: slotProps.option.value }" />
                            <div>{{ slotProps.option.label }}</div>
                        </div>
                    </template>
                </Dropdown>
            </div>
        </div>
      </div>
      <template #footer>
        <Button label="取消" severity="secondary" @click="dialogVisible = false" />
        <Button label="確定" @click="handleConfirm" />
      </template>
    </Dialog>

    <!-- ─────────── Dialog：操作說明 ─────────── -->
    <Dialog v-model:visible="showHelp" header="操作說明" modal style="width: 380px">
      <ul class="list-disc pl-5 leading-7">
        <li>點 <b>新增記錄</b>：手動輸入每日數據。</li>
        <li>點 <b>匯入 CSV / Excel</b>：批量匯入多筆資料。</li>
        <li>不了解欄位？可先點 <b>Excel 格式說明</b> 查看範例。</li>
        <li>週摘要折線圖可在右上角下拉選擇 Y 軸指標。</li>
      </ul>
      <template #footer>
        <Button label="了解" @click="showHelp = false" />
      </template>
    </Dialog>

    <!-- ─────────── Dialog：Excel 欄位規格 ─────────── -->
    <Dialog v-model:visible="excelDialog" header="Excel / CSV 欄位格式" modal style="width: 500px">
      <DataTable :value="excelSpec" bordered>
        <Column field="field" header="欄位名稱" width="180" />
        <Column field="type" header="資料型別" width="150" />
        <Column field="sample" header="範例值" />
      </DataTable>
      <template #footer>
        <Button label="關閉" severity="secondary" @click="excelDialog = false" />
        <Button label="下載範例檔" @click="downloadTemplate" />
      </template>
    </Dialog>

    <!-- ─────────── Dialog：週備註 ─────────── -->
    <Dialog v-model:visible="noteDialog" header="週備註" modal style="width: 460px">
      <p class="text-sm text-gray-500 mb-2">週別：{{ formatWeekRange(noteForm.week) }}</p>
      <Textarea v-model="noteForm.text" rows="4" placeholder="輸入文字筆記" style="width: 100%" />
      <!-- 上傳圖片（僅本地暫存） -->
      <FileUpload multiple :auto="false" :customUpload="true" @uploader="noteForm.images = $event.files" :showUploadButton="false" :showCancelButton="false" >
        <template #empty>
            <i class="pi pi-plus"></i>
        </template>
      </FileUpload>
      <template #footer>
        <Button label="取消" severity="secondary" @click="noteDialog = false" />
        <Button label="儲存" @click="saveNote" />
      </template>
    </Dialog>

    <!-- ─────────── Dialog：圖片預覽 ─────────── -->
    <Dialog v-model:visible="imgPreviewDialog" header="圖片預覽" modal style="width: 600px">
      <Carousel :value="imgList" :numVisible="1" :numScroll="1">
        <template #item="slotProps">
            <img :src="slotProps.data" class="w-full h-full object-contain" />
        </template>
      </Carousel>
      <template #footer>
        <Button label="關閉" @click="imgPreviewDialog = false" />
      </template>
    </Dialog>
  </section>
</template>

<script setup>
/**** ---------------------------------------------------- 套件 ---------------------------------------------------- ****/
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
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

import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import FileUpload from 'primevue/fileupload';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import DatePicker from 'primevue/datepicker';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Carousel from 'primevue/carousel';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

/**** ------------------ API 服務（依專案實作，可替換為 axios 呼叫） ------------------ ****/
import {
  fetchDaily,
  createDaily,
  bulkCreateDaily,
  updateDaily,
  deleteDaily
} from '@/services/adDaily'
import { fetchWeeklyNote, fetchWeeklyNotes, createWeeklyNote, updateWeeklyNote, getWeeklyNoteImageUrl } from '@/services/weeklyNotes'
import { getPlatform } from '@/services/platforms'

/* ======== 固定 3 色 ======== */
const colorOptions = [
  { label: '淺青', value: '#CCF2F4' },
  { label: '淺黃', value: '#FFF9C4' },
  { label: '淺紅', value: '#FFCDD2' }
]

/**** ----------------------------- 路由 & 基本狀態 ----------------------------- ****/
const { clientId, platformId } = useRoute().params
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const activeTab = ref('daily')
const tabMap = { daily: 0, weekly: 1 }
const activeTabIndex = computed({
  get: () => tabMap[activeTab.value],
  set: val => {
    activeTab.value = Object.keys(tabMap).find(key => tabMap[key] === val)
  }
})

const dialogVisible = ref(false)
const editing = ref(false)
const editingId = ref('')
const showHelp = ref(false)
const excelDialog = ref(false)
const noteDialog = ref(false)
const imgPreviewDialog = ref(false)
const imgList = ref([])

/**** 自訂欄位 ****/
const customColumns = ref([])      // e.g. [{ name:'備註', type:'text' }]
const platform = ref(null)
const numericColumns = computed(() =>
  customColumns.value.filter(f => f.type === 'number').map(f => f.name)
)

/**** 每日資料 ****/
const dailyData = ref([])         // [{ date:'2025-06-16', extraData:{ 花費:100, 詢問:5 } }]
const recordForm = ref({ date: '', extraData: {}, colors: {} })

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
      customColumns.value.forEach(f => {
        if (f.type === 'number') map[week][f.name] = 0
      })
    }
    customColumns.value.forEach(f => {
      if (f.type === 'number') {
        const val = Number(d.extraData[f.name] || 0)
        map[week][f.name] += isNaN(val) ? 0 : val
      }
    })
  })
  // 合併備註資訊
  Object.keys(map).forEach(w => {
    const note = weeklyNotes.value[w]
    map[w].note = note?.text || ''
    map[w].hasNote = !!(note && note.text)
    map[w].hasImage = !!(note && note.images && note.images.length)
    map[w].images = note?.images || []
  })
  Object.keys(weeklyNotes.value).forEach(w => {
    if (!map[w]) {
      const note = weeklyNotes.value[w]
      map[w] = { week: w }
      customColumns.value.forEach(f => {
        if (f.type === 'number') map[w][f.name] = 0
      })
      map[w].note = note?.text || ''
      map[w].hasNote = !!(note && note.text)
      map[w].hasImage = !!(note && note.images && note.images.length)
      map[w].images = note?.images || []
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
    customColumns.value.map(f => ({
      field: f.name,
      type: f.type === 'number' ? '數字'
        : f.type === 'date' ? '日期 (YYYY-MM-DD)'
          : '文字',
      sample: f.type === 'date' ? dayjs().format('YYYY-MM-DD') : ''
    }))
  )
})

/**** 日期 formatter ****/
const dateFmt = row => dayjs(row.date).format('YYYY-MM-DD')
const formatExtraDate = val =>
  val ? dayjs(val).format('YYYY-MM-DD') : ''

// 將 "YYYY-WW" 轉為 "YYYY/MM/DD - YYYY/MM/DD"
const formatWeekRange = (w) => {
  if (!w) return ''
  const m = String(w).match(/(\d{4})-W?(\d{1,2})/)
  if (!m) return ''
  const [, y, wk] = m

  // 依 ISO 8601 規定，1 月 4 日必定落在該年的第 1 週
  const base = dayjs(`${y}-01-04`).isoWeek(Number(wk))  // ➜ 該 ISO 週的「週四」
  const start = base.startOf('isoWeek').format('YYYY/MM/DD')
  const end = base.endOf('isoWeek').format('YYYY/MM/DD')
  return `${start} - ${end}`
}




/** 格式化筆記文字為 HTML */
const escapeHtml = str =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatNote = text => {
  if (!text) return ''
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  const bulletRE = /^\s*[-*•]\s+/
  const numberRE = /^\s*\d+[.)、]\s+/
  if (lines.length === 1 && !bulletRE.test(lines[0]) && !numberRE.test(lines[0])) {
    return `<p>${escapeHtml(lines[0])}</p>`
  }
  const isOrdered = lines.every(l => numberRE.test(l))
  const tag = isOrdered ? 'ol' : 'ul'
  const itemRE = isOrdered ? numberRE : bulletRE
  const items = lines
    .map(l => l.replace(itemRE, ''))
    .map(l => `<li>${escapeHtml(l)}</li>`)
    .join('')
  return `<${tag}>${items}</${tag}>`
}

/**** --------------------------------------------------- 資料載入 --------------------------------------------------- ****/
const loadPlatform = async () => {
  platform.value = await getPlatform(clientId, platformId)
  customColumns.value = (platform.value?.fields || [])
    .map(f =>
      typeof f === 'string'
        ? { name: f, type: 'text', order: 0 }
        : { name: f.name, type: f.type || 'text', order: f.order || 0 }
    )
    .sort((a, b) => a.order - b.order)
  // 預設 Y 軸選第一個欄位
  if (!yMetric.value) {
    const first = customColumns.value.find(f => f.type === 'number')
    if (first) yMetric.value = first.name
  }
}

const loadDaily = async () => {
  const list = await fetchDaily(clientId, platformId)
  dailyData.value = list
}

const loadWeeklyNotes = async () => {
  const list = await fetchWeeklyNotes(clientId, platformId)
  weeklyNotes.value = list.reduce((acc, n) => {
    acc[n.week] = n
    return acc
  }, {})
}

/**** --------------------------------------------------- 折線圖繪製 --------------------------------------------------- ****/
const drawChart = () => {
  if (!chartCtx) chartCtx = document.getElementById('weekly-chart')
  if (!chartCtx || !yMetric.value) return
  const labels = weeklyAgg.value.map(r => formatWeekRange(r.week))
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
  customColumns.value.forEach(f => {
    recordForm.value.extraData[f.name] = ''
    recordForm.value.colors[f.name] = ''
  })
  await loadDaily()
  await loadWeeklyNotes()
})

/**** --------------------------------------------------- CRUD：每日 --------------------------------------------------- ****/
const openCreateDialog = () => {
  editing.value = false
  editingId.value = ''
  recordForm.value.date = ''
  customColumns.value.forEach(f => {
    recordForm.value.extraData[f.name] = ''
    recordForm.value.colors[f.name] = ''
  })
  dialogVisible.value = true
}

const handleConfirm = async () => {
  if (!recordForm.value.date) return toast.add({ severity: 'warn', summary: '警告', detail: '請選擇日期', life: 3000 })
  try {
    if (editing.value) {
      await updateDaily(clientId, platformId, editingId.value, {
        ...recordForm.value
      })
      toast.add({ severity: 'success', summary: '成功', detail: '已更新記錄', life: 3000 })
    } else {
      await createDaily(clientId, platformId, { ...recordForm.value })
      toast.add({ severity: 'success', summary: '成功', detail: '已新增記錄', life: 3000 })
    }
    dialogVisible.value = false
    await loadDaily()
  } catch (err) {
    toast.add({ severity: 'error', summary: '錯誤', detail: err.message || (editing.value ? '更新失敗' : '新增失敗'), life: 3000 })
  }
}

const openEdit = row => {
  editing.value = true
  editingId.value = row._id
  recordForm.value.date = row.date
  recordForm.value.extraData = { ...row.extraData }
  recordForm.value.colors = { ...row.colors }
  dialogVisible.value = true
}

const removeDaily = async row => {
  confirm.require({
    message: '確定刪除？',
    header: '警告',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '刪除',
    rejectLabel: '取消',
    accept: async () => {
      await deleteDaily(clientId, platformId, row._id)
      toast.add({ severity: 'success', summary: '成功', detail: '已刪除紀錄', life: 3000 })
      await loadDaily()
    }
  })
}

/**** ------------------------------------------------------- 匯入 ------------------------------------------------------- ****/
const importFile = async (event) => {
  const file = event.files[0]
  try {
    const ext = file.name.split('.').pop().toLowerCase()
    const rows = ext === 'csv' ? await parseCSV(file) : await parseExcel(file)
    if (!rows.length) throw new Error('檔案無有效資料')
    await bulkCreateDaily(clientId, platformId, rows)
    toast.add({ severity: 'success', summary: '成功', detail: `匯入完成，共 ${rows.length} 筆`, life: 3000 })
    await loadDaily()
  } catch (err) {
    toast.add({ severity: 'error', summary: '錯誤', detail: err.message || '匯入失敗', life: 3000 })
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

const sanitizeNumber = val =>
  parseFloat(String(val).replace(/[^\d.]/g, '')) || 0

const normalize = arr => {
  return arr.map(r => {
    const extraData = {}
    const colors = {}
    customColumns.value.forEach(col => {
      const val = r[col.name] || ''
      if (col.type === 'number') extraData[col.name] = sanitizeNumber(val)
      else extraData[col.name] = val
      if (r[`color_${col.name}`]) colors[col.name] = r[`color_${col.name}`]
    })
    const obj = { date: r['日期'] || r.date || '', extraData }
    if (Object.keys(colors).length) obj.colors = colors
    return obj
  }).filter(r => r.date)
}

/**** ------------------------------------------------------- 匯出 ------------------------------------------------------- ****/
const exportDaily = () => {
  if (!dailyData.value.length) return toast.add({ severity: 'warn', summary: '警告', detail: '無資料可匯出', life: 3000 })
  const rows = dailyData.value.map(r => {
    const row = { 日期: dateFmt(r) }
    customColumns.value.forEach(col => {
      const val = r.extraData[col.name]
      row[col.name] = col.type === 'date' ? formatExtraDate(val) : (val ?? '')
      if (r.colors && r.colors[col.name]) {
        row[`color_${col.name}`] = r.colors[col.name]
      }
    })
    return row
  })
  const csv = Papa.unparse(rows)
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'daily.csv')
}

/* ------------------------------------------------ 匯出週報 ------------------------------------------------ */
async function exportWeekly() {
  if (!weeklyAgg.value.length) return toast.add({ severity: 'warn', summary: '警告', detail: '無資料可匯出', life: 3000 })
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('weekly')

  /* 標頭 */
  const headers = ['日期', ...numericColumns.value, '筆記', '圖片']
  ws.addRow(headers)
  ws.getRow(1).font = { bold: true }

  /* 每列資料 + 圖片 */
  for (const row of weeklyAgg.value) {
    const data = [
      formatWeekRange(row.week),
      ...numericColumns.value.map(c => row[c] || 0),
      row.note || '',
      ''
    ]
    const wsRow = ws.addRow(data)

    /* 第一張圖片嵌入 */
    if (row.hasImage && row.images[0]) {
      try {
        const signedUrl = await getWeeklyNoteImageUrl(clientId, platformId, row.images[0])
        const res = await fetch(signedUrl)
        const buf = await res.arrayBuffer()
        const ext = row.images[0].split('.').pop().replace('jpg', 'jpeg')   // exceljs 要用 jpeg / png
        const imgId = wb.addImage({ buffer: buf, extension: ext })
        const rIdx = wsRow.number - 1           // zero-based
        const cIdx = headers.length - 1         // 「圖片」欄
        ws.addImage(imgId, {
          tl: { col: cIdx, row: rIdx },
          ext: { width: 80, height: 80 }
        })
        wsRow.height = 60                        // 調高列高
        ws.getColumn(cIdx + 1).width = 15          // 調寬圖片欄
      } catch { /* 圖片失敗就跳過 */ }
    }
  }

  /* 匯出 */
  const buf = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }), 'weekly.xlsx')
}

/* 下載 Excel 範例（日期 + 自訂欄位） */
const downloadTemplate = () => {
  const sample = { 日期: dayjs().format('YYYY-MM-DD') }
  customColumns.value.forEach(col => { sample[col.name] = '' })
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
  let images = []
  if (note?.images && note.images.length) {
    const promises = note.images.map(async p => {
      try {
        const url = await getWeeklyNoteImageUrl(clientId, platformId, p)
        return { name: p, url }
      } catch {
        return null
      }
    })
    images = (await Promise.all(promises)).filter(Boolean)
  }
  noteForm.value = { week, text: note?.text || '', images }
  noteDialog.value = true
}

const saveNote = async () => {
  const { week, text, images } = noteForm.value
  let note
  try {
    note = await updateWeeklyNote(clientId, platformId, week, { text, images: images.map(f => f.raw) })
  } catch {
    note = await createWeeklyNote(clientId, platformId, { week, text, images: images.map(f => f.raw) })
  }
  weeklyNotes.value[week] = note
  toast.add({ severity: 'success', summary: '成功', detail: '已儲存備註', life: 3000 })
  noteDialog.value = false
}

const previewImages = async imgs => {
  if (!imgs || !imgs.length) return
  if (imgs[0].url) {
    imgList.value = imgs.map(i => i.url)
  } else {
    const urls = await Promise.all(
      imgs.map(p => getWeeklyNoteImageUrl(clientId, platformId, p))
    )
    imgList.value = urls
  }
  imgPreviewDialog.value = true
}
</script>

<style scoped>
/* 自行視覺調整 */
</style>