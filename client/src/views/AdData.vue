<!-- src/views/AdData.vue – 動態欄位 + 週折線圖（Y 軸可選、完全動態相容） -->
<template>
  <section class="p-6 space-y-3 bg-white text-gray-800">
    <Toast />
    <ConfirmDialog />

    <!-- ===== 返回上一頁 ===== -->
    <Button @click="router.back()" label="返回上層" />
    <h1 class="text-2xl font-bold">广告数据</h1>

    <ProgressSpinner v-if="loading" />

    <TabView v-model:activeIndex="activeTabIndex">
      <!-- ──────────────────── 每日記錄 ──────────────────── -->
      <TabPanel header="每日記錄">
        <!-- 工具列 -->
        <div class="flex justify-between items-center mb-2">
          <!-- 左：匯入 / 格式說明 -->
          <div class="flex items-center gap-2">
            <FileUpload mode="basic" :auto="true" :customUpload="true" @uploader="importFile"
              chooseLabel="匯入 CSV / Excel" accept=".xlsx,.csv" />
            <Button label="Excel 格式說明" size="small" outlined @click="excelDialog = true" />
          </div>

          <!-- 右：日期範圍 / 匯出 / 新增 / 說明 -->
          <div class="flex items-center gap-2">
            <DatePicker v-model="startDate" placeholder="開始日期" />
            <DatePicker v-model="endDate" placeholder="結束日期" />
            <Button label="匯出" size="small" @click="exportDaily" />
            <Button label="新增記錄" @click="openCreateDialog" />
            <Button label="字段重新匹配" size="small" outlined @click="openRemapDialog" />

            <Button icon="pi pi-info-circle" link size="small" @click="showHelp = true" />
          </div>
        </div>

        <!-- 排序（送參數給後端；不依賴欄位點擊排序） -->
        <div class="flex items-center gap-2 mb-2">
          <Dropdown v-model="sortField" :options="sortOptions" optionLabel="label" optionValue="value"
            placeholder="排序欄位" class="w-40" showClear />
          <Button size="small" @click="toggleOrder" :label="sortOrder === 1 ? '升序' : '降序'" />
        </div>

        <!-- 每日表格 -->
        <div class="sticky-table-wrapper">
          <DataTable :value="adData" :rowKey="'_id'" :loading="loading" stripedRows style="width:100%"
            emptyMessage="尚無資料" :sortField="sortField" :sortOrder="sortOrder" scrollable scrollHeight="70vh">
            <Column field="date" header="日期" width="140" sortable>
              <template #body="{ data }">
                {{ dateFmt(data) }}
              </template>
            </Column>

            <!-- 動態欄：提供 field/columnKey，避免 Column 未被註冊 -->
            <Column v-for="col in customColumns" :key="keyOf(col)" :field="keyOf(col)" :columnKey="keyOf(col)"
              :header="labelOf(col)">
              <template #body="{ data }">
                <span :style="{ backgroundColor: colorByField(data, col) || undefined }">
                  <template v-if="col.type === 'date'">
                    {{ formatExtraDate(valByField(data, col)) }}
                  </template>
                  <template v-else-if="col.type === 'formula'">
                    {{ formatNumber(valByFieldWithFormula(data, col)) }}
                  </template>
                  <template v-else-if="col.type === 'number'">
                    {{ formatNumber(valByField(data, col)) }}
                  </template>
                  <template v-else>
                    {{ valByField(data, col) ?? '' }}
                  </template>
                </span>
              </template>
            </Column>

            <Column header="操作" width="220">
              <template #body="{ data }">
                <Button link severity="primary" @click="openEdit(data)" label="編輯" />
                <Button link severity="danger" @click="removeDaily(data)" label="刪除" />
                <Button link severity="secondary" @click="openRemapDialogForRow(data)" label="字段匹配" />

              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>

      <!-- ──────────────────── 週摘要 ──────────────────── -->
      <TabPanel header="週摘要">
        <!-- 指標切換 + 匯出 -->
        <div class="flex justify-between items-center mb-2">
          <Dropdown v-model="yMetric" :options="numericColumns" :optionLabel="(o) => labelOf(o)"
            :optionValue="(o) => keyOf(o)" style="width:160px" v-if="numericColumns.length" />
          <Button label="匯出週報" size="small" @click="exportWeekly" />
        </div>

        <!-- 折線圖 -->
        <div style="height:300px;width:100%" class="mb-2">
          <canvas id="weekly-chart" />
        </div>

        <!-- 週表格 -->
        <div class="sticky-table-wrapper">
          <DataTable :value="weeklyAgg" :loading="loading" stripedRows style="width:100%" emptyMessage="尚無資料" scrollable
            scrollHeight="70vh">
            <Column header="日期" width="200">
              <template #body="{ data }">
                {{ formatWeekRange(data.week) }}
              </template>
            </Column>

            <!-- 動態欄位總計 -->
            <Column v-for="field in numericColumns" :key="keyOf(field)" :header="labelOf(field)" width="100">
              <template #body="{ data }">
                {{ formatNumber(data[keyOf(field)]) }}
              </template>
            </Column>

            <!-- 圖片欄 -->
            <Column header="圖片" width="120">
              <template #body="{ data }">
                <Button v-if="data.hasImage" link severity="primary" size="small" @click="previewImages(data.images)"
                  label="查看圖片" />
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
        </div>
      </TabPanel>
    </TabView>

    <!-- ─────────── Dialog：新增/編輯每日 ─────────── -->
    <Dialog v-model:visible="dialogVisible" :header="editing ? '編輯每日記錄' : '新增每日記錄'" modal
      style="max-width:480px;width:100%">
      <div class="flex-col gap-4 w-full">
        <!-- 日期欄 -->
        <div class="flex gap-2">
          <label for="date" class="w-16 shrink-0 pt-2 text-right">日期</label>
          <DatePicker v-model="recordForm.date" inputId="date" class="flex-1 min-w-0" />
        </div>

        <!-- 動態欄位 -->
        <div v-for="field in customColumns" :key="keyOf(field)" class="flex gap-2">
          <label :for="keyOf(field)" class="w-16 shrink-0 pt-2 text-right">{{ labelOf(field) }}</label>
          <div class="flex gap-2 flex-1">
            <DatePicker v-if="field.type === 'date'" v-model="recordForm.extraData[field.id]" :inputId="keyOf(field)"
              class="flex-1" />
            <InputText v-else v-model="recordForm.extraData[field.id]" :inputId="keyOf(field)" class="flex-1"
              :readonly="field.type === 'formula'" />
            <!-- 色票下拉固定 96px -->
            <Dropdown v-model="recordForm.colors[field.id]" :options="colorOptions" optionLabel="label"
              optionValue="value" placeholder="顏色" class="w-24" showClear>
              <template #option="{ option }">
                <div class="flex items-center">
                  <span class="inline-block w-3 h-3 mr-2 rounded-sm" :style="{ backgroundColor: option.value }" />
                  {{ option.label }}
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
      <ul class="list-disc pl-5 leading-6">
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
      <FileUpload name="images" accept="image/*" multiple :auto="false" v-model:files="noteForm.images"
        @select="onImageSelect" @remove="onImageRemove" :showUploadButton="false" :showCancelButton="false">
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

    <!-- ─────────── Dialog：字段匹配（以第一筆樣本建立 alias，保存後一次性更新所有資料） ─────────── -->
    <Dialog v-model:visible="mapDialogVisible" header="字段匹配" modal style="width: 640px">
      <p class="text-sm text-gray-500 mb-3">
        偵測到資料中的 <b>舊鍵</b> 無法與平台字段自動對應。請用第一筆資料作為樣本，將舊鍵對應到新字段。
      </p>

      <DataTable :value="mapRows" size="small">
        <Column header="舊鍵 (extraData.*)">
          <template #body="{ data }">
            <code class="text-xs">{{ data.oldKey }}</code>
          </template>
        </Column>
        <Column header="樣本值" style="width:160px">
          <template #body="{ data }">
            <span class="text-xs truncate block max-w-[150px]" :title="String(data.sample)">{{ data.sample }}</span>
          </template>
        </Column>
        <Column header="映射至新字段" style="width:260px">
          <template #body="{ data }">
            <Dropdown v-model="data.mappedId" :options="customColumns" optionLabel="name" optionValue="id"
              placeholder="選擇字段" class="w-full" :showClear="true" />
          </template>
        </Column>
      </DataTable>

      <template #footer>
        <div class="w-full flex items-center justify-between">
          <div v-if="applying" class="text-sm text-gray-600">
            正在寫回：{{ progress.done }} / {{ progress.total }}
          </div>
          <div class="flex gap-2">
            <Button label="取消" severity="secondary" :disabled="applying" @click="mapDialogVisible = false" />
            <Button label="保存映射（不寫回）" :disabled="applying" @click="saveMappingFromFirstRow(false)" />
            <Button label="保存並一次性更新所有資料" :loading="applying" @click="saveMappingFromFirstRow(true)" />
          </div>
        </div>
      </template>
    </Dialog>
  </section>
