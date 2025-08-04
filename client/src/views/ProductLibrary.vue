<template>
  <div class="library-container">
    <Toast position="bottom-right" group="br" />
    <Toast position="bottom-right" />
    <Toast position="top-center" group="upload-batch" />

    <!-- Header Section -->
    <div class="library-header">
      <div class="header-content">
        <div class="header-title">
          <h1 class="title-text">成品區</h1>
          <p class="title-subtitle">管理您的完成作品和最終產出</p>
        </div>
        <div class="header-actions">
          <Button
            icon="pi pi-refresh"
            class="action-btn secondary"
            @click="loadData(currentFolder?._id)"
            v-tooltip.bottom="'重新整理'"
          />
          <Button
            icon="pi pi-upload"
            label="上傳成品"
            class="action-btn primary"
            @click="triggerUpload"
          />
        </div>
      </div>
    </div>

    <!-- Toolbar Section -->
    <div class="toolbar-section">
      <div class="toolbar-content">
        <div class="toolbar-left">
          <Button 
            icon="pi pi-arrow-left" 
            class="nav-btn" 
            @click="goUp" 
            :disabled="!currentFolder"
            v-tooltip.bottom="'返回上層'"
          />
          <div class="folder-creator">
            <InputText 
              v-model="newFolderName" 
              placeholder="新資料夾名稱" 
              @keyup.enter="createNewFolder"
              class="folder-input"
            />
            <Button 
              icon="pi pi-plus" 
              @click="createNewFolder" 
              :disabled="!newFolderName"
              class="create-btn"
              v-tooltip.bottom="'建立資料夾'"
            />
          </div>
        </div>
        <div class="toolbar-right">
          <MultiSelect
            v-model="filterTags"
            :options="allTags"
            placeholder="篩選標籤"
            class="tag-filter"
            :maxSelectedLabels="2"
          />
          <Dropdown
            v-model="sortOrder"
            :options="sortOptions"
            optionLabel="label"
            optionValue="value"
            class="sort-select"
            @change="loadData(currentFolder?._id)"
          />
          <div class="view-controls">
            <Button
              icon="pi pi-th-large"
              @click="viewMode = 'grid'"
              :class="{'active': viewMode === 'grid'}"
              class="view-btn"
              v-tooltip.bottom="'網格檢視'"
            />
            <Button 
              icon="pi pi-list" 
              @click="viewMode = 'list'" 
              :class="{'active': viewMode === 'list'}"
              class="view-btn"
              v-tooltip.bottom="'列表檢視'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Breadcrumb -->
    <div class="breadcrumb-section" v-if="breadcrumbItems.length">
      <Breadcrumb 
        :home="breadcrumbHome" 
        :model="breadcrumbItems" 
        class="custom-breadcrumb"
      />
    </div>

    <!-- Selection Bar -->
    <div class="selection-bar" v-if="selectedItems.length || combinedItems.length">
      <div class="selection-content">
        <div class="selection-left">
          <Checkbox 
            v-model="selectAll" 
            :binary="true" 
            class="select-all"
          />
          <span class="selection-text">
            <template v-if="selectedItems.length">
              已選擇 {{ selectedItems.length }} 項
            </template>
            <template v-else>
              全選 ({{ combinedItems.length }} 項)
            </template>
          </span>
        </div>
        <div class="selection-actions" v-if="selectedItems.length">
          <Button 
            icon="pi pi-users" 
            label="設定權限"
            class="batch-btn secondary"
            @click="openBatchDialog" 
            size="small"
          />
          <Button 
            icon="pi pi-download" 
            label="批次下載"
            class="batch-btn secondary"
            @click="downloadSelected" 
            :disabled="!selectedProducts.length"
            size="small"
          />
          <Button 
            icon="pi pi-folder-open" 
            label="移動至..."
            class="batch-btn secondary"
            @click="openMoveDialog" 
            :disabled="!selectedItems.length"
            size="small"
          />
          <Button 
            icon="pi pi-trash" 
            label="批次刪除"
            class="batch-btn danger"
            @click="confirmDeleteSelected" 
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <!-- Empty State -->
      <div v-if="!combinedItems.length && !loading" class="empty-state">
        <div class="empty-content">
          <i class="pi pi-box empty-icon"></i>
          <h3 class="empty-title">此資料夾為空</h3>
          <p class="empty-description">開始上傳成品或建立新資料夾來組織您的內容</p>
          <div class="empty-actions">
            <Button 
              icon="pi pi-upload" 
              label="上傳成品" 
              class="action-btn primary"
              @click="triggerUpload"
            />
            <Button 
              icon="pi pi-plus" 
              label="建立資料夾" 
              class="action-btn secondary"
              @click="focusFolderInput"
            />
          </div>
        </div>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <div class="items-grid">
          <div 
            v-for="item in combinedItems" 
            :key="item.id" 
            class="grid-item"
            :class="{ 'item-selected': selectedItems.includes(item.id) }"
          >
            <div class="item-card">
              <div class="card-header">
                <Checkbox 
                  v-model="selectedItems" 
                  :value="item.id" 
                  class="item-checkbox"
                />
                <template v-if="item.type === 'product'">
                  <SplitButton 
                    :model="getItemActions(item)"
                    @click.stop="showDetailFor(item)"
                    v-if="authStore.hasPermission('REVIEW_MANAGE')"
                    icon="pi pi-cog" 
                    class="item-menu-btn"
                    v-tooltip.left="'審核與設定'"
                  />
                  <Button v-else icon="pi pi-info-circle" class="item-menu-btn" @click.stop="showDetailFor(item)" v-tooltip.left="'詳細資訊'" />
                </template>
                <Button v-else icon="pi pi-ellipsis-v" class="item-menu-btn" @click.stop="showDetailFor(item)" v-tooltip.left="'詳細資訊'" />
              </div>
              <div class="card-body" @click="handleItemClick(item)">
                <div class="item-preview">
                  <i :class="getItemIcon(item)" class="preview-icon"></i>
                </div>
                <div class="item-info">
                  <h4 class="item-title">{{ item.name }}</h4>
                  <div class="item-meta">
                    <span class="meta-date">建於: {{ formatDate(item.createdAt) }}</span>
                    <span class="meta-creator">由: {{ item.creatorName || item.uploaderName }}</span>
                    <span class="meta-update" v-if="item.updatedBy && item.updatedAt !== item.createdAt">
                      更新: {{ formatDate(item.updatedAt) }} 由 {{ item.updatedBy.username }}
                    </span>
                  </div>
                  <div class="item-tags" v-if="item.tags?.length || item.reviewStatus">
                    <Tag v-if="item.reviewStatus" :value="item.reviewStatus" :severity="getStatusSeverity(item.reviewStatus)" class="item-tag status-tag" />
                    <Tag 
                      v-for="tag in item.tags.slice(0, 2)" 
                      :key="tag" 
                      :value="tag" 
                      class="item-tag"
                    />
                    <span v-if="item.tags.length > 2" class="tag-more">+{{ item.tags.length - 2 }}</span>
                  </div>
                </div>
              </div>
              <div class="card-footer" v-if="item.type !== 'folder'">
                <Button 
                  icon="pi pi-download" 
                  class="download-btn"
                  @click.stop="downloadSingleItem(item)"
                  v-tooltip.top="'下載'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="list-view">
        <div class="items-list">
          <div 
            v-for="item in combinedItems" 
            :key="item.id" 
            class="list-item"
            :class="{ 'item-selected': selectedItems.includes(item.id) }"
          >
            <div class="list-item-content">
              <div class="item-select">
                <Checkbox 
                  v-model="selectedItems" 
                  :value="item.id" 
                  class="item-checkbox"
                />
              </div>
              <div class="item-icon-wrapper">
                <i :class="getItemIcon(item)" class="item-icon"></i>
              </div>
              <div class="item-details" @click="handleItemClick(item)">
                <div class="details-main">
                  <h4 class="item-title">{{ item.name }}</h4>
                  <div class="item-tags" v-if="item.tags?.length || item.reviewStatus">
                    <Tag v-if="item.reviewStatus" :value="item.reviewStatus" :severity="getStatusSeverity(item.reviewStatus)" class="item-tag status-tag" />
                    <Tag 
                      v-for="tag in item.tags" 
                      :key="tag" 
                      :value="tag" 
                      class="item-tag"
                    />
                  </div>
                </div>
                <p class="item-description" v-if="item.description">{{ item.description }}</p>
                <div class="item-metadata">
                  <span class="metadata-item">
                    <i class="pi pi-calendar-plus"></i>
                    建立於 {{ formatDate(item.createdAt) }} 由 {{ item.creatorName || item.uploaderName }}
                  </span>
                  <span class="metadata-item" v-if="item.updatedBy && item.updatedAt !== item.createdAt">
                    <i class="pi pi-calendar-times"></i>
                    更新於 {{ formatDate(item.updatedAt) }} 由 {{ item.updatedBy.username }}
                  </span>
                </div>
              </div>
              <div class="item-actions">
                <template v-if="item.type === 'product'">
                  <SplitButton 
                    :model="getItemActions(item)"
                    @click.stop="showDetailFor(item)"
                    v-if="authStore.hasPermission('REVIEW_MANAGE')"
                    icon="pi pi-cog" 
                    class="action-btn secondary"
                    v-tooltip.left="'審核與設定'"
                  />
                  <Button v-else icon="pi pi-info-circle" class="action-btn secondary" @click.stop="showDetailFor(item)" v-tooltip.left="'詳細資訊'" />
                </template>
                <Button v-else icon="pi pi-info-circle" class="action-btn secondary" @click.stop="showDetailFor(item)" v-tooltip.left="'詳細資訊'" />
                
                <Button 
                  v-if="item.type !== 'folder'" 
                  icon="pi pi-download" 
                  class="action-btn primary"
                  @click.stop="downloadSingleItem(item)"
                  v-tooltip.left="'下載'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden File Upload -->
    <FileUpload 
      ref="fileUploadRef"
      mode="basic" 
      :auto="true" 
      :customUpload="true" 
      @uploader="uploadRequest" 
      :multiple="true"
      style="display: none;"
    />

    <!-- Dialogs -->
    <Dialog v-model:visible="showDetail" :header="detail.name" class="detail-dialog" :modal="true">
      <div class="dialog-form">
        <div class="form-field">
          <label for="detail-name" class="field-label">名稱</label>
          <InputText id="detail-name" v-model="detail.name" class="field-input" />
        </div>
        <div class="form-field">
          <label for="detail-desc" class="field-label">描述</label>
          <Textarea id="detail-desc" v-model="detail.description" :rows="4" class="field-input" />
        </div>
        <div class="form-field">
          <label for="detail-tags" class="field-label">標籤</label>
          <MultiSelect id="detail-tags" v-model="detail.tags" :options="allTags" :filter="true" class="field-input" />
        </div>
        <div v-if="reviewStages.length" class="form-field">
          <label class="field-label">審查關卡</label>
          <div v-for="stage in reviewStages" :key="stage._id" class="flex align-items-center mb-2">
            <Checkbox
              :modelValue="stage.completed"
              :binary="true"
              :inputId="stage._id"
              :disabled="!stage.responsible || stage.responsible._id !== authStore.user._id"
              @change="updateStageStatus(stage, $event)"
            />
            <label :for="stage._id" class="ml-2">{{ stage.name }}</label>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="取消" icon="pi pi-times" @click="showDetail = false" class="action-btn secondary"/>
          <Button label="儲存" icon="pi pi-check" @click="saveDetail" class="action-btn primary" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="batchDialog" header="批次設定權限" class="batch-dialog" :modal="true">
      <div class="dialog-form">
        <div class="form-field">
          <label class="field-label">選擇可查看的使用者</label>
          <MultiSelect 
            v-model="batchUsers" 
            :options="users" 
            optionLabel="username" 
            optionValue="_id" 
            placeholder="選擇使用者" 
            class="field-input"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="取消" icon="pi pi-times" @click="batchDialog = false" class="action-btn secondary"/>
          <Button label="確定" icon="pi pi-check" @click="applyBatch" class="action-btn primary" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="moveDialog" header="移動至" class="batch-dialog" :modal="true">
      <div class="dialog-form">
        <div class="form-field">
          <label class="field-label">選擇目標資料夾</label>
          <Dropdown v-model="targetFolder" :options="folderOptions" optionLabel="label" optionValue="value" placeholder="選擇資料夾" class="field-input" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="取消" icon="pi pi-times" @click="moveDialog = false" class="action-btn secondary"/>
          <Button label="確定" icon="pi pi-check" @click="applyMove" class="action-btn primary" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="previewVisible" :header="previewItem?.name" class="preview-dialog" :modal="true">
      <div class="preview-content">
        <img 
          v-if="isImage(previewItem)" 
          :src="previewItem.url" 
          class="preview-media" 
          alt="預覽圖片"
        />
        <video 
          v-else-if="isVideo(previewItem)" 
          controls 
          class="preview-media"
        >
          <source :src="previewItem.url" />
        </video>
        <div v-else class="preview-placeholder">
          <i :class="getItemIcon(previewItem)" class="placeholder-icon"></i>
          <p>無法預覽此檔案類型</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import '../assets/shared-library-styles.css';
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { fetchFolders, createFolder, updateFolder, getFolder, deleteFolder, updateFoldersViewers, reviewFolder, fetchFolderStages, updateFolderStage, moveFolders } from '../services/folders'
import { fetchProducts, updateProduct, deleteProduct, updateProductsViewers, getProductUrl, batchDownloadProducts, deleteProducts, reviewProduct, fetchProductStages, updateProductStage, startBatchDownload as startProductBatchDownload, getBatchDownloadProgress as getProductBatchDownloadProgress, moveProducts } from '../services/products'
import { useUploadStore } from '../stores/upload'
import { fetchUsers } from '../services/user'
import { fetchTags } from '../services/tags'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import MultiSelect from 'primevue/multiselect'
import Breadcrumb from 'primevue/breadcrumb'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import SplitButton from 'primevue/splitbutton'
import Toast from 'primevue/toast'
import Dropdown from 'primevue/dropdown'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uploadStore = useUploadStore()
const progressStore = useProgressStore()

