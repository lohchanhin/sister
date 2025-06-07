<!-- ProgressTracker.vue – 全檔 -->
<script setup>
/* ---------------- imports ---------------- */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchTemplates, createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  fetchRecords, createRecord as apiCreateRecord
} from '../services/progress'
import { Check, Close, Edit, Delete } from '@element-plus/icons-vue'

/* ---------------- State ---------------- */
const templates = ref([])
const selectedTplId = ref('')
const records = ref([])
const drawerVis = ref(false)

/* 編輯模式 */
const editingTplId = ref('')
const editingName = ref('')

/* 建立模板表單 */
const tplForm = ref({
  name: '',
  fields: [{ fieldName: '', fieldType: 'string' }]
})

/* 新增紀錄列 */
const newRow = ref({ fieldValues: {} })

/* 下拉選單暫存結構（未接 API 亦可建模板） */
const selectOptions = ref({})   // { fieldName: [{label,value}] }
const optionApis = []        // Drawer「資料來源 API」選項

/* 目前選定模板 */
const selectedTpl = computed(() =>
  templates.value.find(t => t._id === selectedTplId.value)
)

/* ---------------- Methods ---------------- */
const loadTemplates = async () => { templates.value = await fetchTemplates() }

const selectTemplate = async id => {
  selectedTplId.value = id
  records.value = await fetchRecords(id)
  newRow.value = { fieldValues: {} }
}

const addRecord = async () => {
  if (!selectedTpl.value) return
  await apiCreateRecord({
    templateId: selectedTplId.value,
    fieldValues: newRow.value.fieldValues
  })
  ElMessage.success('已新增資料')
  await selectTemplate(selectedTplId.value)
}

/* ---- 模板 CRUD ---- */
const openDrawer = () => (drawerVis.value = true)
const addTplField = () => tplForm.value.fields.push({ fieldName: '', fieldType: 'string' })
const removeTplField = idx => tplForm.value.fields.splice(idx, 1)

const createTemplate = async () => {
  const tpl = await apiCreateTemplate(tplForm.value)
  templates.value.push(tpl)
  drawerVis.value = false
  tplForm.value = { name: '', fields: [{ fieldName: '', fieldType: 'string' }] }
  ElMessage.success('已建立模板')
}

/* 進入／退出編輯 */
const startEditTpl = tpl => { editingTplId.value = tpl._id; editingName.value = tpl.name }
const cancelEdit = () => { editingTplId.value = '' }

const saveTplName = async tpl => {
  if (!editingName.value.trim()) return
  await apiUpdateTemplate(tpl._id, { name: editingName.value.trim() })
  tpl.name = editingName.value.trim()
  editingTplId.value = ''
  ElMessage.success('名稱已更新')
}

