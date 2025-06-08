<script setup>
/* ───── imports ───── */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchTemplates, createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate,
  fetchRecords, createRecord as apiCreateRecord,
  updateRecord as apiUpdateRecord
} from '../services/progress'
import { fetchUsers } from '../services/user'
import { Check, Close, Edit, Delete, EditPen } from '@element-plus/icons-vue'

/* ───── state ───── */
const templates = ref([])
const selectedTplId = ref('')
const records = ref([])
const drawerVis = ref(false)

/* 模板名稱 inline-edit */
const editingTplId = ref('')
const editingName = ref('')

/* Drawer → 建立模板用 */
const tplForm = ref({
  name: '',
  fields: [{ fieldName: '', fieldType: 'string', optionsRole: '' }]
})

/* 新增資料列 */
const newRow = ref({ fieldValues: {} })
const addBoxOpen = ref(false)              // ★ 展開卡片

/* 下拉選項暫存 */
const selectOptions = ref({})              // { fieldName: [{label,value}] }
const roleOptions = [
  { label: 'Manager', value: 'manager' },
  { label: 'Employee', value: 'employee' },
  { label: 'Outsource', value: 'outsource' }
]

const selectedTpl = computed(() =>
  templates.value.find(t => t._id === selectedTplId.value)
)

/* ───── methods ───── */
const loadTemplates = async () => { templates.value = await fetchTemplates() }

const selectTemplate = async id => {
  selectedTplId.value = id
  records.value = await fetchRecords(id)
  newRow.value = { fieldValues: {} }
  addBoxOpen.value = false
  await buildSelectMap()
}

async function buildSelectMap() {
  selectOptions.value = {}
  const tpl = selectedTpl.value
  if (!tpl) return
  for (const f of tpl.fields) {
    if (f.fieldType === 'select' && f.optionsRole) {
      const users = await fetchUsers({ role: f.optionsRole })
      selectOptions.value[f.fieldName] = users.map(u => ({ label: u.name, value: u.name }))
    }
  }
}

/* ----------  新增 / 編輯「資料列」 ---------- */
async function saveNewRow() {
  await apiCreateRecord({
    templateId: selectedTplId.value,
    fieldValues: newRow.value.fieldValues
  })
  ElMessage.success('已新增')
  await selectTemplate(selectedTplId.value)
}

const editingRowId = ref('')
const editingBuffer = ref({})              // 暫存編輯值

function startEditRow(row) {
  editingRowId.value = row._id
  editingBuffer.value = JSON.parse(JSON.stringify(row.fieldValues))
}
function cancelEditRow() { editingRowId.value = '' }

async function updateRow(row) {
  await apiUpdateRecord(row._id, { fieldValues: editingBuffer.value })
  ElMessage.success('已更新')
  editingRowId.value = ''
  await selectTemplate(selectedTplId.value)
}

/* ----------  模板 CRUD ---------- */
const openDrawer = () => (drawerVis.value = true)
const addTplField = () => tplForm.value.fields.push({ fieldName: '', fieldType: 'string', optionsRole: '' })
const removeTplField = i => tplForm.value.fields.splice(i, 1)

async function createTemplate() {
  const tpl = await apiCreateTemplate(tplForm.value)
  templates.value.push(tpl)
  drawerVis.value = false
  tplForm.value = { name: '', fields: [{ fieldName: '', fieldType: 'string', optionsRole: '' }] }
  ElMessage.success('已建立模板')
}

function startEditTpl(tpl) { editingTplId.value = tpl._id; editingName.value = tpl.name }
const cancelEditTpl = () => { editingTplId.value = '' }

async function saveTplName(tpl) {
  if (!editingName.value.trim()) return
  await apiUpdateTemplate(tpl._id, { name: editingName.value.trim() })
  tpl.name = editingName.value.trim()
  editingTplId.value = ''
  ElMessage.success('名稱已更新')
}