</template>

<script setup>
/**** ---------------------------------------------------- 套件（全部放最上面，避免 TDZ/未定義） ---------------------------------------------------- ****/
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import advancedFormat from 'dayjs/plugin/advancedFormat'
dayjs.extend(isoWeek)
dayjs.extend(advancedFormat)

import {
  Chart, LineController, LineElement,
  PointElement, LinearScale, Title, CategoryScale
} from 'chart.js'
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import FileUpload from 'primevue/fileupload'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import DatePicker from 'primevue/datepicker'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Carousel from 'primevue/carousel'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import ProgressSpinner from 'primevue/progressspinner'

/**** ------------------ API 服務（依專案實作，可替換為 axios 呼叫） ------------------ ****/
import {
  fetchDaily,
  createDaily,
  bulkCreateDaily,
  updateDaily,
  deleteDaily
} from '@/services/adDaily'
import {
  fetchWeeklyNote,
  fetchWeeklyNotes,
  createWeeklyNote,
  updateWeeklyNote,
  getWeeklyNoteImageUrl
} from '@/services/weeklyNotes'
import { getPlatform } from '@/services/platforms'


/** 嚴格以「第一筆資料」為準的重新匹配：
 * 只列出第一筆 extraData 裡「不是當前新鍵（id/slug）」的鍵（= 舊鍵）。
 * 不看 colors，不合併 alias，避免無關鍵亂入。
 */
function openRemapDialog() {
  if (!adData.value.length) {
    toast.add({ severity: 'info', summary: '提示', detail: '目前没有资料可用于匹配', life: 2200 })
    return
  }
  const first = adData.value[0]
  const ed = first?.extraData || {}

  // 允許集合：現有 id + slug（只要是這兩類都視為“新鍵”）
  const idSet = new Set(customColumns.value.map(f => f.id))
  const slugSet = new Set(customColumns.value.map(f => f.slug).filter(Boolean))
  const allowed = new Set([...idSet, ...slugSet])

  // 只拿第一筆 extraData 中，不屬於 allowed 的鍵（就是舊鍵）
  const oldKeysOnly = Object.keys(ed).filter(k => !allowed.has(k))

  if (!oldKeysOnly.length) {
    toast.add({ severity: 'info', summary: '提示', detail: '第一笔资料没有需要匹配的旧键', life: 2200 })
    return
  }

  // 帶出 alias 中已有的預設對應（若有）
  mapRows.value = oldKeysOnly.map(oldKey => ({
    oldKey,
    sample: ed[oldKey],
    mappedId: (fieldAliases.value || {})[oldKey] || ''
  }))

  mapDialogVisible.value = true
}




