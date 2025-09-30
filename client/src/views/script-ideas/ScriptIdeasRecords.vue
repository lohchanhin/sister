<template>
  <div class="script-ideas-records">
    <header v-if="!permissionError" class="records-header">
      <div>
        <h2>{{ client?.name || '客戶腳本記錄' }}</h2>
        <p class="subtitle">管理腳本日期、地點、腳本數量與審核狀態</p>
      </div>
      <div class="actions">
        <Button label="返回客戶列表" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
        <Button label="新增腳本記錄" icon="pi pi-plus" @click="openCreate" />
      </div>
    </header>

    <section v-if="permissionError" class="permission-error">
      <i class="pi pi-lock"></i>
      <h2>無法檢視腳本記錄</h2>
      <p>{{ errorMessage }}</p>
      <Button label="返回客戶列表" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
    </section>

    <template v-else>
      <DataTable :value="records" :loading="loading" dataKey="_id" responsiveLayout="stack" breakpoint="960px">
        <Column field="date" header="腳本日期">
          <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </Column>
        <Column field="location" header="地點" />
        <Column field="scriptCount" header="腳本數量" />
        <Column field="status" header="審核狀態">
          <template #body="{ data }">
            <Tag :value="statusText(data.status)" :severity="statusSeverity(data.status)" />
          </template>
        </Column>
        <Column header="操作" bodyClass="actions-cell">
          <template #body="{ data }">
            <div class="row-actions">
              <Button icon="pi pi-search" rounded severity="secondary" @click="goToDetail(data)" />
              <Button icon="pi pi-pencil" rounded severity="info" @click="openEdit(data)" />
              <Button icon="pi pi-trash" rounded severity="danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>

      <Dialog v-model:visible="dialogVisible" :header="isEditing ? '編輯腳本記錄' : '新增腳本記錄'" modal style="width: 520px">
        <div class="form-grid">
          <span class="field">
            <label for="date">腳本日期</label>
            <Calendar id="date" v-model="form.date" dateFormat="yy-mm-dd" showIcon />
          </span>
          <span class="field">
            <label for="location">地點</label>
            <InputText id="location" v-model="form.location" placeholder="例如：台北市內湖" />
          </span>
          <span class="field">
            <label for="scriptCount">腳本數量</label>
            <InputNumber id="scriptCount" v-model="form.scriptCount" :min="0" :maxFractionDigits="0" />
          </span>
          <span class="field">
            <label for="status">審核狀態</label>
            <Dropdown id="status" v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" />
          </span>
        </div>

        <template #footer>
          <Button label="取消" severity="secondary" @click="closeDialog" />
          <Button label="儲存" :loading="saving" @click="submitForm" />
        </template>
      </Dialog>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Tag from 'primevue/tag'
import { getClient } from '@/services/clients'
import {
  createScriptIdea,
  deleteScriptIdea,
  listScriptIdeas,
  updateScriptIdea,
  SCRIPT_IDEA_STATUS
} from '@/services/scriptIdeas'
import { formatDateOnly } from '@/utils/date'

const props = defineProps({
  clientId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const toast = useToast()

const client = ref(null)
const records = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref(null)
const permissionError = ref(false)
const errorMessage = ref('')

const form = reactive({
  date: null,
  location: '',
  scriptCount: 0,
  status: SCRIPT_IDEA_STATUS.PENDING
})

const statusOptions = [
  { label: '待審核', value: SCRIPT_IDEA_STATUS.PENDING },
  { label: '審核完畢', value: SCRIPT_IDEA_STATUS.APPROVED },
  { label: '待修改', value: SCRIPT_IDEA_STATUS.REVISION }
]

const isEditing = computed(() => Boolean(editingId.value))

const resetForm = () => {
  form.date = null
  form.location = ''
  form.scriptCount = 0
  form.status = SCRIPT_IDEA_STATUS.PENDING
}

const openCreate = () => {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEdit = (record) => {
  editingId.value = record._id
  form.date = record.date ? new Date(record.date) : null
  form.location = record.location || ''
  form.scriptCount = record.scriptCount ?? 0
  form.status = record.status || SCRIPT_IDEA_STATUS.PENDING
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
}

const buildPayload = () => ({
  date: form.date ? formatDateOnly(form.date) : '',
  location: form.location,
  scriptCount: form.scriptCount,
  status: form.status
})

const submitForm = async () => {
  if (!form.date) {
    toast.add({ severity: 'warn', summary: '日期必填', detail: '請選擇腳本日期', life: 2500 })
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await updateScriptIdea(props.clientId, editingId.value, buildPayload())
      toast.add({ severity: 'success', summary: '更新成功', detail: '腳本記錄已更新', life: 2500 })
    } else {
      await createScriptIdea(props.clientId, buildPayload())
      toast.add({ severity: 'success', summary: '新增成功', detail: '已建立新的腳本記錄', life: 2500 })
    }
    dialogVisible.value = false
    await loadRecords()
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      toast.add({ severity: 'warn', summary: '無權限', detail: '您沒有腳本創意的編輯權限', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '儲存失敗', detail: '請稍後再試', life: 3000 })
    }
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (record) => {
  if (!window.confirm('確定要刪除此腳本記錄嗎？')) return
  try {
    await deleteScriptIdea(props.clientId, record._id)
    toast.add({ severity: 'success', summary: '刪除成功', detail: '腳本記錄已刪除', life: 2500 })
    await loadRecords()
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      toast.add({ severity: 'warn', summary: '無權限', detail: '您沒有腳本創意的刪除權限', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '刪除失敗', detail: '請稍後再試', life: 3000 })
    }
  }
}

const goToDetail = (record) => {
  router.push({ name: 'ScriptIdeasDetail', params: { clientId: props.clientId, recordId: record._id } })
}

const goBack = () => {
  router.push({ name: 'ScriptIdeasClients' })
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

const statusText = (value) => {
  switch (value) {
    case SCRIPT_IDEA_STATUS.APPROVED:
      return '審核完畢'
    case SCRIPT_IDEA_STATUS.REVISION:
      return '待修改'
    default:
      return '待審核'
  }
}

const statusSeverity = (value) => {
  switch (value) {
    case SCRIPT_IDEA_STATUS.APPROVED:
      return 'success'
    case SCRIPT_IDEA_STATUS.REVISION:
      return 'warning'
    default:
      return 'info'
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    records.value = await listScriptIdeas(props.clientId)
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      records.value = []
    } else {
      toast.add({ severity: 'error', summary: '載入失敗', detail: '無法取得腳本記錄', life: 3000 })
    }
  } finally {
    loading.value = false
  }
}

const loadClient = async () => {
  try {
    client.value = await getClient(props.clientId)
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
    }
    client.value = null
  }
}

const resetPermissionState = () => {
  permissionError.value = false
  errorMessage.value = ''
}

onMounted(() => {
  resetPermissionState()
  loadClient()
  loadRecords()
})

watch(
  () => props.clientId,
  () => {
    resetPermissionState()
    loadClient()
    loadRecords()
  }
)
</script>

<style scoped>
.script-ideas-records {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.actions-cell {
  text-align: center;
}

.permission-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #6b7280;
}

.permission-error i {
  font-size: 2rem;
  color: #ef4444;
}

.permission-error h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.permission-error p {
  margin: 0;
  max-width: 420px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: #374151;
}

@media (max-width: 640px) {
  .script-ideas-records {
    padding: 1.5rem;
  }

  .actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
