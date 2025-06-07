<!-- ProgressTracker.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchTemplates,
  createTemplate as createTemplateApi,
  fetchRecords,
  createRecord
} from '../services/progress'

const templates = ref([])
const selectedTplId = ref('')
const records = ref([])
const tplDrawerVisible = ref(false)

const tplForm = ref({
  name: '',
  fields: [{ fieldName: '', fieldType: 'string' }]
})

const newRow = ref({ fieldValues: {} })

// select 下拉資料來源，目前未實作 API，預留結構
const selectOptions = ref({})
const optionApis = []

const selectedTpl = computed(() =>
  templates.value.find((t) => t._id === selectedTplId.value)
)

async function loadTemplates() {
  templates.value = await fetchTemplates()
}

async function selectTemplate(id) {
  selectedTplId.value = id
  records.value = await fetchRecords(id)
  newRow.value = { fieldValues: {} }
}

async function addRecord() {
  if (!selectedTpl.value) return
  await createRecord({
    templateId: selectedTplId.value,
    fieldValues: newRow.value.fieldValues
  })
  ElMessage.success('已新增資料')
  await selectTemplate(selectedTplId.value)
}

function openTplDrawer() {
  tplDrawerVisible.value = true
}

function addTplField() {
  tplForm.value.fields.push({ fieldName: '', fieldType: 'string' })
}

function removeTplField(idx) {
  tplForm.value.fields.splice(idx, 1)
}

async function createTemplate() {
  const tpl = await createTemplateApi(tplForm.value)
  templates.value.push(tpl)
  tplDrawerVisible.value = false
  tplForm.value = { name: '', fields: [{ fieldName: '', fieldType: 'string' }] }
  ElMessage.success('已建立模板')
}

onMounted(loadTemplates)
</script>

<template>
  <!-- ===== 整體布局 ===== -->
  <div class="flex h-screen overflow-hidden">
    <!-- ===== 左側模板清單 ===== -->
    <aside class="w-60 border-r border-gray-200 p-4 overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">模板</h2>
        <el-button circle type="primary" size="small" @click="openTplDrawer">＋</el-button>
      </div>

      <el-menu
        :default-active="selectedTplId"
        class="border-0"
        @select="selectTemplate"
      >
        <el-menu-item
          v-for="tpl in templates"
          :key="tpl._id"
          :index="tpl._id"
          class="!h-auto py-2"
        >
          <span>{{ tpl.name }}</span>
          <span class="text-xs text-gray-400 ml-auto">{{ tpl.fields.length }} 欄</span>
        </el-menu-item>
      </el-menu>

      <p v-if="!templates.length" class="text-gray-400 text-sm mt-4">
        尚未建立模板，請點右上「＋」新增。
      </p>
    </aside>

    <!-- ===== 右側 Excel 區域 ===== -->
    <main class="flex-1 p-6 overflow-auto">
      <p v-if="!selectedTpl" class="text-gray-500">請先選擇模板。</p>

      <div v-else>
        <h1 class="text-2xl font-bold mb-6">{{ selectedTpl.name }} – 工作表</h1>

        <!-- === 新增資料列 === -->
        <el-card class="mb-6" shadow="never" :body-style="{padding:'8px'}">
          <div class="grid" :style="`grid-template-columns: 160px repeat(${selectedTpl.fields.length}, 1fr)`">
            <div class="px-3 py-2 font-medium text-right">新增資料：</div>

            <template v-for="field in selectedTpl.fields" :key="field.fieldName">
              <!-- 文字 -->
              <el-input
                v-if="field.fieldType === 'string'"
                v-model="newRow.fieldValues[field.fieldName]"
                :placeholder="field.fieldName"
              />
              <!-- 數字 -->
              <el-input-number
                v-else-if="field.fieldType === 'number'"
                v-model="newRow.fieldValues[field.fieldName]"
                style="width:100%;"
                :placeholder="field.fieldName"
              />
              <!-- 日期 -->
              <el-date-picker
                v-else-if="field.fieldType === 'date'"
                v-model="newRow.fieldValues[field.fieldName]"
                type="date"
                style="width:100%;"
                :placeholder="field.fieldName"
              />
              <!-- 下拉式選單 -->
              <el-select
                v-else-if="field.fieldType === 'select'"
                v-model="newRow.fieldValues[field.fieldName]"
                style="width:100%;"
                :placeholder="field.fieldName"
              >
                <el-option
                  v-for="opt in selectOptions[field.fieldName] || []"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </template>

            <!-- 儲存 -->
            <div class="col-span-full text-right mt-2">
              <el-button type="success" size="small" @click="addRecord">儲存</el-button>
            </div>
          </div>
        </el-card>

        <!-- === 紀錄表格 === -->
        <el-card shadow="never">
          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left border-b">#</th>
                  <th v-for="field in selectedTpl.fields" :key="field.fieldName" class="px-3 py-2 text-left border-b">
                    {{ field.fieldName }}
                  </th>
                  <th class="px-3 py-2 text-left border-b">建立時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in records" :key="row._id" class="odd:bg-white even:bg-gray-50">
                  <td class="px-3 py-2 border-b">{{ idx + 1 }}</td>
                  <td
                    v-for="field in selectedTpl.fields"
                    :key="field.fieldName"
                    class="px-3 py-2 border-b"
                  >
                    <!-- 如果是 select，顯示 label -->
                    <template v-if="field.fieldType === 'select'">
                      {{
                        (selectOptions[field.fieldName] || [])
                          .find(o => o.value === row.fieldValues[field.fieldName])?.label ||
                        row.fieldValues[field.fieldName]
                      }}
                    </template>
                    <template v-else>
                      {{ row.fieldValues[field.fieldName] }}
                    </template>
                  </td>
                  <td class="px-3 py-2 border-b">
                    {{ new Date(row.createdAt).toLocaleString() }}
                  </td>
                </tr>
                <tr v-if="!records.length">
                  <td :colspan="selectedTpl.fields.length + 2" class="text-center py-6 text-gray-400">
                    尚未新增任何資料
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </div>
    </main>
  </div>

  <!-- ===== Drawer：建立模板 ===== -->
  <el-drawer v-model="tplDrawerVisible" title="建立新模板" size="360px">
    <el-form label-position="top" class="space-y-4">
      <el-form-item label="模板名稱">
        <el-input v-model="tplForm.name" placeholder="請輸入模板名稱" />
      </el-form-item>

      <el-form-item label="欄位設定">
        <div>
          <div v-for="(field, idx) in tplForm.fields" :key="idx" class="flex items-start gap-2 mb-3">
            <!-- 欄位名稱 -->
            <el-input v-model="field.fieldName" placeholder="欄位名稱" class="flex-1" />

            <!-- 欄位型別 -->
            <el-select v-model="field.fieldType" placeholder="類型" style="width: 100px">
              <el-option label="文字" value="string" />
              <el-option label="數字" value="number" />
              <el-option label="日期" value="date" />
              <el-option label="下拉" value="select" />
            </el-select>

            <!-- 下拉型別需選 API -->
            <el-select
              v-if="field.fieldType === 'select'"
              v-model="field.optionsApi"
              placeholder="資料來源 API"
              style="width: 140px"
            >
              <el-option v-for="api in optionApis" :key="api.value" :label="api.label" :value="api.value" />
            </el-select>

            <!-- 移除 -->
            <el-button icon="Delete" circle type="danger" size="small" @click="removeTplField(idx)" />
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