const loading = ref(false)
const folders = ref([])
const products = ref([])
const currentFolder = ref(null)
const newFolderName = ref('')
const filterTags = ref([])
const sortOrder = ref('updatedAt_desc')
const sortOptions = [
  { label: '更新時間（新→舊）', value: 'updatedAt_desc' },
  { label: '更新時間（舊→新）', value: 'updatedAt_asc' },
  { label: '名稱（A→Z）', value: 'name_asc' },
  { label: '名稱（Z→A）', value: 'name_desc' }
]
const allTags = ref([])
const users = ref([])
const viewMode = ref('grid')
const selectedItems = ref([])
const fileUploadRef = ref(null)

const detail = ref({})
const showDetail = ref(false)
const batchDialog = ref(false)
const batchUsers = ref([])
const previewVisible = ref(false)
const previewItem = ref(null)
const reviewStages = ref([])
const moveDialog = ref(false)
const targetFolder = ref(null)
const folderOptions = ref([])

const combinedItems = computed(() => {
  const safeFolders = Array.isArray(folders.value) ? folders.value : [];
  const safeProducts = Array.isArray(products.value) ? products.value : [];
  return [
    ...safeFolders.filter(Boolean).map(f => ({ ...f, id: `folder-${f._id}`, type: 'folder', name: f.name })),
    ...safeProducts.filter(Boolean).map(p => ({ ...p, id: `product-${p._id}`, type: 'product', name: p.title || p.filename }))
  ];
})

