<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../services/api'

const templates = ref([])
const selectedTplId = ref(null)
const records = ref([])

const tplForm = reactive({ name: '', fields: [] })
const recForm = reactive({ templateId: '', fieldValues: {} })

async function fetchTemplates() {
  const { data } = await api.get('/progress/templates')
  templates.value = data
  if (data.length && !selectedTplId.value) {
    selectTemplate(data[0]._id)
  }
}

function addField() {
  tplForm.fields.push({ fieldName: '', fieldType: 'string' })
}

function removeField(index) {
  tplForm.fields.splice(index, 1)
}

async function createTemplate() {
  if (!tplForm.name) return
  await api.post('/progress/templates', { name: tplForm.name, fields: tplForm.fields })
  tplForm.name = ''
  tplForm.fields = []
  await fetchTemplates()
}

async function selectTemplate(id) {
  selectedTplId.value = id
  recForm.templateId = id
  const tpl = templates.value.find((t) => t._id === id)
  recForm.fieldValues = {}
  tpl.fields.forEach((f) => {
    recForm.fieldValues[f.fieldName] = ''
  })
  await fetchRecords(id)
}

async function fetchRecords(tplId) {
  const { data } = await api.get(`/progress/records/${tplId}`)
  records.value = data
}

async function createRecord() {
  await api.post('/progress/records', recForm)
  await fetchRecords(selectedTplId.value)
  Object.keys(recForm.fieldValues).forEach((key) => (recForm.fieldValues[key] = ''))
}

onMounted(fetchTemplates)
</script>

<template>
  <h1 class="text-2xl font-bold mb-4">進度追蹤</h1>

  <el-card class="mb-6" shadow="hover">
    <div class="mb-4">
      <el-input v-model="tplForm.name" placeholder="模板名稱" />
    </div>
    <div v-for="(field, index) in tplForm.fields" :key="index" class="flex gap-2 mb-2">
      <el-input v-model="field.fieldName" placeholder="欄位名稱" />
      <el-select v-model="field.fieldType" placeholder="欄位類型">
        <el-option label="文字" value="string" />
        <el-option label="日期" value="date" />
        <el-option label="數字" value="number" />
      </el-select>
      <el-button type="danger" @click="removeField(index)">移除</el-button>
    </div>
    <div class="flex gap-2">
      <el-button type="primary" @click="addField">新增欄位</el-button>
      <el-button type="success" @click="createTemplate">建立模板</el-button>
    </div>
  </el-card>

  <el-select v-model="selectedTplId" placeholder="選擇模板" @change="selectTemplate" style="width: 200px; margin-bottom: 16px;">
    <el-option v-for="tpl in templates" :key="tpl._id" :label="tpl.name" :value="tpl._id" />
  </el-select>

  <div v-if="selectedTplId">
    <el-card class="mb-6" shadow="hover">
      <div v-for="field in templates.find((t) => t._id === selectedTplId).fields" :key="field.fieldName" class="mb-4">
        <el-form-item :label="field.fieldName">
          <template v-if="field.fieldType === 'string'">
            <el-input v-model="recForm.fieldValues[field.fieldName]" />
          </template>
          <template v-else-if="field.fieldType === 'date'">
            <el-date-picker v-model="recForm.fieldValues[field.fieldName]" type="date" placeholder="選擇日期" style="width: 100%;" />
          </template>
          <template v-else-if="field.fieldType === 'number'">
            <el-input-number v-model="recForm.fieldValues[field.fieldName]" style="width: 100%;" />
          </template>
        </el-form-item>
      </div>
      <el-button type="success" @click="createRecord">新增記錄</el-button>
    </el-card>

    <el-table :data="records" stripe style="width: 100%">
      <el-table-column label="時間">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column v-for="field in templates.find((t) => t._id === selectedTplId).fields" :key="field.fieldName" :label="field.fieldName">
        <template #default="{ row }">
          {{ row.fieldValues[field.fieldName] }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
