<template>
  <div class="grid dashboard-grid">

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
          <DataTable v-if="!isMobile" :value="recentProducts" :rows="5" responsiveLayout="scroll" emptyMessage="尚無成品">
            <Column field="createdAt" header="上傳時間">
              <template #body="{ data }">{{ new Date(data.createdAt).toLocaleString() }}</template>
            </Column>
            <Column field="title" header="檔名">
              <template #body="{ data }">{{ data.title || data.fileName }}</template>
            </Column>
            <Column field="editor" header="剪輯師" />
            <Column field="editCompletedAt" header="完成剪輯日期">
              <template #body="{ data }">{{ data.editCompletedAt ? new Date(data.editCompletedAt).toLocaleDateString() :
                '' }}</template>
            </Column>
            <Column field="xhsStatus" header="xhs發布狀態">
              <template #body="{ data }">{{ data.xhsStatus === 'published' ? '已發布' : '未發布' }}</template>
            </Column>
            <Column field="scheduledPublishAt" header="發佈日期">
              <template #body="{ data }">{{ data.scheduledPublishAt ? new
                Date(data.scheduledPublishAt).toLocaleDateString() : '' }}</template>
            </Column>
            <Column field="finalChecked" header="最終檢查">
              <template #body="{ data }">
                <Checkbox :modelValue="data.finalChecked" binary disabled />
              </template>
            </Column>
            <Column field="fbSynced" header="同步FB">
              <template #body="{ data }">
                <Checkbox :modelValue="data.fbSynced" binary disabled />
              </template>
            </Column>
            <Column field="fbResponsible" header="FB負責人" />
            <Column field="progress" header="進度">
              <template #body="{ data }">
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
              <template #body="{ data }">
                <Button icon="pi pi-pencil" class="p-button-text mr-2" @click="openEdit(data)" />
                <Button icon="pi pi-cog" class="p-button-text" @click="openStages(data)" />
              </template>
            </Column>
          </DataTable>
          <div v-else class="mobile-card-list">
            <Card v-for="p in recentProducts" :key="p._id" class="mobile-card">
              <template #title>{{ p.title || p.fileName }}</template>
              <template #content>
                <div class="text-sm mb-2">上傳時間: {{ new Date(p.createdAt).toLocaleString() }}</div>
                <div class="text-sm mb-2">進度 {{ p.progress.done }} / {{ p.progress.total }}</div>
                <div class="text-sm mb-2">{{ p.xhsStatus === 'published' ? '已發布' : '未發布' }}</div>
                <div class="flex justify-content-end">
                  <Button icon="pi pi-pencil" class="p-button-text mr-2" @click="openEdit(p)" />
                  <Button icon="pi pi-cog" class="p-button-text" @click="openStages(p)" />
                </div>
              </template>
            </Card>
          </div>
        </template>
      </Card>
    </div>
    <Dialog v-model:visible="stageDialogVisible" header="審查關卡" :modal="true">
      <div v-for="stage in stageList" :key="stage._id" class="flex align-items-center mb-2">
        <Checkbox :inputId="stage._id" :modelValue="stage.checked" :binary="true" @change="onStageChange(stage, $event)"
          class="mr-2" />
        <label :for="stage._id">{{ stage.name }}</label>
      </div>
      <template #footer>
        <Button label="取消" class="p-button-text" @click="closeStageDialog" />
        <Button label="儲存" icon="pi pi-check" @click="saveStages" />
      </template>
    </Dialog>

    <Dialog v-model:visible="editDialogVisible" header="編輯成品資料" :modal="true" style="width: 400px">
      <div class="p-fluid">
        <div class="field">
          <label for="edit-title">檔名</label>
          <InputText id="edit-title" v-model="editItem.title" />
        </div>
        <div class="field">
          <label for="edit-editor">剪輯師</label>
          <Dropdown id="edit-editor" v-model="editItem.editor" :options="editorList" editable filter />
        </div>
        <div class="field">
          <label for="edit-completed">完成剪輯日期</label>
          <DatePicker id="edit-completed" v-model="editItem.editCompletedAt" inputId="edit-completed"
            style="width:100%" />
        </div>
        <div class="field">
          <label for="edit-xhs">xhs 發布狀態</label>
          <Dropdown id="edit-xhs" v-model="editItem.xhsStatus" :options="xhsOptions" optionLabel="label"
            optionValue="value" />
        </div>
        <div class="field">
          <label for="edit-publish">發佈日期</label>
          <DatePicker id="edit-publish" v-model="editItem.scheduledPublishAt" inputId="edit-publish"
            style="width:100%" />
        </div>
        <div class="field">
          <label class="mr-2">最終檢查</label>
          <Checkbox v-model="editItem.finalChecked" binary />
        </div>
        <div class="field">
          <label class="mr-2">同步 Facebook</label>
          <Checkbox v-model="editItem.fbSynced" binary />
        </div>
        <div class="field">
          <label for="edit-fb">FB 負責人</label>
          <Dropdown id="edit-fb" v-model="editItem.fbResponsible" :options="fbResponsibleList" editable filter />
        </div>
      </div>
      <template #footer>
        <Button label="取消" class="p-button-text" @click="editDialogVisible = false" />
        <Button label="儲存" icon="pi pi-check" @click="saveEdit" />
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
          <DataTable v-if="!isMobile" :value="recentAssets" :rows="5" responsiveLayout="scroll" emptyMessage="尚無素材上傳">
            <Column field="createdAt" header="上傳時間">
              <template #body="{ data }">{{ new Date(data.createdAt).toLocaleString() }}</template>
            </Column>
            <Column field="fileName" header="檔名"></Column>
            <Column field="fileType" header="類型">
              <template #body="{ data }">
                <Tag :value="data.fileType" />
              </template>
            </Column>
            <Column field="uploaderName" header="上傳者"></Column>
          </DataTable>
          <div v-else class="mobile-card-list">
            <Card v-for="a in recentAssets" :key="a._id" class="mobile-card">
              <template #title>{{ a.fileName }}</template>
              <template #content>
                <div class="text-sm mb-2">{{ new Date(a.createdAt).toLocaleString() }}</div>
                <div class="text-sm mb-2"><Tag :value="a.fileType" /></div>
                <div class="text-sm mb-2">{{ a.uploaderName }}</div>
              </template>
            </Card>
          </div>
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-6">
      <Card>
        <template #title>最近審查結果</template>
        <template #content>
          <DataTable v-if="!isMobile" :value="recentReviews" :rows="5" responsiveLayout="scroll" emptyMessage="尚無審查紀錄">
            <Column field="updatedAt" header="時間">
              <template #body="{ data }">{{ new Date(data.updatedAt).toLocaleString() }}</template>
            </Column>
            <Column field="assetFile" header="素材"></Column>
            <Column field="stage" header="階段"></Column>
            <Column field="completed" header="狀態">
              <template #body="{ data }">
                <Tag :severity="data.completed ? 'success' : 'warning'" :value="data.completed ? '完成' : '未完成'" />
              </template>
            </Column>
            <Column field="updatedBy" header="審核者"></Column>
          </DataTable>
          <div v-else class="mobile-card-list">
            <Card v-for="r in recentReviews" :key="r._id" class="mobile-card">
              <template #title>{{ r.assetFile }}</template>
              <template #content>
                <div class="text-sm mb-2">{{ new Date(r.updatedAt).toLocaleString() }}</div>
                <div class="text-sm mb-2">{{ r.stage }}</div>
                <div class="text-sm mb-2">
                  <Tag :severity="r.completed ? 'success' : 'warning'" :value="r.completed ? '完成' : '未完成'" />
                </div>
                <div class="text-sm">{{ r.updatedBy }}</div>
              </template>
            </Card>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import api from '../services/api'