const selectedProducts = computed(() => selectedItems.value.filter(id => id.startsWith('product-')).map(id => id.replace('product-', '')))

const selectAll = computed({
  get: () => combinedItems.value.length > 0 && selectedItems.value.length === combinedItems.value.length,
  set: val => { selectedItems.value = val ? combinedItems.value.map(i => i.id) : [] }
})

const breadcrumbHome = ref({ icon: 'pi pi-home', to: '/products' })
const breadcrumbItems = ref([])

const formatDate = d => d ? new Date(d).toLocaleDateString('zh-TW', { 
  year: 'numeric', 
  month: 'short', 
  day: 'numeric' 
}) : '—'

const isImage = item => item && item.name && /\.(png|jpe?g|gif|webp|svg)$/i.test(item.name)
const isVideo = item => item && item.name && /\.(mp4|webm|ogg|avi|mov)$/i.test(item.name)

const getItemIcon = (item) => {
  if (item.type === 'folder') return 'pi pi-folder'
  if (item.type === 'product') return 'pi pi-box'
  return 'pi pi-file'
}

const getStatusSeverity = (status) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'warning'
  }
}

const getItemActions = (item) => {
  return [
    {
      label: '通過',
      icon: 'pi pi-check',
      command: () => handleReview(item, 'approved')
    },
    {
      label: '拒絕',
      icon: 'pi pi-times',
      command: () => handleReview(item, 'rejected')
    }
  ]
}