/**** ---------------------------------------------------- 路由 / 狀態 ---------------------------------------------------- ****/
const route = useRoute()
const { clientId, platformId } = route.params
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const loading = ref(false)

const activeTab = ref('daily')
const tabMap = { daily: 0, weekly: 1 }
const activeTabIndex = computed({
  get: () => tabMap[activeTab.value],
  set: val => { activeTab.value = Object.keys(tabMap).find(key => tabMap[key] === val) }
})

const dialogVisible = ref(false)
const editing = ref(false)
const editingId = ref('')
const showHelp = ref(false)
const excelDialog = ref(false)
const noteDialog = ref(false)
const imgPreviewDialog = ref(false)
const imgList = ref([])

/**** ---------------------------------------------------- 共用工具 ---------------------------------------------------- ****/
const slugify = s => (s ?? '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
const keyOf = (f) => (f?.slug && typeof f.slug === 'string' ? f.slug : f?.id)
const labelOf = (f) => f?.name || f?.slug || f?.id || ''

const isStrictNumber = (v) => typeof v === 'number' && Number.isFinite(v)
const looksNumericString = (v) => typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())

/**** ---------------------------------------------------- 欄位別名映射（舊ID -> 新ID） ---------------------------------------------------- ****/
/* 目的：當資料舊筆記錄使用舊欄位ID，而 getPlatform() 回傳新欄位ID 時，透過此映射仍能正確顯示 */
const aliasStoreKey = (pid) => `addata_alias_${pid}`
const fieldAliases = ref({})  // 形如：{ 'oldFieldIdA': 'newFieldIdX', ... }
const loadAliases = () => {
  if (typeof window === 'undefined') { fieldAliases.value = {}; return }
  try { fieldAliases.value = JSON.parse(localStorage.getItem(aliasStoreKey(platformId)) || '{}') }
  catch { fieldAliases.value = {} }
}
const saveAliases = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(aliasStoreKey(platformId), JSON.stringify(fieldAliases.value))
  }
}

/**** ---------------------------------------------------- 取值器（支援 alias + 多候選鍵 + 公式顯示） ---------------------------------------------------- ****/
const isPlainKey = (k) => typeof k === 'string' && /^[a-z0-9_]{3,}$/i.test(k)

const valByField = (row, f) => {
  const ed = row?.extraData || row || {}
  // 1) alias（舊鍵→新id）
  for (const [oldKey, newId] of Object.entries(fieldAliases.value || {})) {
    if (newId === f.id && oldKey in ed) return ed[oldKey]
  }
  // 2) 候選：id → 安全 slug →（可選）英文名
  const cands = [f?.id]
  if (isSafeSlug(f?.slug)) cands.push(f.slug)
  if (isPlainKey(f?.name)) cands.push(f.name) // 僅英文/數字鍵
  for (const k of cands) if (k in ed) return ed[k]
  return ''
}

const colorByField = (row, f) => {
  const cs = row?.colors || {}
  for (const [oldKey, newId] of Object.entries(fieldAliases.value || {})) {
    if (newId === f.id && oldKey in cs) return cs[oldKey]
  }
  const cands = [f?.id]
  if (isSafeSlug(f?.slug)) cands.push(f.slug)
  if (isPlainKey(f?.name)) cands.push(f.name)
  for (const k of cands) if (k in cs) return cs[k]
  return ''
}


/* 公式顯示（按行即時計算，不依賴資料已存入的值） */
const formulaPattern = /^[0-9+\-*/().\s_a-zA-Z]+$/
const evalFormula = (formula, data) => {
  if (!formula || !formulaPattern.test(formula)) return 0
  try {
    const fn = new Function('data', `with (data) { return ${formula}; }`)
    const res = fn(data)
    return typeof res === 'number' && Number.isFinite(res) ? res : 0
  } catch { return 0 }
}
const valByFieldWithFormula = (row, f) => {
  if (f.type !== 'formula') return valByField(row, f)
  const vars = {}
  customColumns.value.forEach(col => {
    const v = valByField(row, col)
    const n = Number(v)
    vars[col.slug || col.name || col.id] = Number.isFinite(n) ? n : (looksNumericString(v) ? Number(v) : 0)
  })
  return evalFormula(f.formula, vars)
}

/**** ---------------------------------------------------- 自訂欄位 / 數值欄位 ---------------------------------------------------- ****/
const customColumns = ref([])      // [{ id, name, slug, type, order, formula }]
const platform = ref(null)

/* 優先使用後端宣告 type==='number' / 'formula' 的欄；否則動態從資料推斷「數值欄」。 */
const adData = ref([])         // 先宣告，供 numericColumns / watch 使用
const numericColumns = computed(() => {
  const declared = customColumns.value.filter(f => f.type === 'number' || f.type === 'formula')
  if (declared.length) return declared

  const counts = new Map()
  adData.value.forEach(row => {
    const ed = row?.extraData || row || {}
    Object.keys(ed).forEach(id => {
      const v = ed[id]
      const ok = isStrictNumber(v) || looksNumericString(v)
      if (ok) counts.set(id, (counts.get(id) || 0) + 1)
    })
  })
  const threshold = Math.max(1, Math.floor(adData.value.length * 0.5)) // 過半
  const ids = [...counts.entries()].filter(([, c]) => c >= threshold).map(([id]) => id)

  return ids.map(id =>
    customColumns.value.find(f => f.id === id) ||
    { id, slug: id, name: id, type: 'number', order: 999 }
  )
})