import { fetchProductStages, updateProductStage, updateProduct } from '../services/products'

import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import ProgressBar from 'primevue/progressbar'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import DatePicker from 'primevue/datepicker'

/* ===== Reactive State ===== */
const recentAssets = ref([])
const recentReviews = ref([])
const recentProducts = ref([])
const assetStats = ref({})
const refreshKey = ref(0)      // 強制 DataTable 重新 render
const stageDialogVisible = ref(false)
const stageList = ref([])
let currentProductId = null
let dashboardTimer = null
const isMobile = ref(window.innerWidth <= 991)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 991
}

const editDialogVisible = ref(false)
const editItem = ref({})
const xhsOptions = [
  { label: '已發布', value: 'published' },
  { label: '未發布', value: 'unpublished' }
]
const editorList = ref([])
const fbResponsibleList = ref([])

/* ===== LocalStorage Helpers ===== */
function loadLists() {
  const editors = localStorage.getItem('editorList')
  if (editors) {
    try { editorList.value = JSON.parse(editors) } catch (_) { }
  }
  const fb = localStorage.getItem('fbResponsibleList')
  if (fb) {
    try { fbResponsibleList.value = JSON.parse(fb) } catch (_) { }
  }
}
function saveLists() {
  localStorage.setItem('editorList', JSON.stringify(editorList.value))
  localStorage.setItem('fbResponsibleList', JSON.stringify(fbResponsibleList.value))
}

