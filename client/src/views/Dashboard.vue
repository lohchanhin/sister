<template>
  <div class="dashboard">
    <!-- Stats Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-video"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ assetStats.rawTotal || 0 }}</div>
          <div class="stat-label">素材總數</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon success">
          <i class="pi pi-box"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ assetStats.editedTotal || 0 }}</div>
          <div class="stat-label">成品總數</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon warning">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ assetStats.pending || 0 }}</div>
          <div class="stat-label">待審核</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon info">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ assetStats.approved || 0 }}</div>
          <div class="stat-label">已通過</div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid">
      <!-- Recent Products -->
      <div class="content-section full-width">
        <Card class="modern-card">
          <template #title>
            <div class="card-header">
              <div class="card-title">
                <i class="pi pi-box mr-2"></i>
                成品進度
              </div>
              <Button 
                label="查看全部" 
                icon="pi pi-external-link"
                class="p-button-text p-button-sm" 
                @click="$router.push('/products')" 
              />
            </div>
          </template>
          <template #content>
            <div v-if="!isMobile" class="table-container">
              <DataTable
                :value="recentProducts"
                responsiveLayout="scroll"
                emptyMessage="尚無成品"
                class="modern-table"
              >
                <Column field="createdAt" header="上傳時間" style="min-width: 150px">
                  <template #body="{ data }">
                    <div class="date-cell">{{ new Date(data.createdAt).toLocaleString() }}</div>
                  </template>
                </Column>
                <Column field="title" header="檔名" style="min-width: 200px">
                  <template #body="{ data }">
                    <div class="title-cell">{{ data.title || data.fileName }}</div>
                  </template>
                </Column>
                <Column field="editor" header="剪輯師" style="min-width: 120px" />
                <Column field="editCompletedAt" header="完成日期" style="min-width: 120px">
                  <template #body="{ data }">
                    <div v-if="data.editCompletedAt" class="date-cell">
                      {{ new Date(data.editCompletedAt).toLocaleDateString() }}
                    </div>
                    <span v-else class="text-muted">-</span>
                  </template>
                </Column>
                <Column field="xhsStatus" header="發布狀態" style="min-width: 100px">
                  <template #body="{ data }">
                    <Tag 
                      :value="data.xhsStatus === 'published' ? '已發布' : '未發布'" 
                      :severity="data.xhsStatus === 'published' ? 'success' : 'warning'"
                    />
                  </template>
                </Column>
                <Column field="progress" header="進度" style="min-width: 150px">
                  <template #body="{ data }">
                    <div class="progress-cell">
                      <ProgressBar :value="(data.progress.done / data.progress.total) * 100" class="mb-1" />
                      <div class="progress-text">
                        {{ data.progress.done }} / {{ data.progress.total }}
                        <span v-if="data.pendingStage" class="pending-stage">- {{ data.pendingStage }}</span>
                      </div>
                    </div>
                  </template>
                </Column>
                <Column header="操作" style="min-width: 100px">
                  <template #body="{ data }">
                    <div class="action-buttons">
                      <Button 
                        icon="pi pi-pencil" 
                        class="p-button-text p-button-sm" 
                        @click="openEdit(data)"
                        v-tooltip="'編輯'"
                      />
                      <Button 
                        icon="pi pi-cog" 
                        class="p-button-text p-button-sm" 
                        @click="openStages(data)"
                        v-tooltip="'設定階段'"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
            
            <!-- Mobile Cards -->
            <div v-else class="mobile-cards">
              <div v-for="p in recentProducts" :key="p._id" class="mobile-card">
                <div class="mobile-card-header">
                  <h4>{{ p.title || p.fileName }}</h4>
                  <div class="mobile-card-actions">
                    <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="openEdit(p)" />
                    <Button icon="pi pi-cog" class="p-button-text p-button-sm" @click="openStages(p)" />
                  </div>
                </div>
                <div class="mobile-card-content">
                  <div class="mobile-card-row">
                    <span class="label">上傳時間:</span>
                    <span>{{ new Date(p.createdAt).toLocaleString() }}</span>
                  </div>
                  <div class="mobile-card-row">
                    <span class="label">進度:</span>
                    <div class="progress-mobile">
                      <ProgressBar :value="(p.progress.done / p.progress.total) * 100" class="mb-1" />
                      <span>{{ p.progress.done }} / {{ p.progress.total }}</span>
                    </div>
                  </div>
                  <div class="mobile-card-row">
                    <span class="label">狀態:</span>
                    <Tag 
                      :value="p.xhsStatus === 'published' ? '已發布' : '未發布'" 
                      :severity="p.xhsStatus === 'published' ? 'success' : 'warning'"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Recent Assets -->
      <div class="content-section">
        <Card class="modern-card">
          <template #title>
            <div class="card-header">
              <div class="card-title">
                <i class="pi pi-video mr-2"></i>
                最近素材上傳
              </div>
              <Button 
                label="查看全部" 
                icon="pi pi-external-link"
                class="p-button-text p-button-sm" 
                @click="$router.push('/assets')" 
              />
            </div>
          </template>
          <template #content>
            <div v-if="!isMobile" class="table-container">
              <DataTable 
                :value="recentAssets" 
                :rows="5" 
                responsiveLayout="scroll" 
                emptyMessage="尚無素材上傳"
                class="modern-table"
              >
                <Column field="createdAt" header="上傳時間">
                  <template #body="{ data }">
                    <div class="date-cell">{{ new Date(data.createdAt).toLocaleString() }}</div>
                  </template>
                </Column>
                <Column field="fileName" header="檔名" />
                <Column field="fileType" header="類型">
                  <template #body="{ data }">
                    <Tag :value="data.fileType" />
                  </template>
                </Column>
                <Column field="uploaderName" header="上傳者" />
              </DataTable>
            </div>
            
            <div v-else class="mobile-cards">
              <div v-for="a in recentAssets" :key="a._id" class="mobile-card">
                <div class="mobile-card-header">
                  <h4>{{ a.fileName }}</h4>
                  <Tag :value="a.fileType" />
                </div>
                <div class="mobile-card-content">
                  <div class="mobile-card-row">
                    <span class="label">上傳時間:</span>
                    <span>{{ new Date(a.createdAt).toLocaleString() }}</span>
                  </div>
                  <div class="mobile-card-row">
                    <span class="label">上傳者:</span>
                    <span>{{ a.uploaderName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Recent Reviews -->
      <div class="content-section review-fill">
        <Card class="modern-card">
          <template #title>
            <div class="card-header">
              <div class="card-title">
                <i class="pi pi-check-square mr-2"></i>
                最近審查結果
              </div>
            </div>
          </template>
          <template #content>
            <div v-if="!isMobile" class="table-container">
              <DataTable 
                :value="recentReviews" 
                :rows="5" 
                responsiveLayout="scroll" 
                emptyMessage="尚無審查紀錄"
                class="modern-table"
              >
                <Column field="updatedAt" header="時間">
                  <template #body="{ data }">
                    <div class="date-cell">{{ new Date(data.updatedAt).toLocaleString() }}</div>
                  </template>
                </Column>
                <Column field="assetFile" header="素材" />
                <Column field="stage" header="階段" />
                <Column field="completed" header="狀態">
                  <template #body="{ data }">
                    <Tag 
                      :severity="data.completed ? 'success' : 'warning'" 
                      :value="data.completed ? '完成' : '未完成'" 
                    />
                  </template>
                </Column>
                <Column field="updatedBy" header="審核者" />
              </DataTable>
            </div>
            
            <div v-else class="mobile-cards">
              <div v-for="r in recentReviews" :key="r._id" class="mobile-card">
                <div class="mobile-card-header">
                  <h4>{{ r.assetFile }}</h4>
                  <Tag 
                    :severity="r.completed ? 'success' : 'warning'" 
                    :value="r.completed ? '完成' : '未完成'" 
                  />
                </div>
                <div class="mobile-card-content">
                  <div class="mobile-card-row">
                    <span class="label">時間:</span>
                    <span>{{ new Date(r.updatedAt).toLocaleString() }}</span>
                  </div>
                  <div class="mobile-card-row">
                    <span class="label">階段:</span>
                    <span>{{ r.stage }}</span>
                  </div>
                  <div class="mobile-card-row">
                    <span class="label">審核者:</span>
                    <span>{{ r.updatedBy }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Dialogs remain the same -->
    <Dialog v-model:visible="stageDialogVisible" header="審查關卡" :modal="true" class="modern-dialog">
      <div v-for="stage in stageList" :key="stage._id" class="stage-item">
        <Checkbox 
          :inputId="stage._id" 
          :modelValue="stage.checked" 
          :binary="true" 
          @change="onStageChange(stage, $event)"
          class="mr-2" 
        />
        <label :for="stage._id" class="stage-label">{{ stage.name }}</label>
      </div>
      <template #footer>
        <Button label="取消" class="p-button-text" @click="closeStageDialog" />
        <Button label="儲存" icon="pi pi-check" @click="saveStages" />
      </template>
    </Dialog>

    <Dialog v-model:visible="editDialogVisible" header="編輯成品資料" :modal="true" class="modern-dialog edit-dialog">
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
          <DatePicker id="edit-completed" v-model="editItem.editCompletedAt" inputId="edit-completed" style="width:100%" />
        </div>
        <div class="field">
          <label for="edit-xhs">xhs 發布狀態</label>
          <Dropdown id="edit-xhs" v-model="editItem.xhsStatus" :options="xhsOptions" optionLabel="label" optionValue="value" />
        </div>
        <div class="field">
          <label for="edit-publish">發佈日期</label>
          <DatePicker id="edit-publish" v-model="editItem.scheduledPublishAt" inputId="edit-publish" style="width:100%" />
        </div>
        <div class="field checkbox-field">
          <Checkbox v-model="editItem.finalChecked" binary inputId="final-check" />
          <label for="final-check">最終檢查</label>
        </div>
        <div class="field checkbox-field">
          <Checkbox v-model="editItem.fbSynced" binary inputId="fb-sync" />
          <label for="fb-sync">同步 Facebook</label>
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
  recentProducts.value = structuredClone(data.recentProducts) // 取得完整成品列表
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
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: var(--primary-color-text);
  font-size: 1.25rem;
}

.stat-icon.success {
  background: var(--green-500);
  color: white;
}

.stat-icon.warning {
  background: var(--orange-500);
  color: white;
}

.stat-icon.info {
  background: var(--blue-500);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.content-section.full-width {
  grid-column: 1 / -1;
}

.modern-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--surface-border);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

/* Table Styles */
.table-container {
  border-radius: 8px;
  overflow: hidden;
}

.modern-table {
  border: none;
}

:deep(.modern-table .p-datatable-header) {
  background: var(--surface-a);
  border: none;
  padding: 1rem;
}

:deep(.modern-table .p-datatable-thead > tr > th) {
  background: var(--surface-a);
  border: none;
  border-bottom: 1px solid var(--surface-border);
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--text-color);
}

:deep(.modern-table .p-datatable-tbody > tr > td) {
  border: none;
  border-bottom: 1px solid var(--surface-border);
  padding: 1rem;
}

:deep(.modern-table .p-datatable-tbody > tr:hover) {
  background: var(--surface-hover);
}

.date-cell {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.title-cell {
  font-weight: 500;
  color: var(--text-color);
}

.progress-cell {
  min-width: 150px;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-align: center;
}

.pending-stage {
  color: var(--orange-500);
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.text-muted {
  color: var(--text-color-secondary);
}

/* Mobile Cards */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-card {
  background: var(--surface-a);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1rem;
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.mobile-card-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  flex: 1;
  margin-right: 1rem;
}

.mobile-card-actions {
  display: flex;
  gap: 0.25rem;
}

.mobile-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.mobile-card-row .label {
  font-weight: 500;
  color: var(--text-color-secondary);
  min-width: 80px;
}

.progress-mobile {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  min-width: 120px;
}

/* Dialog Styles */
.modern-dialog {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.modern-dialog .p-dialog-header) {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

:deep(.modern-dialog .p-dialog-content) {
  background: var(--surface-card);
}

:deep(.modern-dialog .p-dialog-footer) {
  background: var(--surface-card);
  border-top: 1px solid var(--surface-border);
}

.stage-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.stage-item:last-child {
  border-bottom: none;
}

.stage-label {
  font-weight: 500;
  color: var(--text-color);
  cursor: pointer;
}

.edit-dialog {
  width: 90vw;
  max-width: 500px;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-field label {
  margin: 0;
  font-weight: 500;
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media screen and (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .mobile-card-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .mobile-card-row .label {
    min-width: auto;
  }
  
  .progress-mobile {
    align-items: flex-start;
    width: 100%;
  }
}

/* 讓最近審查結果在桌機把剩餘欄位吃掉 */
@media screen and (min-width: 992px) {
  .review-fill {
    grid-column: span 2;   /* 視窗夠寬時，一次佔 2 個欄 */
  }
}

/* 小螢幕維持單欄即可（可省略，因為 <992px 不會讀到上面的 span 2） */
@media screen and (max-width: 991px) {
  .review-fill {
    grid-column: span 1;
  }
}

/* （建議）讓 Grid 自動把空洞補起來 */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  grid-auto-flow: dense;   /* 新增這行 */
}

</style>