/**** ---------------------------------------------------- 公式欄位（寫表單時自動回填） ---------------------------------------------------- ****/
const formulaFields = computed(() => customColumns.value.filter(f => f.type === 'formula'))
const recordForm = ref({ date: '', extraData: {}, colors: {} }) // 用於新增/編輯
const recalcFormulas = () => {
  const vars = {}
  customColumns.value.forEach(f => { vars[f.slug] = recordForm.value.extraData[f.id] })
  formulaFields.value.forEach(f => {
    const val = evalFormula(f.formula, vars)
    recordForm.value.extraData[f.id] = val
    vars[f.slug] = val
  })
}
const nonFormulaData = computed(() => {
  const obj = {}
  customColumns.value.filter(f => f.type !== 'formula').forEach(f => { obj[f.id] = recordForm.value.extraData[f.id] })
  return obj
})
watch(nonFormulaData, recalcFormulas)

/**** ---------------------------------------------------- 排序 / 篩選 ---------------------------------------------------- ****/
const sortField = ref('')
const sortOrder = ref(1)
const sortOptions = computed(() => {
  const hasExtra = adData.value.some(r => r && typeof r === 'object' && 'extraData' in r)
  const prefix = hasExtra ? 'extraData.' : ''
  return [
    { label: '日期', value: 'date' },
    ...customColumns.value.map(f => ({ label: f.name, value: prefix + f.id }))
  ]
})
const toggleOrder = () => { sortOrder.value = sortOrder.value === 1 ? -1 : 1 }

const startDate = ref('')
const endDate = ref('')

/**** ---------------------------------------------------- 週備註 ---------------------------------------------------- ****/
const weeklyNotes = ref({})       // { '2025-26': { week, text, images } }

/**** ---------------------------------------------------- ISO 週工具 ---------------------------------------------------- ****/
const toWeekKey = (date) => {
  const d = dayjs(date)
  const week = String(d.isoWeek()).padStart(2, '0')
  const isoYear = d.startOf('isoWeek').year() // 該週的週一所屬年
  return `${isoYear}-${week}`
}
const formatWeekRange = (w) => {
  const m = String(w).match(/^(\d{4})-W?(\d{1,2})$/)
  if (!m) return ''
  const [, y, wkStr] = m
  const wk = Number(wkStr)
  const firstWeekStart = dayjs(`${y}-01-04`).startOf('isoWeek') // ISO 年第一週週一
  const start = firstWeekStart.add(wk - 1, 'week')
  const end = start.endOf('isoWeek')
  return `${start.format('YYYY/MM/DD')} - ${end.format('YYYY/MM/DD')}`
}

/**** ---------------------------------------------------- 週彙總（完全動態） ---------------------------------------------------- ****/
const weeklyAgg = computed(() => {
  const map = {}

  adData.value.forEach(d => {
    const week = toWeekKey(d.date)
    if (!map[week]) {
      map[week] = { week }
      numericColumns.value.forEach(f => { map[week][keyOf(f)] = 0 })
    }
    numericColumns.value.forEach(f => {
      const raw = f.type === 'formula' ? valByFieldWithFormula(d, f) : valByField(d, f)
      const num = isStrictNumber(raw) ? raw : (looksNumericString(raw) ? Number(raw) : 0)
      map[week][keyOf(f)] += Number.isFinite(num) ? num : 0
    })
  })

  // 合併備註 / 圖片
  Object.keys(map).forEach(w => {
    const note = weeklyNotes.value[w]
    map[w].note = note?.text || ''
    map[w].hasNote = !!(note && note.text)
    map[w].hasImage = !!(note && note.images && note.images.length)
    map[w].images = note?.images || []
  })

  // 只有備註沒有每日數據，也要產一筆
  Object.keys(weeklyNotes.value).forEach(w => {
    if (!map[w]) {
      const note = weeklyNotes.value[w]
      map[w] = { week: w }
      numericColumns.value.forEach(f => { map[w][keyOf(f)] = 0 })
      map[w].note = note?.text || ''
      map[w].hasNote = !!(note && note.text)
      map[w].hasImage = !!(note && note.images && note.images.length)
      map[w].images = note?.images || []
    }
  })

  // 小數二位
  const arr = Object.values(map)
  arr.forEach(weekRow => {
    numericColumns.value.forEach(f => {
      const k = keyOf(f)
      if (typeof weekRow[k] === 'number') weekRow[k] = Number(weekRow[k].toFixed(2))
    })
  })
  return arr.sort((a, b) => a.week.localeCompare(b.week))
})

/**** ---------------------------------------------------- 折線圖 ---------------------------------------------------- ****/
const yMetric = ref('')     // 使用者選的欄位 key（由 keyOf 產生）
let chartCtx = null
let chart = null

const drawChart = () => {
  if (!chartCtx) chartCtx = document.getElementById('weekly-chart')
  if (!chartCtx || !yMetric.value) return
  const labels = weeklyAgg.value.map(r => formatWeekRange(r.week))
  const dataKey = yMetric.value
  const data = weeklyAgg.value.map(r => r[dataKey] ?? 0)
  const metric = numericColumns.value.find(f => keyOf(f) === dataKey)
  chart && chart.destroy()
  chart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: labelOf(metric) || dataKey,
        data,
        borderColor: '#409EFF',
        tension: 0.35
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })
}

/**** ---------------------------------------------------- Excel 說明 / 格式化 / 範例下載 ---------------------------------------------------- ****/
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
          : f.type === 'formula' ? '公式(自動計算)'
            : '文字',
      sample: f.type === 'date' ? dayjs().format('YYYY-MM-DD') : ''
    }))
  )
})

const dateFmt = row => dayjs(row.date).format('YYYY-MM-DD')
const formatExtraDate = val => (val ? dayjs(val).format('YYYY-MM-DD') : '')
const formatNumber = val => {
  if (typeof val === 'number' && Number.isFinite(val)) return Number.isInteger(val) ? String(val) : val.toFixed(2)
  if (typeof val === 'string' && /^-?\d+(\.\d+)?$/.test(val.trim())) {
    const n = Number(val); return Number.isInteger(n) ? String(n) : n.toFixed(2)
  }
  return String(val ?? '')
}