const triggerUpload = () => {
  fileUploadRef.value?.$el.querySelector('input[type="file"]')?.click()
}

const focusFolderInput = () => {
  document.querySelector('.folder-input')?.focus()
}

async function handleReview(item, status) {
  try {
    const id = item._id;
    if (item.type === 'folder') {
      await reviewFolder(id, status);
    } else {
      await reviewProduct(id, status);
    }
    toast.add({ severity: 'success', summary: 'Success', detail: `Item ${status}`, life: 3000 });
    loadData(currentFolder.value?._id);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status', life: 3000 });
  }
}

async function updateStageStatus(stage, event) {
  try {
    const completed = event.target.checked;
    if (detail.value.type === 'folder') {
      await updateFolderStage(detail.value._id, stage._id, completed);
    } else {
      await updateProductStage(detail.value._id, stage._id, completed);
    }
    stage.completed = completed; // Optimistic update
    toast.add({ severity: 'success', summary: 'Success', detail: 'Stage status updated', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update stage', life: 3000 });
    stage.completed = !event.target.checked; // Revert on failure
  }
}

async function loadData(folderId = null) {
  loading.value = true
  try {
    const [folderData, productData, currentFolderData] = await Promise.all([
      fetchFolders(folderId, filterTags.value, 'edited', false, false, sortOrder.value),
      fetchProducts(folderId, filterTags.value, false, sortOrder.value),
      folderId ? getFolder(folderId) : Promise.resolve(null)
    ])
    folders.value = folderData
    products.value = productData
    currentFolder.value = currentFolderData
    buildBreadcrumb(currentFolderData)
  } catch (error) {
    console.error('[ProductLibrary] Failed to load data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 })
  } finally {
    loading.value = false
    selectedItems.value = []
  }
}

function buildBreadcrumb(folder) {
  const items = []
  let current = folder
  while (current) {
    items.unshift({ label: current.name, to: { name: 'Products', params: { folderId: current._id } } })
    current = current.parent
  }
  breadcrumbItems.value = items
}

function goUp() {
  if (currentFolder.value?.parentId) {
    router.push({ name: 'Products', params: { folderId: currentFolder.value.parentId } })
  } else {
    router.push({ name: 'Products' })
  }
}

async function createNewFolder() {
  if (!newFolderName.value.trim()) return
  try {
    await createFolder({ name: newFolderName.value, parentId: currentFolder.value?._id, type: 'edited' })
    toast.add({ severity: 'success', summary: 'Success', detail: 'Folder created', life: 3000 })
    newFolderName.value = ''
    loadData(currentFolder.value?._id)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create folder', life: 3000 })
  }
}

const uploadRequest = async (event) => {
  const files = Array.isArray(event.files) ? event.files : [event.files]
  files.forEach(file => {
    uploadStore.addUploadTask(file, { folderId: currentFolder.value?._id, extraData: { type: 'edited' } })
  })
  loadData(currentFolder.value?._id)
}

async function pollProgress(progressId, name) {
  const getProgress = getProductBatchDownloadProgress;
  const taskId = `dl-${progressId}`;
  progressStore.addTask({ id: taskId, name, status: 'compressing', progress: 0 });

  const poll = async (maxAttempts = 80, interval = 1500) => { // Approx 2 minutes
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const progress = await getProgress(progressId);

        if (progress?.url) {
          progressStore.updateTaskProgress(taskId, 100);
          progressStore.updateTaskStatus(taskId, 'success');
          window.open(progress.url, '_blank');
          return; // Success
        }

        if (progress?.error) {
          throw new Error(progress.error);
        }
        
        if (progress?.percent) {
          progressStore.updateTaskProgress(taskId, progress.percent);
        }

        await new Promise(r => setTimeout(r, interval));
      } catch (error) {
        progressStore.updateTaskStatus(taskId, 'error', error.message || '輪詢進度時發生錯誤');
        return; // Stop polling on error
      }
    }
    // If loop finishes without success or error
    progressStore.updateTaskStatus(taskId, 'error', '操作超時');
  };

  poll();
}

async function downloadSingleItem(item) {
  try {
    const url = await getProductUrl(item._id, true); // download=true
    window.open(url, '_blank');
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: '下載失敗', life: 3000 });
  }
}