async function removeTpl(tpl) {
  await ElMessageBox.confirm(`確定刪除「${tpl.name}」模板？(資料列不會被刪)`,
    '注意', { confirmButtonText: '刪除', cancelButtonText: '取消', type: 'warning' })
  await apiDeleteTemplate(tpl._id)
  templates.value = templates.value.filter(t => t._id !== tpl._id)
  if (selectedTplId.value === tpl._id) { selectedTplId.value = ''; records.value = [] }
  ElMessage.success('已刪除模板')
}

/* ---------- life cycle ---------- */
onMounted(loadTemplates)
</script>

<template>
  <!-- ========== 版面 ========== -->
  <section class="tracker flex h-screen overflow-hidden bg-white text-gray-800">

    <!-- ───── 左欄模板清單 ───── -->
    <aside class="w-60 border-r border-gray-200 p-4 overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">追蹤模板</h2>
        <el-button circle type="primary" size="small" @click="openDrawer">＋</el-button>
      </div>

      <ul class="space-y-1">
        <li v-for="tpl in templates" :key="tpl._id" :class="['flex items-center gap-1 px-2 py-1 rounded select-none',
          selectedTplId === tpl._id ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100']">

          <!-- 編輯中 -->
          <template v-if="editingTplId === tpl._id">
            <el-input v-model="editingName" size="small" class="flex-1" @keyup.enter="saveTplName(tpl)" />
            <el-button :icon="Check" circle size="small" type="success" @click="saveTplName(tpl)" />
            <el-button :icon="Close" circle size="small" @click="cancelEditTpl" />
          </template>

          <!-- 顯示 -->
          <template v-else>
            <span class="flex-1 truncate cursor-pointer" @click="selectTemplate(tpl._id)">{{ tpl.name }}</span>
            <el-button :icon="Edit" circle size="small" @click.stop="startEditTpl(tpl)" />
            <el-button :icon="Delete" circle size="small" type="danger" @click.stop="removeTpl(tpl)" />
          </template>
        </li>
      </ul>

      <p v-if="!templates.length" class="text-gray-400 text-sm mt-4">
        尚未建立模板，請點右上「＋」新增。
      </p>
    </aside>

    <!-- ───── 右側工作表 ───── -->
    <main class="flex-1 p-6 overflow-auto">

      <!-- 未選模板 -->
      <p v-if="!selectedTpl" class="text-gray-500">請先選擇模板。</p>

      <!-- 已選模板 -->
      <div v-else>
        <h1 class="text-2xl font-bold mb-6">{{ selectedTpl.name }} – 工作表</h1>

        <!-- 新增資料列「摺疊卡」 -->
        <el-card class="mb-6" shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">新增資料列</span>
              <el-button :icon="addBoxOpen ? Close : EditPen" circle size="small" @click="addBoxOpen = !addBoxOpen" />
            </div>
          </template>

          <el-collapse-transition>
            <div v-show="addBoxOpen" class="grid gap-3 items-center mt-4"
              :style="`grid-template-columns: 140px repeat(${selectedTpl.fields.length},1fr)`">

              <div class="text-right font-medium pr-2">填寫：</div>

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
                <!-- 布林 -->
                <el-switch v-else-if="f.fieldType === 'bool'" v-model="newRow.fieldValues[f.fieldName]" active-text=""
                  inactive-text="" />
                <!-- 下拉 -->
                <el-select v-else v-model="newRow.fieldValues[f.fieldName]" :placeholder="f.fieldName"
                  style="width:100%">
                  <el-option v-for="opt in selectOptions[f.fieldName] || []" :key="opt.value" :label="opt.label"
                    :value="opt.value" />
                </el-select>
              </template>

              <!-- 儲存 -->
              <div class="col-span-full text-right">
                <el-button type="success" size="small" @click="saveNewRow">儲存</el-button>
              </div>
            </div>
          </el-collapse-transition>
        </el-card>

        <!-- 紀錄表格 -->
        <el-card shadow="never">
          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left border-b">#</th>
                  <th v-for="f in selectedTpl.fields" :key="f.fieldName" class="px-3 py-2 text-left border-b">
                    {{ f.fieldName }}
                  </th>
                  <th class="px-3 py-2 text-left border-b">操作</th>
                </tr>
              </thead>
              <tbody>

                <tr v-for="(row, i) in records" :key="row._id" :class="i % 2 ? 'bg-gray-50' : 'bg-white'">
                  <td class="px-3 py-2 border-b">{{ i + 1 }}</td>

                  <!-- 動態欄位 (讀取 & 編輯兩種狀態) -->
                  <td v-for="f in selectedTpl.fields" :key="f.fieldName" class="px-3 py-2 border-b">

                    <!-- 編輯中 -->
                    <template v-if="editingRowId === row._id">
                      <!-- string / number / date / bool / select -->
                      <el-input v-if="f.fieldType === 'string'" v-model="editingBuffer[f.fieldName]" size="small" />
                      <el-input-number v-else-if="f.fieldType === 'number'" v-model="editingBuffer[f.fieldName]"
                        size="small" style="width:100%" />
                      <el-date-picker v-else-if="f.fieldType === 'date'" v-model="editingBuffer[f.fieldName]"
                        type="date" size="small" style="width:100%" />
                      <el-switch v-else-if="f.fieldType === 'bool'" v-model="editingBuffer[f.fieldName]" active-text=""
                        inactive-text="" />
                      <el-select v-else v-model="editingBuffer[f.fieldName]" size="small" style="width:100%">
                        <el-option v-for="opt in selectOptions[f.fieldName] || []" :key="opt.value" :label="opt.label"
                          :value="opt.value" />
                      </el-select>
                    </template>

                    <!-- 顯示 -->
                    <template v-else>
                      <template v-if="f.fieldType === 'bool'">
                        {{ row.fieldValues[f.fieldName] ? '✓' : '✗' }}
                      </template>
                      <template v-else-if="f.fieldType === 'select'">
                        {{ row.fieldValues[f.fieldName] }}
                      </template>
                      <template v-else>
                        {{ row.fieldValues[f.fieldName] }}
                      </template>
                    </template>
                  </td>

                  <!-- 操作欄 -->
                  <td class="px-3 py-2 border-b whitespace-nowrap">
                    <template v-if="editingRowId === row._id">
                      <el-button :icon="Check" circle size="small" type="success" @click="updateRow(row)" />
                      <el-button :icon="Close" circle size="small" @click="cancelEditRow" />
                    </template>
                    <template v-else>
                      <el-button :icon="Edit" circle size="small" @click="startEditRow(row)" />
                    </template>
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

  <!-- ───── Drawer：建立模板 ───── -->
  <el-drawer v-model="drawerVis" title="建立新模板" size="360px">
    <el-form label-position="top" class="space-y-4" @submit.prevent>
      <el-form-item label="模板名稱">
        <el-input v-model="tplForm.name" placeholder="請輸入模板名稱" />
      </el-form-item>

      <el-form-item label="欄位設定">
        <div>
          <div v-for="(field, idx) in tplForm.fields" :key="idx" class="field-row mb-4">
            <el-input v-model="field.fieldName" placeholder="欄位名稱" class="field-input" />

            <el-select v-model="field.fieldType" placeholder="型別" class="field-type">
              <el-option label="文字" value="string" />
              <el-option label="數字" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="下拉" value="select" />
              <el-option label="布林" value="bool" />
            </el-select>

            <el-select v-if="field.fieldType === 'select'" v-model="field.optionsRole" placeholder="權限"
              class="field-role">
              <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
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
.field-row {
  display: grid;
  grid-template-columns: 1fr 105px 140px auto;
  gap: 6px;
}

.field-input {
  width: 100%
}

.field-type {
  width: 105px
}

.field-role {
  width: 140px
}
</style>