const downloadTemplate = () => {
  const headers = ['日期', ...customColumns.value.map(c => c.name), ...customColumns.value.map(c => `color_${c.name}`)]
  const sample = {
    日期: dayjs().format('YYYY-MM-DD')
  }
  customColumns.value.forEach(c => {
    sample[c.name] = c.type === 'date' ? dayjs().format('YYYY-MM-DD') : (c.type === 'number' ? 0 : '')
    sample[`color_${c.name}`] = ''
  })
  const csv = '\uFEFF' + Papa.unparse([sample], { columns: headers })
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'ad_daily_template.csv')
}

/**** ---------------------------------------------------- 筆記轉 HTML ---------------------------------------------------- ****/
const escapeHtml = str =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
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
  const items = lines.map(l => l.replace(itemRE, '')).map(l => `<li>${escapeHtml(l)}</li>`).join('')
  return `<${tag}>${items}</${tag}>`
}

/**** ---------------------------------------------------- 載入資料 ---------------------------------------------------- ****/
const isSafeSlug = (s) => typeof s === 'string' && /^[a-z][a-z0-9_]{2,}$/.test(s)

const loadPlatform = async () => {
  
  platform.value = await getPlatform(clientId, platformId)
  customColumns.value = (platform.value?.fields || [])
    .map(f =>
      typeof f === 'string'
        ? { id: slugify(f), name: f, slug: slugify(f), type: 'text', order: 0 }
        : {
          id: f.id || slugify(f.name),
          name: f.name,
          slug: isSafeSlug(f.slug) ? f.slug : null,
          type: f.type || 'text',
          order: f.order || 0,
          formula: f.formula || ''
        }
    )
    .sort((a, b) => a.order - b.order)
}

const loadDaily = async () => {
  loading.value = true
  const params = {}
  if (startDate.value) params.start = dayjs(startDate.value).format('YYYY-MM-DD')
  if (endDate.value) params.end = dayjs(endDate.value).format('YYYY-MM-DD')
  if (sortField.value) {
    params.sort = sortField.value
    params.order = sortOrder.value === 1 ? 'asc' : 'desc'
  }
  try {
    const list = await fetchDaily(clientId, platformId, params)
    let data = []
    if (Array.isArray(list)) data = list
    else if (Array.isArray(list?.data)) data = list.data
    else if (Array.isArray(list?.records)) data = list.records
    else if (list && typeof list === 'object') {
      const keys = Object.keys(list).filter(k => Array.isArray(list[k]))
      if (keys.length) {
        const maxLen = Math.max(...keys.map(k => list[k].length))
        data = Array.from({ length: maxLen }, (_, i) => {
          const row = {}
          keys.forEach(k => { row[k] = list[k][i] })
          return row
        })
      }
    }
    adData.value = data
  } catch (err) {
    adData.value = []
    console.error('取得每日資料失敗', err)
    toast.add({ severity: 'error', summary: '錯誤', detail: err?.message || '取得每日資料失敗', life: 3000 })
  } finally {
    loading.value = false
  }
}

const loadWeeklyNotes = async () => {
  const list = await fetchWeeklyNotes(clientId, platformId)
  weeklyNotes.value = list.reduce((acc, n) => { acc[n.week] = n; return acc }, {})
}

/**** ---------------------------------------------------- 自動/手動映射：以第一筆樣本匹配，並可一口氣寫回 ---------------------------------------------------- ****/
const mapDialogVisible = ref(false)
const mapRows = ref([])           // [{ oldKey, sample, mappedId }]
const applying = ref(false)
const progress = ref({ total: 0, done: 0 })

function getUnknownOldKeysFromRow(row) {
  const ed = row?.extraData || {}
  const knownNewIds = new Set(customColumns.value.map(f => f.id))
  const unknown = []
  Object.keys(ed).forEach(k => {
    const alreadyMapped = Object.prototype.hasOwnProperty.call(fieldAliases.value || {}, k)
    if (!knownNewIds.has(k) && !alreadyMapped) {
      unknown.push({ oldKey: k, sample: ed[k] })
    }
  })
  return unknown
}

function openRemapDialogForRow(row) {
  const ed = row?.extraData || {}
  const idSet = new Set(customColumns.value.map(f => f.id))
  const slugSet = new Set(customColumns.value.map(f => f.slug).filter(Boolean))
  const allowed = new Set([...idSet, ...slugSet])

  const oldKeysOnly = Object.keys(ed).filter(k => !allowed.has(k))
  if (!oldKeysOnly.length) {
    toast.add({ severity: 'info', summary: '提示', detail: '這筆資料沒有需要匹配的舊鍵', life: 2200 })
    return
  }
  mapRows.value = oldKeysOnly.map(oldKey => ({
    oldKey,
    sample: ed[oldKey],
    mappedId: (fieldAliases.value || {})[oldKey] || ''
  }))
  mapDialogVisible.value = true
}


function openMappingDialogFromFirstRow() {
  if (!adData.value.length) return
  const first = adData.value[0]
  const unknown = getUnknownOldKeysFromRow(first)
  if (!unknown.length) {
    toast.add({ severity: 'info', summary: '提示', detail: '目前無需字段匹配', life: 2200 })
    return
  }
  mapRows.value = unknown.map(u => ({ oldKey: u.oldKey, sample: u.sample, mappedId: '' }))
  mapDialogVisible.value = true
}