async function downloadSelected() {
  if (!selectedProducts.value.length) return;
  try {
    const { progressId } = await startProductBatchDownload(selectedProducts.value);
    pollProgress(progressId, '批量下載');
  } catch (error) {
     toast.add({ severity: 'error', summary: 'Error', detail: '無法開始下載', life: 3000 });
  }
}

async function previewProduct(item) {
  try {
    const url = await getProductUrl(item._id);
    previewItem.value = { ...item, url };
    previewVisible.value = true;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not load product for preview', life: 3000 });
  }
}

function handleItemClick(item) {
  if (item.type === 'folder') {
    router.push({ name: 'Products', params: { folderId: item._id } })
  } else {
    previewProduct(item)
  }
}

async function showDetailFor(item) {
  detail.value = { 
    ...item,
    tags: item.tags?.map(t => t.name) || []
  };
  reviewStages.value = [];
  showDetail.value = true;
  try {
    if (item.type === 'folder') {
      reviewStages.value = await fetchFolderStages(item._id);
    } else {
      reviewStages.value = await fetchProductStages(item._id);
    }
  } catch (error) {
    console.error("Failed to fetch review stages", error);
  }
}

async function saveDetail() {
  try {
    const payload = {
      name: detail.value.name,
      description: detail.value.description,
      tags: detail.value.tags
    };
    if (detail.value.type === 'folder') {
      await updateFolder(detail.value._id, payload);
    } else {
      await updateProduct(detail.value._id, { ...payload, title: detail.value.name });
    }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Saved', life: 3000 });
    showDetail.value = false;
    loadData(currentFolder.value?._id);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Save failed', life: 3000 });
  }
}

