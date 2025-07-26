<template>
  <div class="grid">

    <!-- Asset Stats -->
    <div class="col-12">
       <Card>
        <template #title>素材統計</template>
        <template #content>
          <div class="grid text-center">
            <div class="col">
              <div>素材總數</div>
              <div class="text-2xl font-bold mt-1">{{ assetStats.rawTotal || 0 }}</div>
            </div>
            <div class="col">
              <div>成品總數</div>
              <div class="text-2xl font-bold mt-1">{{ assetStats.editedTotal || 0 }}</div>
            </div>
            <div class="col">
              <div>待審</div>
              <div class="text-2xl font-bold mt-1">{{ assetStats.pending || 0 }}</div>
            </div>
            <div class="col">
              <div>通過</div>
              <div class="text-2xl font-bold mt-1">{{ assetStats.approved || 0 }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Recent Products -->
    <div class="col-12">
      <Card>
        <template #title>近期成品進度</template>
        <template #content>
          <DataTable :value="recentProducts" :rows="5" responsiveLayout="scroll" emptyMessage="尚無成品">
            <Column field="createdAt" header="上傳時間">
              <template #body="{data}">{{ new Date(data.createdAt).toLocaleString() }}</template>
            </Column>
            <Column field="fileName" header="檔名" />
            <Column field="progress" header="進度">
              <template #body="{data}">
                <div class="flex flex-column gap-1">
                  <ProgressBar :value="(data.progress.done / data.progress.total) * 100" />
                  <div class="text-sm">
                    {{ data.progress.done }} / {{ data.progress.total }}
                    <span v-if="data.pendingStage">- {{ data.pendingStage }}</span>
                  </div>
                </div>
              </template>
            </Column>
            <Column header="設定">
              <template #body="{data}">
                <Button icon="pi pi-cog" class="p-button-text" @click="openStages(data)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
    <Dialog v-model:visible="stageDialogVisible" header="審查關卡" :modal="true">
      <div v-for="stage in stageList" :key="stage._id" class="flex align-items-center mb-2">
        <Checkbox
          :inputId="stage._id"
          :modelValue="stage.checked"
          :binary="true"
          @change="onStageChange(stage, $event)"
          class="mr-2"
        />
        <label :for="stage._id">{{ stage.name }}</label>
      </div>
      <template #footer>
        <Button label="取消" class="p-button-text" @click="closeStageDialog" />
        <Button label="儲存" icon="pi pi-check" @click="saveStages" />
      </template>
    </Dialog>
    
    <!-- Recent Assets & Reviews -->
    <div class="col-12 md:col-6">
      <Card>
        <template #title>
            <div class="flex justify-content-between align-items-center">
                <span>最近素材上傳</span>
                <Button label="查看全部" class="p-button-link" @click="$router.push('/assets')" />
            </div>
        </template>
        <template #content>
          <DataTable :value="recentAssets" :rows="5" responsiveLayout="scroll" emptyMessage="尚無素材上傳">
            <Column field="createdAt" header="上傳時間">
              <template #body="{data}">{{ new Date(data.createdAt).toLocaleString() }}</template>
            </Column>
            <Column field="fileName" header="檔名"></Column>
            <Column field="fileType" header="類型">
                <template #body="{data}"><Tag :value="data.fileType" /></template>
            </Column>
            <Column field="uploaderName" header="上傳者"></Column>
          </DataTable>
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-6">
       <Card>
        <template #title>最近審查結果</template>
        <template #content>
          <DataTable :value="recentReviews" :rows="5" responsiveLayout="scroll" emptyMessage="尚無審查紀錄">
            <Column field="updatedAt" header="時間">
                <template #body="{data}">{{ new Date(data.updatedAt).toLocaleString() }}</template>
            </Column>
            <Column field="assetFile" header="素材"></Column>
            <Column field="stage" header="階段"></Column>
            <Column field="completed" header="狀態">
                <template #body="{data}">
                    <Tag :severity="data.completed ? 'success' : 'warning'" :value="data.completed ? '完成' : '未完成'" />
                </template>
            </Column>
            <Column field="updatedBy" header="審核者"></Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { fetchProducts, fetchProductStages, updateProductStage } from '../services/products'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import ProgressBar from 'primevue/progressbar'

/* ===== Reactive State ===== */
const recentAssets = ref([])
const recentReviews = ref([])
const recentProducts = ref([])
const assetStats = ref({})
const stageDialogVisible = ref(false)
const stageList = ref([])
let currentProductId = null

/* ===== API Requests ===== */
async function fetchDashboard () {
  const { data } = await api.get('/dashboard/summary')
  recentAssets.value  = data.recentAssets
  recentReviews.value = data.recentReviews
  recentProducts.value = data.recentProducts
  assetStats.value    = data.assetStats
}

async function openStages (item) {
  stageDialogVisible.value = true
  currentProductId = item._id
  const list = await fetchProductStages(item._id)
  stageList.value = list.map(s => ({ ...s, checked: s.completed }))
}

async function onStageChange (stage, event) {
  stage.checked = event.target.checked
}

function closeStageDialog () {
  stageDialogVisible.value = false
}

async function saveStages () {
  const promises = stageList.value.map(stage => {
    if (stage.checked !== stage.completed) {
      return updateProductStage(
        currentProductId,
        stage._id,
        stage.checked,
        true
      )
    }
    return Promise.resolve()
  })
  await Promise.all(promises)
  stageDialogVisible.value = false
  await fetchDashboard()
}

onMounted(fetchDashboard)
</script>