async function saveMappingFromFirstRow(writeBackAll = true) {
  const alias = {}
  for (const r of mapRows.value) if (r.oldKey && r.mappedId) alias[r.oldKey] = r.mappedId
  if (!Object.keys(alias).length) {
    toast.add({ severity: 'warn', summary: '提醒', detail: '請至少設定 1 條映射', life: 2200 })
    return
  }

  fieldAliases.value = { ...(fieldAliases.value || {}), ...alias }
  saveAliases()
  if (!writeBackAll) { mapDialogVisible.value = false; toast.add({ severity:'success', summary:'已保存', detail:'映射已生效（未寫回後端）', life:2200 }); return }

  const colById = new Map(customColumns.value.map(c => [c.id, c]))
  const allowedSet = new Set([
    ...customColumns.value.map(c => c.id),
    ...customColumns.value.map(c => c.slug).filter(isSafeSlug) // 只接受安全 slug
  ])
  const aliasOldKeys = new Set(Object.keys(alias))

  applying.value = true
  try {
    const need = adData.value.filter(r => Object.keys(alias).some(k => k in (r?.extraData || {})))
    progress.value = { total: need.length, done: 0 }

    for (const row of need) {
      const ed = { ...(row.extraData || {}) }
      const cs = { ...(row.colors || {}) }
      let touched = false

      // 映射：覆蓋新 id；slug 只有在安全時才雙寫；刪除舊鍵
      for (const [oldKey, newId] of Object.entries(alias)) {
        if (!(oldKey in ed) && !(oldKey in cs)) continue
        const col  = colById.get(newId) || {}
        const slug = isSafeSlug(col.slug) ? col.slug : null

        if (oldKey in ed) {
          const v = ed[oldKey]
          ed[newId] = v
          if (slug) ed[slug] = v
          delete ed[oldKey]
          touched = true
        }
        if (oldKey in cs) {
          const c = cs[oldKey]
          cs[newId] = c
          if (slug) cs[slug] = c
          delete cs[oldKey]
          touched = true
        }
      }

      // 清理：刪掉所有“不是 id/安全 slug、也不是本次處理的舊鍵”的殘留（例如 "_"）
      for (const k of Object.keys(ed)) {
        if (!allowedSet.has(k) && !aliasOldKeys.has(k)) { delete ed[k]; touched = true }
      }
      for (const k of Object.keys(cs)) {
        if (!allowedSet.has(k) && !aliasOldKeys.has(k)) { delete cs[k]; touched = true }
      }

      if (touched) {
        try {
          await updateDaily(clientId, platformId, row._id, { date: row.date, extraData: ed, colors: cs })
        } catch (err) { console.error('更新失敗：', row._id, err) }
      }
      progress.value.done += 1
    }

    toast.add({ severity:'success', summary:'完成', detail:'映射已批量寫回（僅安全 slug 雙寫，並清除 "_" 等非法鍵）', life:3000 })
    mapDialogVisible.value = false
    await loadDaily()
  } finally { applying.value = false }
}
  // 1) 收集映射
  const alias = {}
  for (const r of mapRows.value) {
    if (r.oldKey && r.mappedId) alias[r.oldKey] = r.mappedId
  }
  if (!Object.keys(alias).length) {
    toast.add({ severity: 'warn', summary: '提醒', detail: '請至少設定 1 條映射', life: 2200 })
    return
  }

  // 2) 本地 alias 立即生效（只為了當前畫面即時取值）
  fieldAliases.value = { ...(fieldAliases.value || {}), ...alias }
  saveAliases()

  if (!writeBackAll) {
    mapDialogVisible.value = false
    toast.add({ severity: 'success', summary: '已保存', detail: '映射已生效（未寫回後端）', life: 2200 })
    return
  }

  // 3) 準備：id -> 欄位，與“允許鍵集合”（所有 id + slug）
  const colById = new Map(customColumns.value.map(c => [c.id, c]))
  const allowedSet = new Set([
    ...customColumns.value.map(c => c.id),
    ...customColumns.value.map(c => c.slug).filter(Boolean)
  ])
  const aliasOldKeys = new Set(Object.keys(alias)) // 本次已處理的舊鍵

  // 4) 批量寫回：舊鍵 → 新 id（並雙寫 slug），且「清理無關舊鍵」
  applying.value = true
  try {
    const need = adData.value.filter(r => {
      const ed = r?.extraData || {}
      return Object.keys(alias).some(oldKey => oldKey in ed)
    })
    progress.value = { total: need.length, done: 0 }

    for (const row of need) {
      const ed = { ...(row.extraData || {}) }
      const cs = { ...(row.colors || {}) }
      let touched = false

      // 4.1 先做映射：總是覆蓋新 id，並雙寫 slug；然後刪除舊鍵
      for (const [oldKey, newId] of Object.entries(alias)) {
        if (!(oldKey in ed) && !(oldKey in cs)) continue

        const col = colById.get(newId) || {}
        const slug = col.slug || null

        if (oldKey in ed) {
          const v = ed[oldKey]
          ed[newId] = v                 // 寫入新 id
          if (slug) ed[slug] = v        // 同步寫入穩定 slug
          delete ed[oldKey]             // 移除舊鍵
          touched = true
        }
        if (oldKey in cs) {
          const c = cs[oldKey]
          cs[newId] = c
          if (slug) cs[slug] = c
          delete cs[oldKey]
          touched = true
        }
      }

      // 4.2 清理：移除任何“既不是新 id/slug、也不是本次待映射”的殘留鍵（防止越改越多）
      for (const k of Object.keys(ed)) {
        if (!allowedSet.has(k) && !aliasOldKeys.has(k)) {
          delete ed[k]
          touched = true
        }
      }
      for (const k of Object.keys(cs)) {
        if (!allowedSet.has(k) && !aliasOldKeys.has(k)) {
          delete cs[k]
          touched = true
        }
      }

      if (touched) {
        try {
          await updateDaily(clientId, platformId, row._id, {
            date: row.date,
            extraData: ed,
            colors: cs
          })
        } catch (err) {
          console.error('更新失敗：', row._id, err)
        }
      }
      progress.value.done += 1
    }

    toast.add({ severity: 'success', summary: '完成', detail: '映射已保存並批量寫回（雙寫 id/slug + 清理舊鍵）', life: 3000 })
    mapDialogVisible.value = false
    await loadDaily()
  } finally {
    applying.value = false
  }
}