function openBatchDialog() {
  batchUsers.value = [];
  batchDialog.value = true;
}

async function openMoveDialog() {
  try {
    const all = await fetchFolders(null, [], 'edited', true);
    folderOptions.value = all.map(f => ({ value: f._id, label: buildPath(f, all) }));
    targetFolder.value = null;
    moveDialog.value = true;
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: '無法取得資料夾列表', life: 3000 });
  }
}

function buildPath(folder, list) {
  let name = folder.name;
  let current = folder;
  while (current.parentId) {
    const parent = list.find(f => f._id === current.parentId);
    if (!parent) break;
    name = parent.name + '/' + name;
    current = parent;
  }
  return name;
}

async function applyBatch() {
  const productIds = selectedItems.value.filter(id => id.startsWith('product-')).map(id => id.replace('product-', ''));
  const folderIds = selectedItems.value.filter(id => id.startsWith('folder-')).map(id => id.replace('folder-', ''));
  try {
    if (productIds.length) await updateProductsViewers(productIds, batchUsers.value);
    if (folderIds.length) await updateFoldersViewers(folderIds, batchUsers.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Batch update successful', life: 3000 });
    batchDialog.value = false;
    selectedItems.value = [];
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Batch update failed', life: 3000 });
  }
}

async function applyMove() {
  const productIds = selectedItems.value.filter(id => id.startsWith('product-')).map(id => id.replace('product-', ''))
  const folderIds = selectedItems.value.filter(id => id.startsWith('folder-')).map(id => id.replace('folder-', ''))
  try {
    if (productIds.length) await moveProducts(productIds, targetFolder.value)
    if (folderIds.length) await moveFolders(folderIds, targetFolder.value)
    toast.add({ severity: 'success', summary: '成功', detail: '已移動', life: 3000 })
    moveDialog.value = false
    selectedItems.value = []
    loadData(currentFolder.value?._id)
  } catch (error) {
    toast.add({ severity: 'error', summary: '錯誤', detail: '移動失敗', life: 3000 })
  }
}

function confirmDeleteSelected() {
  confirm.require({
    message: `您確定要刪除這 ${selectedItems.value.length} 個項目嗎？此操作無法復原。`,
    header: '確認刪除',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const productIds = selectedItems.value.filter(id => id.startsWith('product-')).map(id => id.replace('product-', ''));
      const folderIds = selectedItems.value.filter(id => id.startsWith('folder-')).map(id => id.replace('folder-', ''));
      
      try {
        const deletePromises = [];
        if (productIds.length) {
          productIds.forEach(id => deletePromises.push(deleteProduct(id)));
        }
        if (folderIds.length) {
          folderIds.forEach(id => deletePromises.push(deleteFolder(id)));
        }
        
        await Promise.all(deletePromises);
        
        toast.add({ severity: 'success', summary: '成功', detail: '選取的項目已成功刪除', life: 3000 });
        loadData(currentFolder.value?._id); // Refresh the data
        selectedItems.value = []; // Clear selection
      } catch (error) {
        toast.add({ severity: 'error', summary: '錯誤', detail: '刪除過程中發生錯誤', life: 3000 });
      }
    }
  });
}

