<!-- AdPlatforms.vue (PrimeVue Refactored) -->
<template>
  <Card>
    <template #title>
      <div class="flex justify-content-between align-items-center">
        <div class="flex align-items-center">
            <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="router.back()" />
            <h1 class="text-2xl font-bold">平台管理</h1>
        </div>
        <Button label="新增平台" icon="pi pi-plus" @click="openCreate" />
      </div>
    </template>
    <template #content>
      <DataTable :value="platforms" :loading="loading" responsiveLayout="scroll">
        <Column field="name" header="名稱" :sortable="true"></Column>
        <Column field="platformType" header="類型" :sortable="true"></Column>
        <Column header="操作" :exportable="false" style="min-width:16rem">
          <template #body="{ data }">
            <Button label="數據" icon="pi pi-chart-bar" class="p-button-text p-button-info" @click="manageData(data)" />
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="openEdit(data)" />
            <Button icon="pi pi-send" class="p-button-rounded p-button-help mr-2" @click="openTransfer(data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeletePlatform(data)" />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog v-model:visible="dialog" :header="editing ? '編輯平台' : '新增平台'" :modal="true" class="p-fluid w-full md:w-40rem">
    <div class="field">
      <label for="name">平台名稱</label>
      <InputText id="name" v-model.trim="form.name" required="true" autofocus />
    </div>
    <div class="field">
      <label for="platformType">類型</label>
      <InputText id="platformType" v-model.trim="form.platformType" />
    </div>
    <div class="field">
        <label for="mode">模式</label>
        <SelectButton v-model="form.mode" :options="modeOptions" optionLabel="label" optionValue="value" />
    </div>
    <div v-if="form.mode === 'custom'" class="field">
        <label>自訂欄位</label>
        <div class="flex flex-wrap align-items-center gap-2">
            <InputText v-model="newFieldName" placeholder="欄位名稱" />
            <Dropdown v-model="newFieldType" :options="fieldTypeOptions" optionLabel="label" optionValue="value" />
            <FormulaBuilder v-if="newFieldType === 'formula'" v-model="newFieldFormula" :fields="fieldNames" class="flex-1" />
            <Button icon="pi pi-plus" @click="addField" />
        </div>
        <OrderList v-model="form.fields" listStyle="height:auto" dataKey="name" class="mt-2">
            <template #header>欄位列表</template>
            <template #item="slotProps">
                <div class="flex justify-content-between align-items-center w-full gap-2">
                    <span>{{slotProps.item.name}} ({{slotProps.item.type}})</span>
                    <FormulaBuilder v-if="slotProps.item.type === 'formula'" v-model="slotProps.item.formula" :fields="fieldNames" class="flex-1" />
                    <Button icon="pi pi-times" class="p-button-danger p-button-text" @click="removeField(slotProps.index)" />
                </div>
            </template>
        </OrderList>
    </div>
    <template #footer>
      <Button label="取消" icon="pi pi-times" class="p-button-text" @click="dialog = false"/>
      <Button :label="editing ? '更新' : '建立'" icon="pi pi-check" @click="submit" />
    </template>
  </Dialog>

  <Dialog v-model:visible="transferDialog" header="轉移平台" :modal="true" class="p-fluid w-full md:w-20rem">
      <div class="field">
          <label for="transferTarget">目標客戶</label>
          <Dropdown id="transferTarget" v-model="transferTarget" :options="clients" optionLabel="name" optionValue="_id" placeholder="選擇客戶" />
      </div>
      <template #footer>
        <Button label="取消" icon="pi pi-times" class="p-button-text" @click="transferDialog = false"/>
        <Button label="確認" icon="pi pi-check" @click="submitTransfer" />
      </template>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { fetchPlatforms, createPlatform, updatePlatform, deletePlatform, transferPlatform } from '../services/platforms'
import { fetchClients } from '../services/clients'

// PrimeVue Components
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import OrderList from 'primevue/orderlist'
import FormulaBuilder from '../components/FormulaBuilder.vue'

const toast = useToast()
const confirm = useConfirm()
const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId

const loading = ref(true)
const platforms = ref([])
const clients = ref([])
const dialog = ref(false)
const editing = ref(false)
const transferDialog = ref(false)
const transferTarget = ref('')
const transferId = ref('')
const form = ref({ name: '', platformType: '', mode: 'custom', fields: [] })
const initializing = ref(false)

const fieldNames = computed(() => form.value.fields.map(f => f.name))

const newFieldName = ref('')
const newFieldType = ref('number')
const newFieldFormula = ref('')
const fieldTypeOptions = ref([
    { label: '數字', value: 'number' },
    { label: '文字', value: 'text' },
    { label: '日期', value: 'date' },
    { label: '公式', value: 'formula' },
])
const modeOptions = ref([
    { label: '預設', value: 'default' },
    { label: '自訂', value: 'custom' },
])
const defaultFields = [
  { name: 'spent', type: 'number', order: 1 },
  { name: 'enquiries', type: 'number', order: 2 },
  { name: 'reach', type: 'number', order: 3 },
  { name: 'impressions', type: 'number', order: 4 },
  { name: 'clicks', type: 'number', order: 5 }
]

const addField = () => {
  const name = newFieldName.value.trim()
  if (name && !form.value.fields.find(f => f.name === name)) {
    const field = { name, type: newFieldType.value, order: form.value.fields.length + 1 }
    if (newFieldType.value === 'formula') field.formula = newFieldFormula.value.trim()
    form.value.fields.push(field)
    newFieldName.value = ''
    newFieldFormula.value = ''
  }
}

const removeField = (index) => {
    form.value.fields.splice(index, 1)
}

const loadPlatforms = async () => {
  loading.value = true
  try {
    platforms.value = await fetchPlatforms(clientId)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load platforms', life: 3000 })
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = false
  initializing.value = true
  form.value = { name: '', platformType: '', mode: 'custom', fields: [] }
  newFieldFormula.value = ''
  dialog.value = true
  nextTick(() => {
    initializing.value = false
  })
}

const openEdit = (platform) => {
  editing.value = true
  initializing.value = true
  form.value = {
    ...platform,
    fields: platform.fields.map(f => (typeof f === 'string' ? { name: f, type: 'text', order: 0 } : f))
  }
  newFieldFormula.value = ''
  dialog.value = true
  nextTick(() => {
    initializing.value = false
  })
}

const submit = async () => {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Platform name is required', life: 3000 })
    return
  }

  try {
    if (editing.value) {
      await updatePlatform(clientId, form.value._id, form.value)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Platform updated', life: 3000 })
    } else {
      await createPlatform(clientId, form.value)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Platform created', life: 3000 })
    }
    dialog.value = false
    loadPlatforms()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Operation failed', life: 3000 })
  }
}

const manageData = (platform) => {
  router.push(`/clients/${clientId}/platforms/${platform._id}/data`)
}

const openTransfer = async (platform) => {
    try {
        clients.value = await fetchClients()
        transferTarget.value = ''
        transferId.value = platform._id
        transferDialog.value = true
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load clients', life: 3000 })
    }
}

const submitTransfer = async () => {
    if (!transferTarget.value) return
    try {
        await transferPlatform(transferId.value, transferTarget.value)
        toast.add({ severity: 'success', summary: 'Success', detail: 'Platform transferred', life: 3000 })
        transferDialog.value = false
        loadPlatforms()
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Transfer failed', life: 3000 })
    }
}

const confirmDeletePlatform = (platform) => {
  confirm.require({
    message: `確定要刪除「${platform.name}」嗎？`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deletePlatform(clientId, platform._id)
        toast.add({ severity: 'success', summary: 'Success', detail: 'Platform deleted', life: 3000 })
        loadPlatforms()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Deletion failed', life: 3000 })
      }
    }
  });
}

watch(() => form.value.mode, (newMode) => {
  if (initializing.value) return
  if (newMode === 'default') {
    form.value.fields = JSON.parse(JSON.stringify(defaultFields))
  } else {
    form.value.fields = []
  }
})

onMounted(loadPlatforms)
</script>