/* 先嘗試自動；若第一筆樣本仍有未知舊鍵，就彈窗（只需匹配一次） */
function bootMappingFromFirstRow() {
  if (Object.keys(fieldAliases.value || {}).length) return
  autoBuildAliasesIfNeeded()
  if (adData.value.length) {
    const unknown = getUnknownOldKeysFromRow(adData.value[0])
    if (unknown.length) {
      toast.add({ severity: 'warn', summary: '需要字段匹配', detail: '首次載入偵測到舊鍵無法自動對應，請完成映射', life: 3000 })
      openMappingDialogFromFirstRow()
    }
  }
}

/**** ---------------------------------------------------- 自動建立「舊ID -> 新ID」映射（盡力而為） ---------------------------------------------------- ****/
function autoBuildAliasesIfNeeded() {
  if (Object.keys(fieldAliases.value).length) return // 已有映射就不動
  const knownNewIds = new Set(customColumns.value.map(f => f.id))
  const unknownCounts = {}
  adData.value.forEach(r => {
    Object.keys(r?.extraData || {}).forEach(k => {
      if (!knownNewIds.has(k)) unknownCounts[k] = (unknownCounts[k] || 0) + 1
    })
  })
  const unknownKeys = Object.keys(unknownCounts)
  if (!unknownKeys.length) return

  const fields = [...customColumns.value]
  if (!fields.length) {
    console.warn('[AdData] 偵測到舊欄位鍵，但無可供對應的新欄位：', { unknownKeys })
    return
  }

  unknownKeys.sort()
  let alias = {}

  if (unknownKeys.length === fields.length) {
    const sortedFields = fields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    unknownKeys.forEach((oldKey, i) => { alias[oldKey] = sortedFields[i].id })
  } else {
    const nameMap = new Map(fields.map(f => [f.name, f.id]))
    unknownKeys.forEach(k => {
      if (nameMap.has(k)) alias[k] = nameMap.get(k)
    })
    const remainingKeys = unknownKeys.filter(k => !(k in alias))
    const usedIds = new Set(Object.values(alias))
    const remainingFields = fields.filter(f => !usedIds.has(f.id)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    remainingKeys.forEach((oldKey, i) => {
      if (remainingFields[i]) alias[oldKey] = remainingFields[i].id
    })
    if (Object.keys(alias).length !== unknownKeys.length) {
      console.warn('[AdData] 自動對應不完整：', { unknownKeys, mapped: alias })
      return
    }
  }

  fieldAliases.value = alias
  saveAliases()
  console.info('[AdData] 已自動建立舊→新欄位對應：', alias)
}

/**** ---------------------------------------------------- 監聽重新載入 / 繪圖 ---------------------------------------------------- ****/
watch([sortField, sortOrder], () => { loadDaily() })
watch([startDate, endDate], loadDaily)
watch([weeklyAgg, yMetric], () => { if (activeTab.value === 'weekly') drawChart() })
watch(numericColumns, (cols) => {
  if (!cols.length) {
    yMetric.value = ''
    if (chart) { chart.destroy(); chart = null }
    return
  }
  if (!cols.find(c => keyOf(c) === yMetric.value)) yMetric.value = keyOf(cols[0])
})
watch(activeTab, tab => { if (tab === 'weekly') drawChart() })

/**** ---------------------------------------------------- 生命週期 ---------------------------------------------------- ****/
const colorOptions = [
  { label: '淺青', value: '#CCF2F4' },
  { label: '淺黃', value: '#FFF9C4' },
  { label: '淺紅', value: '#FFCDD2' }
]

onMounted(async () => {
  loading.value = true
  await loadPlatform()

  // 先讀本地別名（若有）
  loadAliases()

  // 初始化表單模型
  customColumns.value.forEach(f => {
    recordForm.value.extraData[f.id] = ''
    recordForm.value.colors[f.id] = ''
  })
  recalcFormulas()

  await loadDaily()
  await loadWeeklyNotes()

  // 首次：嘗試自動；仍有未知舊鍵則以第一筆樣本彈窗，完成後可「一口氣」寫回全部
  bootMappingFromFirstRow()

  loading.value = false

  // 調試資訊
  console.log('[customColumns]', customColumns.value.map(f => ({ id: f.id, name: f.name, type: f.type })))
  console.log('[sample row]', adData.value[0])
})

/**** ---------------------------------------------------- CRUD：每日 ---------------------------------------------------- ****/
const openCreateDialog = () => {
  editing.value = false
  editingId.value = ''
  recordForm.value.date = ''
  customColumns.value.forEach(f => {
    recordForm.value.extraData[f.id] = ''
    recordForm.value.colors[f.id] = ''
  })
  recalcFormulas()
  dialogVisible.value = true
}

const handleConfirm = async () => {
  if (!recordForm.value.date) {
    toast.add({ severity: 'warn', summary: '警告', detail: '請選擇日期', life: 3000 })
    return
  }
  try {
    if (editing.value) {
      await updateDaily(clientId, platformId, editingId.value, { ...recordForm.value })
      toast.add({ severity: 'success', summary: '成功', detail: '已更新記錄', life: 3000 })
    } else {
      await createDaily(clientId, platformId, { ...recordForm.value })
      toast.add({ severity: 'success', summary: '成功', detail: '已新增記錄', life: 3000 })
    }
    dialogVisible.value = false
    await loadDaily()
  } catch (err) {
    toast.add({ severity: 'error', summary: '錯誤', detail: err?.message || (editing.value ? '更新失敗' : '新增失敗'), life: 3000 })
  }
}

const openEdit = row => {
  editing.value = true
  editingId.value = row._id
  recordForm.value.date = row.date
  recordForm.value.extraData = { ...row.extraData }
  recordForm.value.colors = { ...row.colors }
  recalcFormulas()
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

/**** ---------------------------------------------------- 匯入 ---------------------------------------------------- ****/
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
    toast.add({ severity: 'error', summary: '錯誤', detail: err?.message || '匯入失敗', life: 3000 })
  }
  return false
}

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
  Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => res(normalize(r.data)), error: rej })
})
const sanitizeNumber = val => parseFloat(String(val).replace(/[^\d.]/g, '')) || 0
const normalize = arr => {
  return arr.map(r => {
    const extraData = {}
    const colors = {}
    customColumns.value.forEach(col => {
      const val = r[col.name] ?? ''
      if (col.type === 'number') extraData[col.id] = sanitizeNumber(val)
      else extraData[col.id] = val
      if (r[`color_${col.name}`]) colors[col.id] = r[`color_${col.name}`]
    })
    const obj = { date: r['日期'] || r.date || '', extraData }
    if (Object.keys(colors).length) obj.colors = colors
    return obj
  }).filter(r => r.date)
}