onMounted(() => {
  loadData(route.params.folderId || null)
  fetchTags().then(tags => allTags.value = tags.map(t => t.name))
  fetchUsers().then(u => users.value = u)
})

watch(() => route.params.folderId, (newId) => loadData(newId || null))
watch(filterTags, () => loadData(currentFolder.value?._id), { deep: true })
watch(sortOrder, () => loadData(currentFolder.value?._id))
</script>

<style scoped>
.library-container {
  padding: 0;
  max-width: none;
}

/* Header Section */
.library-header {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-bottom: 1px solid var(--surface-border);
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-title {
  flex: 1;
}

.title-text {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;
}

.title-subtitle {
  margin: 0;
  font-size: 1.125rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Toolbar Section */
.toolbar-section {
  margin-bottom: 2rem;
}

.toolbar-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-btn {
  width: 3rem;
  height: 3rem;
  background: var(--surface-a);
  border: 1px solid var(--surface-border);
  color: var(--text-color);
  border-radius: 12px;
}

.nav-btn:hover:not(:disabled) {
  background: var(--surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.folder-creator {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.folder-input {
  min-width: 250px;
  height: 3rem;
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  background: var(--surface-ground);
  color: var(--text-color);
  padding: 0 1rem;
}

.folder-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.create-btn {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  border-radius: 12px;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.tag-filter {
  min-width: 200px;
  height: 3rem;
}

.view-controls {
  display: flex;
  gap: 0.5rem;
  background: var(--surface-a);
  border-radius: 12px;
  padding: 0.25rem;
}

.view-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: none;
  color: var(--text-color-secondary);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.view-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.view-btn:hover:not(.active) {
  background: var(--surface-hover);
  color: var(--text-color);
}

/* Breadcrumb Section */
.breadcrumb-section {
  margin-bottom: 1.5rem;
}

.custom-breadcrumb {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Selection Bar */
.selection-bar {
  margin-bottom: 2rem;
}

.selection-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.selection-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.select-all {
  transform: scale(1.2);
}

.selection-text {
  font-weight: 600;
  color: var(--text-color);
}

.selection-actions {
  display: flex;
  gap: 0.75rem;
}

/* Content Area */
.content-area {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
}

.empty-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.empty-description {
  margin: 0 0 2rem 0;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Grid View */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.grid-item {
  transition: all 0.3s ease;
}

.item-selected .item-card {
  transform: scale(0.98);
  box-shadow: 0 0 0 2px var(--primary-color);
}

.item-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-a);
}

.item-checkbox {
  transform: scale(1.1);
}

.item-menu-btn {
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  color: var(--text-color-secondary);
  border-radius: 6px;
}

.item-menu-btn:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.card-body {
  flex: 1;
  padding: 1.5rem 1.25rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.item-preview {
  margin-bottom: 1.5rem;
}

.preview-icon {
  font-size: 3rem;
  color: #667eea;
}

.item-info {
  width: 100%;
}

.item-title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  word-break: break-word;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.item-tag {
  font-size: 0.75rem;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.status-tag {
  font-weight: 600;
}

.tag-more {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  background: var(--surface-a);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.card-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--surface-border);
  background: var(--surface-a);
  display: flex;
  justify-content: center;
}

.download-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  border-radius: 8px;
}

.download-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* List View */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-item {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.list-item:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.list-item.item-selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.list-item-content {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  gap: 1.5rem;
}

.item-select {
  flex-shrink: 0;
  padding-top: 0.25rem;
}

.item-icon-wrapper {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  font-size: 1.5rem;
  color: #667eea;
}

.item-details {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.details-main {
  margin-bottom: 0.75rem;
}

.item-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  word-break: break-word;
}

.item-description {
  margin: 0 0 0.75rem 0;
  color: var(--text-color-secondary);
  line-height: 1.5;
  font-size: 0.875rem;
}

.item-metadata {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Button Styles */
.action-btn {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  padding: 0.75rem 1.5rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.action-btn.secondary {
  background: var(--surface-a);
  color: var(--text-color);
  border: 1px solid var(--surface-border);
}

.action-btn.secondary:hover {
  background: var(--surface-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.action-btn.danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
}

.batch-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 8px;
}

/* Dialog Styles */
.detail-dialog,
.batch-dialog {
  width: 90vw;
  max-width: 500px;
}

.preview-dialog {
  width: 90vw;
  max-width: 800px;
}

.dialog-form {
  padding: 1rem 0;
}

.form-field {
  margin-bottom: 1.5rem;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
}

.field-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  background: var(--surface-ground);
  color: var(--text-color);
  padding: 0.75rem;
}

.field-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background: var(--surface-a);
  border-radius: 12px;
}

.preview-media {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.preview-placeholder {
  text-align: center;
  color: var(--text-color-secondary);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
/* Responsive Design */
@media screen and (max-width: 1200px) {
  .header-content,
  .toolbar-content,
  .selection-content,
  .content-area,
  .custom-breadcrumb {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
}

@media screen and (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .toolbar-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }
  
  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .folder-creator {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .folder-input {
    min-width: auto;
    width: 100%;
  }
  
  .toolbar-right {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .tag-filter {
    min-width: auto;
    width: 100%;
  }
  
  .view-controls {
    align-self: center;
  }
  
  .selection-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .selection-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .list-item-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .item-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .header-content,
  .toolbar-content,
  .selection-content,
  .content-area,
  .custom-breadcrumb {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media screen and (max-width: 480px) {
  .title-text {
    font-size: 2rem;
  }
  
  .title-subtitle {
    font-size: 1rem;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .batch-btn {
    flex: 1;
    justify-content: center;
  }
  
  .empty-actions {
    flex-direction: column;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Print Styles */
@media print {
  .library-header,
  .toolbar-section,
  .selection-bar,
  .card-header,
  .card-footer,
  .item-actions {
    display: none !important;
  }
  
  .item-card,
  .list-item {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }
}
</style>
