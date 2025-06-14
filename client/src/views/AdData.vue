<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchClients, createClient, updateClient } from '../services/clients'
import { fetchDaily, createDaily, fetchWeekly } from '../services/adDaily'

const clients = ref([])
const selected = ref('')
const dailyData = ref([])
const weeklyData = ref([])

const clientDialog = ref(false)
const editingClient = ref(false)
const clientForm = ref({ name: '', platforms: [] })

const recordForm = ref({
  date: '',
  spent: '',
  reach: '',
  impressions: '',
  clicks: ''
})
const activeTab = ref('daily')

async function loadClients() {
  clients.value = await fetchClients()
}

async function loadDaily() {
  if (!selected.value) return
  dailyData.value = await fetchDaily(selected.value)
}

async function loadWeekly() {
  if (!selected.value) return
  weeklyData.value = await fetchWeekly(selected.value)
}

watch(selected, async () => {
  await loadDaily()
  await loadWeekly()
})

onMounted(loadClients)

const openCreateClient = () => {
  editingClient.value = false
  clientForm.value = { name: '', platforms: [] }
  clientDialog.value = true
}

const openEditClient = (c) => {
  editingClient.value = true
  clientForm.value = { ...c }
  clientDialog.value = true
}

const submitClient = async () => {
  if (editingClient.value) {
    await updateClient(clientForm.value._id, clientForm.value)
    ElMessage.success('已更新客戶')
  } else {
    await createClient(clientForm.value)
    ElMessage.success('已新增客戶')
  }
  clientDialog.value = false
  await loadClients()
}

const submitRecord = async () => {
  if (!selected.value) return
  await createDaily(selected.value, { ...recordForm.value })
  ElMessage.success('已新增記錄')
  recordForm.value = { date: '', spent: '', reach: '', impressions: '', clicks: '' }
  await loadDaily()
  await loadWeekly()
}
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <h1 class="text-2xl font-bold">廣告數據</h1>

    <div class="flex items-center gap-4 mb-4">
      <el-select v-model="selected" placeholder="選擇客戶" style="min-width: 200px">
        <el-option v-for="c in clients" :key="c._id" :label="c.name" :value="c._id" />
      </el-select>
      <el-button type="primary" @click="openCreateClient">＋ 新增客戶</el-button>
    </div>

    <el-table :data="clients" stripe style="width:100%" class="mb-6">
      <el-table-column prop="name" label="客戶名稱" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditClient(row)">編輯</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="clientDialog" :title="editingClient ? '編輯客戶' : '新增客戶'" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="客戶名稱"><el-input v-model="clientForm.name" /></el-form-item>
        <el-form-item label="平台">
          <el-select v-model="clientForm.platforms" multiple allow-create filterable placeholder="新增平台">
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="clientDialog=false">取消</el-button>
        <el-button type="primary" @click="submitClient">{{ editingClient ? '更新' : '建立' }}</el-button>
      </template>
    </el-dialog>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="每日記錄" name="daily">
        <el-table :data="dailyData" stripe style="width:100%" empty-text="尚無資料">
          <el-table-column prop="date" label="日期" />
          <el-table-column prop="spent" label="花費" />
          <el-table-column prop="reach" label="觸及" />
          <el-table-column prop="impressions" label="曝光" />
          <el-table-column prop="clicks" label="點擊" />
        </el-table>
        <el-form label-position="top" class="mt-4" @submit.prevent="submitRecord">
          <div class="flex flex-wrap gap-4 items-end">
            <el-date-picker v-model="recordForm.date" type="date" placeholder="日期" />
            <el-input v-model.number="recordForm.spent" placeholder="花費" class="w-28" />
            <el-input v-model.number="recordForm.reach" placeholder="觸及" class="w-28" />
            <el-input v-model.number="recordForm.impressions" placeholder="曝光" class="w-28" />
            <el-input v-model.number="recordForm.clicks" placeholder="點擊" class="w-28" />
            <el-button type="primary" native-type="submit">新增記錄</el-button>
          </div>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="週報表" name="weekly">
        <el-table :data="weeklyData" stripe style="width:100%" empty-text="尚無資料">
          <el-table-column prop="week" label="週" />
          <el-table-column prop="spent" label="總花費" />
          <el-table-column prop="reach" label="總觸及" />
          <el-table-column prop="impressions" label="總曝光" />
          <el-table-column prop="clicks" label="總點擊" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<style scoped>
</style>