/**** ---------------------------------------------------- 匯出 ---------------------------------------------------- ****/
const exportDaily = () => {
  if (!adData.value.length) {
    toast.add({ severity: 'warn', summary: '警告', detail: '無資料可匯出', life: 3000 })
    return
  }
  const rows = adData.value.map(r => {
    const row = { 日期: dateFmt(r) }
    customColumns.value.forEach(col => {
      const val = col.type === 'formula' ? valByFieldWithFormula(r, col) : valByField(r, col)
      row[col.name] = col.type === 'date' ? formatExtraDate(val) : (val ?? '')
      const color = colorByField(r, col)
      if (color) row[`color_${col.name}`] = color
    })
    return row
  })
  const csv = '\uFEFF' + Papa.unparse(rows)
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'daily.csv')
}

async function exportWeekly() {
  if (!weeklyAgg.value.length) {
    toast.add({ severity: 'warn', summary: '警告', detail: '無資料可匯出', life: 3000 })
    return
  }
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('weekly')

  const headers = ['日期', ...numericColumns.value.map(f => labelOf(f)), '筆記', '圖片']
  ws.addRow(headers)
  ws.getRow(1).font = { bold: true }

  for (const row of weeklyAgg.value) {
    const data = [
      formatWeekRange(row.week),
      ...numericColumns.value.map(c => row[keyOf(c)] || 0),
      row.note || '',
      ''
    ]
    const wsRow = ws.addRow(data)

    if (row.hasImage && row.images[0]) {
      try {
        const firstImg = row.images[0]
        const imgPath = typeof firstImg === 'string' ? firstImg : firstImg.path
        const signedUrl = await getWeeklyNoteImageUrl(clientId, platformId, imgPath)
        const res = await fetch(signedUrl)
        const buf = await res.arrayBuffer()
        const ext = imgPath.split('.').pop().replace('jpg', 'jpeg')   // exceljs 需 jpeg / png
        const imgId = wb.addImage({ buffer: buf, extension: ext })
        const rIdx = wsRow.number - 1
        const cIdx = headers.length - 1
        ws.addImage(imgId, { tl: { col: cIdx, row: rIdx }, ext: { width: 80, height: 80 } })
        wsRow.height = 60
        ws.getColumn(cIdx + 1).width = 15
      } catch { /* 圖片失敗就跳過 */ }
    }
  }

  const buf = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }), 'weekly.xlsx')
}

/**** ---------------------------------------------------- 週備註（圖片預覽/上傳） ---------------------------------------------------- ****/
const noteForm = ref({ week: '', text: '', images: [] })
const keepImages = ref([])

const onImageSelect = e => {
  e.files.forEach(f => { if (!f.objectURL) f.objectURL = URL.createObjectURL(f) })
  noteForm.value.images = [...e.files] // 觸發 reactivity
}
const onImageRemove = e => {
  noteForm.value.images = [...e.files]
  const removed = e.originalEvent?.files || []
  removed.forEach(file => {
    if (file.path) keepImages.value = keepImages.value.filter(p => p !== file.path)
  })
}

const openNote = async row => {
  const week = row.week
  let note = null
  try { note = await fetchWeeklyNote(clientId, platformId, week) } catch { /* ignore */ }
  if (note) weeklyNotes.value[week] = note
  let images = []
  if (note?.images && note.images.length) {
    const promises = note.images.map(async p => {
      try {
        const url = await getWeeklyNoteImageUrl(clientId, platformId, p)
        return { name: p, objectURL: url, path: p }
      } catch { return null }
    })
    images = (await Promise.all(promises)).filter(Boolean)
  }
  noteForm.value = { week, text: note?.text || '', images }
  keepImages.value = images.map(i => i.path)
  noteDialog.value = true
}

const saveNote = async () => {
  const { week, text, images } = noteForm.value
  const newImages = images.filter(i => !i.path) // 新增的 File
  let note
  try {
    note = await updateWeeklyNote(clientId, platformId, week, { text, images: newImages, keepImages: keepImages.value })
  } catch (err) {
    note = await createWeeklyNote(clientId, platformId, { week, text, images: newImages })
  }
  weeklyNotes.value[week] = note
  toast.add({ severity: 'success', summary: '成功', detail: '已儲存備註', life: 3000 })
  noteDialog.value = false
}

const previewImages = async imgs => {
  if (!imgs || !imgs.length) return
  if (imgs[0].url) imgList.value = imgs.map(i => i.url)
  else {
    const urls = await Promise.all(imgs.map(p => getWeeklyNoteImageUrl(clientId, platformId, p)))
    imgList.value = urls
  }
  imgPreviewDialog.value = true
}
</script>

<style scoped>
.sticky-table-wrapper {
  max-height: 70vh;
  overflow-y: auto;
}

.sticky-table-wrapper :deep(.p-datatable-thead > tr > th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
}

/* 自行視覺調整 */
:deep(.p-datatable td) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
</style>