/* ===== API ===== */
async function fetchDashboard() {
  // recentProducts.value = null;
  const { data } = await api.get('/dashboard/summary')
  recentAssets.value = structuredClone(data.recentAssets)
  recentReviews.value = structuredClone(data.recentReviews)
  recentProducts.value = structuredClone(data.recentProducts)
  assetStats.value = { ...data.assetStats }
  refreshKey.value++                         // 觸發 DataTable 重繪
}

/* ===== Stages Dialog ===== */
async function openStages(item) {
  stageDialogVisible.value = true
  currentProductId = item._id
  const list = await fetchProductStages(item._id)
  stageList.value = list.map(s => ({ ...s, checked: s.completed }))
}
async function onStageChange(stage, e) {
  stage.checked = e.target.checked
}
function closeStageDialog() {
  stageDialogVisible.value = false
}
async function saveStages() {
  await Promise.all(
    stageList.value.map(s =>
      s.checked !== s.completed
        ? updateProductStage(currentProductId, s._id, s.checked, true, true)
        : Promise.resolve()
    )
  )
  stageDialogVisible.value = false
  await nextTick()
  await fetchDashboard()
}

/* ===== Edit Dialog ===== */
function openEdit(item) {
  editItem.value = {
    _id: item._id,
    title: item.title,
    editor: item.editor,
    editCompletedAt: item.editCompletedAt || null,
    xhsStatus: item.xhsStatus || 'unpublished',
    scheduledPublishAt: item.scheduledPublishAt || null,
    finalChecked: item.finalChecked || false,
    fbSynced: item.fbSynced || false,
    fbResponsible: item.fbResponsible
  }
  editDialogVisible.value = true
}
async function saveEdit() {
  await updateProduct(editItem.value._id, {
    title: editItem.value.title,
    editor: editItem.value.editor,
    editCompletedAt: editItem.value.editCompletedAt,
    xhsStatus: editItem.value.xhsStatus,
    scheduledPublishAt: editItem.value.scheduledPublishAt,
    finalChecked: editItem.value.finalChecked,
    fbSynced: editItem.value.fbSynced,
    fbResponsible: editItem.value.fbResponsible
  })
  if (editItem.value.editor && !editorList.value.includes(editItem.value.editor))
    editorList.value.push(editItem.value.editor)
  if (editItem.value.fbResponsible && !fbResponsibleList.value.includes(editItem.value.fbResponsible))
    fbResponsibleList.value.push(editItem.value.fbResponsible)
  saveLists()
  editDialogVisible.value = false
  await nextTick()
  await fetchDashboard()
}

/* ===== Lifecycle ===== */
onMounted(() => {
  loadLists()
  fetchDashboard()
  dashboardTimer = setInterval(fetchDashboard, 30000)  // 前景輪詢 30s
  window.addEventListener('resize', handleResize)
  handleResize()
})
onUnmounted(() => {
  if (dashboardTimer) clearInterval(dashboardTimer)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
@media screen and (max-width: 991px) {
  .dashboard-grid {
    display: flex;
    flex-direction: column;
  }
  .mobile-card-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .mobile-card-list .p-card {
    font-size: 0.9rem;
  }
}
</style>