const removeTpl = async tpl => {
  await ElMessageBox.confirm(`確定要刪除「${tpl.name}」模板？`, '提示', {
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await apiDeleteTemplate(tpl._id)
  templates.value = templates.value.filter(t => t._id !== tpl._id)
  if (selectedTplId.value === tpl._id) {
    selectedTplId.value = ''
    records.value = []
  }
  ElMessage.success('已刪除模板')
}

/* ---------------- life cycle ---------------- */
onMounted(loadTemplates)
</script>

<template>
  <section class="tracker flex h-screen overflow-hidden bg-white text-gray-800">

    <!-- ========== 左側模板清單 ========== -->
    <aside class="w-60 border-r border-gray-200 p-4 overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">追蹤模板</h2>
        <el-button circle type="primary" size="small" @click="openDrawer">＋</el-button>
      </div>

      <ul class="space-y-1">
        <li v-for="tpl in templates" :key="tpl._id" :class="[
          'flex items-center gap-1 px-2 py-1 rounded select-none',
          selectedTplId === tpl._id ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'
        ]">
          <!-- === 編輯狀態 === -->
          <template v-if="editingTplId === tpl._id">
            <el-input v-model="editingName" size="small" class="flex-1" @keyup.enter="saveTplName(tpl)" />
            <el-button :icon="Check" circle size="small" type="success" @click="saveTplName(tpl)" />
            <el-button :icon="Close" circle size="small" @click="cancelEdit" />
          </template>

          <!-- === 顯示狀態 === -->
          <template v-else>
            <span class="flex-1 truncate cursor-pointer" @click="selectTemplate(tpl._id)">
              {{ tpl.name }}
            </span>
            <el-button :icon="Edit" circle size="small" @click.stop="startEditTpl(tpl)" />
            <el-button :icon="Delete" circle size="small" type="danger" @click.stop="removeTpl(tpl)" />
          </template>
        </li>
      </ul>

      <p v-if="!templates.length" class="text-gray-400 text-sm mt-4">
        尚未建立模板，請點右上「＋」新增。
      </p>
    </aside>

    <!-- ========== 右側工作表 ========== -->
    <main class="flex-1 p-6 overflow-auto">
      <!-- 未選模板提示 -->
      <p v-if="!selectedTpl" class="text-gray-500">請先選擇模板。</p>

      <!-- ===== 已選模板內容 ===== -->
      <div v-else>
        <h1 class="text-2xl font-bold mb-6">{{ selectedTpl.name }} – 工作表</h1>

        <!-- ---- 新增資料列 ---- -->
        <el-card class="mb-6" shadow="never" :body-style="{ padding: '8px' }">
          <div class="grid gap-2 items-center"
            :style="`grid-template-columns: 160px repeat(${selectedTpl.fields.length},1fr)`">
            <div class="px-3 py-2 font-medium text-right">新增資料：</div>

            <template v-for="f in selectedTpl.fields" :key="f.fieldName">
              <!-- 文字 -->
              <el-input v-if="f.fieldType === 'string'" v-model="newRow.fieldValues[f.fieldName]"
                :placeholder="f.fieldName" />
              <!-- 數字 -->
              <el-input-number v-else-if="f.fieldType === 'number'" v-model="newRow.fieldValues[f.fieldName]"
                :placeholder="f.fieldName" style="width:100%" />
              <!-- 日期 -->
              <el-date-picker v-else-if="f.fieldType === 'date'" v-model="newRow.fieldValues[f.fieldName]" type="date"
                :placeholder="f.fieldName" style="width:100%" />
              <!-- 下拉 -->
              <el-select v-else-if="f.fieldType === 'select'" v-model="newRow.fieldValues[f.fieldName]"
                :placeholder="f.fieldName" style="width:100%">
                <el-option v-for="opt in selectOptions[f.fieldName] || []" :key="opt.value" :label="opt.label"
                  :value="opt.value" />
              </el-select>
            </template>

            <div class="col-span-full text-right mt-2">
              <el-button type="success" size="small" @click="addRecord">儲存</el-button>
            </div>
          </div>
        </el-card>

        <!-- ---- 紀錄表格 ---- -->
        <el-card shadow="never">
          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left border-b">#</th>
                  <th v-for="f in selectedTpl.fields" :key="f.fieldName" class="px-3 py-2 text-left border-b">{{
                    f.fieldName
                    }}</th>
                  <th class="px-3 py-2 text-left border-b">建立時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in records" :key="row._id" :class="i % 2 ? 'bg-gray-50' : 'bg-white'">
                  <td class="px-3 py-2 border-b">{{ i + 1 }}</td>
                  <td v-for="f in selectedTpl.fields" :key="f.fieldName" class="px-3 py-2 border-b">
                    <template v-if="f.fieldType === 'select'">
                      {{
                        (selectOptions[f.fieldName] || []).find(o => o.value === row.fieldValues[f.fieldName])?.label
                        || row.fieldValues[f.fieldName]
                      }}
                    </template>
                    <template v-else>
                      {{ row.fieldValues[f.fieldName] }}
                    </template>
                  </td>
                  <td class="px-3 py-2 border-b">
                    {{ new Date(row.createdAt).toLocaleString() }}
                  </td>
                </tr>

                <tr v-if="!records.length">
                  <td :colspan="selectedTpl.fields.length + 2" class="py-6 text-center text-gray-400">
                    尚未新增任何資料
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </div>
    </main>
  </section>

  <!-- ========== Drawer：建立模板 ========== -->
  <el-drawer v-model="drawerVis" title="建立新模板" size="360px">
    <el-form label-position="top" class="space-y-4" @submit.prevent>
      <el-form-item label="模板名稱">
        <el-input v-model="tplForm.name" placeholder="請輸入模板名稱" />
      </el-form-item>

      <el-form-item label="欄位設定">
        <div>
          <div v-for="(field, idx) in tplForm.fields" :key="idx" class="flex items-start gap-2 mb-3">
            <el-input v-model="field.fieldName" placeholder="欄位名稱" class="flex-1" />

            <el-select v-model="field.fieldType" placeholder="類型" style="width:100px">
              <el-option label="文字" value="string" />
              <el-option label="數字" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="下拉" value="select" />
            </el-select>

            <el-select v-if="field.fieldType === 'select'" v-model="field.optionsApi" placeholder="資料來源 API"
              style="width:140px">
              <el-option v-for="api in optionApis" :key="api.value" :label="api.label" :value="api.value" />
            </el-select>

            <el-button :icon="Delete" circle type="danger" size="small" @click="removeTplField(idx)" />
          </div>

          <el-button type="primary" plain size="small" @click="addTplField">＋ 新增欄位</el-button>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="success" @click="createTemplate">建立模板</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<style scoped>
/* 進出動畫 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all .2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
wd