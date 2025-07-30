<template>
  <div class="asset-library">
    <Toast position="bottom-right" group="br" />
    <Toast position="bottom-right" /> 
    <Toast position="top-center" group="upload-batch" />
    
    <!-- Responsive Toolbar -->
    <div class="toolbar-container">
      <Toolbar class="responsive-toolbar">
        <template #start>
          <div class="toolbar-start">
            <Button 
              icon="pi pi-arrow-left" 
              class="p-button-secondary toolbar-btn" 
              @click="goUp" 
              :disabled="!currentFolder"
              v-tooltip="'返回上層'"
            />
            <div class="folder-input-group">
              <InputText 
                v-model="newFolderName" 
                placeholder="新資料夾名稱" 
                @keyup.enter="createNewFolder"
                class="folder-input"
              />
              <Button 
                label="建立" 
                icon="pi pi-plus" 
                @click="createNewFolder" 
                :disabled="!newFolderName"
                class="create-btn"
              />
            </div>
          </div>
          <div class="upload-buttons">
            <FileUpload 
              mode="basic" 
              :auto="true" 
              :customUpload="true" 
              @uploader="uploadRequest" 
              chooseLabel="上傳檔案" 
              :disabled="!currentFolder"
              class="upload-btn"
            />
            <FileUpload 
              mode="basic" 
              :auto="true" 
              :customUpload="true" 
              @uploader="uploadRequest" 
              chooseLabel="批量上傳" 
              :disabled="!currentFolder" 
              :multiple="true"
              class="upload-btn batch-upload"
            />
          </div>
        </template>
        <template #end>
          <div class="toolbar-end">
            <MultiSelect 
              v-model="filterTags" 
              :options="allTags" 
              placeholder="標籤篩選" 
              class="tag-filter"
            />
          </div>
        </template>
      </Toolbar>
    </div>

    <!-- Breadcrumb Navigation -->
    <div class="breadcrumb-container">
      <Breadcrumb 
        :home="breadcrumbHome" 
        :model="breadcrumbItems" 
        class="responsive-breadcrumb"
      />
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="action-left">
        <Checkbox v-model="selectAll" :binary="true" class="select-all-checkbox" />
        <span class="selection-count" v-if="selectedItems.length">
          已選擇 {{ selectedItems.length }} 項
        </span>
        <div class="batch-actions">
          <Button 
            label="批次設定" 
            icon="pi pi-users" 
            class="p-button-secondary batch-btn" 
            @click="openBatchDialog" 
            :disabled="!selectedItems.length"
            size="small"
          />
          <Button 
            label="批次下載" 
            icon="pi pi-download" 
            class="p-button-secondary batch-btn" 
            @click="downloadSelected" 
            :disabled="!selectedAssets.length"
            size="small"
          />
          <Button 
            label="批次刪除" 
            icon="pi pi-trash" 
            class="p-button-danger batch-btn" 
            @click="confirmDeleteSelected" 
            :disabled="!selectedItems.length"
            size="small"
          />
        </div>
      </div>
      <div class="action-right">
        <div class="view-toggle">
          <Button 
            icon="pi pi-table" 
            @click="viewMode = 'grid'" 
            :class="{'p-button-primary': viewMode === 'grid', 'p-button-secondary': viewMode !== 'grid'}"
            class="view-btn"
            v-tooltip="'網格檢視'"
          />
          <Button 
            icon="pi pi-list" 
            @click="viewMode = 'list'" 
            :class="{'p-button-primary': viewMode === 'list', 'p-button-secondary': viewMode !== 'list'}"
            class="view-btn"
            v-tooltip="'列表檢視'"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!combinedItems.length && !loading" class="empty-state">
      <i class="pi pi-inbox empty-icon"></i>
      <h3>此資料夾為空</h3>
      <p>開始上傳檔案或建立新資料夾</p>
    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid-view">
      <div class="grid-container">
        <div v-for="item in combinedItems" :key="item.id" class="grid-item">
          <div class="item-card">
            <div class="card-header">
              <Checkbox 
                v-model="selectedItems" 
                :value="item.id" 
                @click.stop 
                class="item-checkbox"
              />
              <Button 
                icon="pi pi-ellipsis-v" 
                class="p-button-text p-button-rounded item-menu-btn" 
                @click.stop="showDetailFor(item)"
                v-tooltip="'詳細資訊'"
              />
            </div>
            <div class="card-content" @click="handleItemClick(item)">
              <div class="item-icon">
                <i :class="item.type === 'folder' ? 'pi pi-folder' : 'pi pi-file'"></i>
              </div>
              <div class="item-info">
                <h4 class="item-name">{{ item.name }}</h4>
                <div class="item-tags">
                  <Tag v-for="tag in item.tags" :key="tag" :value="tag" class="item-tag" />
                </div>
                <div class="item-meta">
                  <span class="item-date">{{ formatDate(item.createdAt) }}</span>
                  <span class="item-creator">{{ item.creatorName || item.uploaderName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else-if="viewMode === 'list'" class="list-view">
      <div class="list-container">
        <div v-for="item in combinedItems" :key="item.id" class="list-item">
          <div class="list-item-content">
            <div class="item-select">
              <Checkbox 
                v-model="selectedItems" 
                :value="item.id" 
                class="item-checkbox"
              />
            </div>
            <div class="item-icon-wrapper">
              <i :class="['item-icon-large', item.type === 'folder' ? 'pi pi-folder' : 'pi pi-file']"></i>
            </div>
            <div class="item-details" @click="handleItemClick(item)">
              <div class="item-main-info">
                <h4 class="item-title">{{ item.name }}</h4>
                <div class="item-tags-row">
                  <Tag v-for="tag in item.tags" :key="tag" :value="tag" class="item-tag" />
                </div>
              </div>
              <div class="item-description">{{ item.description }}</div>
              <div class="item-metadata">
                <span class="metadata-item">
                  <i class="pi pi-calendar"></i>
                  {{ formatDate(item.createdAt) }}
                </span>
                <span class="metadata-item">
                  <i class="pi pi-user"></i>
                  {{ item.creatorName || item.uploaderName }}
                </span>
              </div>
            </div>
            <div class="item-actions">
              <Button 
                icon="pi pi-info-circle" 
                class="p-button-rounded p-button-secondary action-btn" 
                @click="showDetailFor(item)"
                v-tooltip="'詳細資訊'"
              />
              <Button 
                v-if="item.type !== 'folder'" 
                icon="pi pi-download" 
                class="p-button-rounded p-button-help action-btn" 
                @click="downloadSingleItem(item)"
                v-tooltip="'下載'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <Dialog v-model:visible="showDetail" :header="detail.name" class="detail-dialog" :modal="true">
      <div class="dialog-content">
        <div class="field">
          <label for="detail-name">名稱</label>
          <InputText id="detail-name" v-model="detail.name" class="w-full" />
        </div>
        <div class="field">
          <label for="detail-desc">描述</label>
          <Textarea id="detail-desc" v-model="detail.description" :rows="4" class="w-full" />
        </div>
        <div class="field">
          <label for="detail-tags">標籤</label>
          <MultiSelect id="detail-tags" v-model="detail.tags" :options="allTags" :filter="true" class="w-full" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button label="取消" icon="pi pi-times" @click="showDetail = false" class="p-button-text"/>
          <Button label="儲存" icon="pi pi-check" @click="saveDetail" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="batchDialog" header="批次設定可查看者" class="batch-dialog" :modal="true">
      <div class="dialog-content">
        <MultiSelect 
          v-model="batchUsers" 
          :options="users" 
          optionLabel="username" 
          optionValue="_id" 
          placeholder="選擇使用者" 
          class="w-full" 
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button label="取消" icon="pi pi-times" @click="batchDialog = false" class="p-button-text"/>
          <Button label="確定" icon="pi pi-check" @click="applyBatch" />
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
          v-else-if="previewItem" 
          controls 
          class="preview-media"
        >
          <source :src="previewItem.url" />
        </video>
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
import { fetchFolders, createFolder, updateFolder, getFolder, deleteFolder, updateFoldersViewers } from '../services/folders'
import { fetchAssets, updateAsset, deleteAsset, updateAssetsViewers, getAssetUrl, startBatchDownload as startAssetBatchDownload, getBatchDownloadProgress as getAssetBatchDownloadProgress } from '../services/assets'
import { useUploadStore } from '../stores/upload'
import { fetchUsers } from '../services/user'
import { fetchTags } from '../services/tags'
import { useProgressStore } from '../stores/progress'

import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import MultiSelect from 'primevue/multiselect'
import Breadcrumb from 'primevue/breadcrumb'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()
const uploadStore = useUploadStore()

const loading = ref(false)
const folders = ref([])
const assets = ref([])
const currentFolder = ref(null)
const newFolderName = ref('')
const filterTags = ref([])
const allTags = ref([])
const users = ref([])
const viewMode = ref('grid')
const selectedItems = ref([])

const detail = ref({})
const showDetail = ref(false)
const batchDialog = ref(false)
const batchUsers = ref([])
const previewVisible = ref(false)
const previewItem = ref(null)

const combinedItems = computed(() => {
  const safeFolders = Array.isArray(folders.value) ? folders.value : [];
  const safeAssets = Array.isArray(assets.value) ? assets.value : [];
  return [
    ...safeFolders.filter(Boolean).map(f => ({ ...f, id: `folder-${f._id}`, type: 'folder', name: f.name })),
    ...safeAssets.filter(Boolean).map(a => ({ ...a, id: `asset-${a._id}`, type: 'asset', name: a.title || a.filename }))
  ];
})

const selectedAssets = computed(() => selectedItems.value.filter(id => id.startsWith('asset-')).map(id => id.replace('asset-', '')))

const selectAll = computed({
  get: () => combinedItems.value.length > 0 && selectedItems.value.length === combinedItems.value.length,
  set: val => { selectedItems.value = val ? combinedItems.value.map(i => i.id) : [] }
})

const breadcrumbHome = ref({ icon: 'pi pi-home', to: '/assets' })
const breadcrumbItems = ref([])

const formatDate = d => d ? new Date(d).toLocaleString() : '—'
const isImage = item => item && item.name && /\.(png|jpe?g|gif|webp)$/i.test(item.name)
const isVideo = item => item && item.name && /\.(mp4|webm|ogg)$/i.test(item.name)

async function loadData(folderId = null) {
  loading.value = true
  try {
    const [folderData, assetData, currentFolderData] = await Promise.all([
      fetchFolders(folderId, filterTags.value, 'raw'),
      folderId ? fetchAssets(folderId, 'raw', filterTags.value) : Promise.resolve([]),
      folderId ? getFolder(folderId) : Promise.resolve(null)
    ])
    folders.value = folderData
    assets.value = assetData
    currentFolder.value = currentFolderData
    buildBreadcrumb(currentFolderData)
  } catch (error) {
    console.error('[AssetLibrary] Failed to load data:', error);
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
    items.unshift({ label: current.name, to: { name: 'Assets', params: { folderId: current._id } } })
    current = current.parent
  }
  breadcrumbItems.value = items
}

function goUp() {
  if (currentFolder.value?.parentId) {
    router.push({ name: 'Assets', params: { folderId: currentFolder.value.parentId } })
  } else {
    router.push({ name: 'Assets' })
  }
}

async function createNewFolder() {
  if (!newFolderName.value.trim()) return
  try {
    await createFolder({ name: newFolderName.value, parentId: currentFolder.value?._id, type: 'raw' })
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
    uploadStore.addUploadTask(file, { folderId: currentFolder.value?._id, extraData: { type: 'raw' } })
  })
  loadData(currentFolder.value?._id)
}

async function pollProgress(progressId, name) {
  const getProgress = getAssetBatchDownloadProgress;
  const taskId = `dl-${progressId}`;
  progressStore.addTask({ id: taskId, name, status: 'compressing', progress: 0 });

  const poll = async (maxAttempts = 80, interval = 1500) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const progress = await getProgress(progressId);

        if (progress?.url) {
          progressStore.updateTaskProgress(taskId, 100);
          progressStore.updateTaskStatus(taskId, 'success');
          window.open(progress.url, '_blank');
          return;
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
        return;
      }
    }
    progressStore.updateTaskStatus(taskId, 'error', '操作超時');
  };

  poll();
}

async function downloadSingleItem(item) {
  try {
    const url = await getAssetUrl(item._id, true);
    if (isVideo(item)) {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', item.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank');
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: '下載失敗', life: 3000 });
  }
}

async function downloadSelected() {
  if (!selectedAssets.value.length) return;
  try {
    const { progressId } = await startAssetBatchDownload(selectedAssets.value);
    pollProgress(progressId, '批量下載');
  } catch (error) {
     toast.add({ severity: 'error', summary: 'Error', detail: '無法開始下載', life: 3000 });
  }
}

async function previewAsset(item) {
  try {
    const url = await getAssetUrl(item._id);
    previewItem.value = { ...item, url };
    previewVisible.value = true;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not load asset for preview', life: 3000 });
  }
}

function handleItemClick(item) {
  if (item.type === 'folder') {
    router.push({ name: 'Assets', params: { folderId: item._id } })
  } else {
    previewAsset(item)
  }
}

function showDetailFor(item) {
  detail.value = { ...item };
  showDetail.value = true;
}

async function saveDetail() {
  try {
    if (detail.value.type === 'folder') {
      await updateFolder(detail.value._id, { name: detail.value.name, description: detail.value.description, tags: detail.value.tags });
    } else {
      await updateAsset(detail.value._id, { title: detail.value.name, description: detail.value.description, tags: detail.value.tags });
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

async function applyBatch() {
  const assetIds = selectedItems.value.filter(id => id.startsWith('asset-')).map(id => id.replace('asset-', ''));
  const folderIds = selectedItems.value.filter(id => id.startsWith('folder-')).map(id => id.replace('folder-', ''));
  try {
    if (assetIds.length) await updateAssetsViewers(assetIds, batchUsers.value);
    if (folderIds.length) await updateFoldersViewers(folderIds, batchUsers.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Batch update successful', life: 3000 });
    batchDialog.value = false;
    selectedItems.value = [];
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Batch update failed', life: 3000 });
  }
}

function confirmDeleteSelected() {
  confirm.require({
    message: `您確定要刪除這 ${selectedItems.value.length} 個項目嗎？此操作無法復原。`,
    header: '確認刪除',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const assetIds = selectedItems.value.filter(id => id.startsWith('asset-')).map(id => id.replace('asset-', ''));
      const folderIds = selectedItems.value.filter(id => id.startsWith('folder-')).map(id => id.replace('folder-', ''));
      
      try {
        const deletePromises = [];
        if (assetIds.length) {
          assetIds.forEach(id => deletePromises.push(deleteAsset(id)));
        }
        if (folderIds.length) {
          folderIds.forEach(id => deletePromises.push(deleteFolder(id)));
        }
        
        await Promise.all(deletePromises);
        
        toast.add({ severity: 'success', summary: '成功', detail: '選取的項目已成功刪除', life: 3000 });
        loadData(currentFolder.value?._id);
        selectedItems.value = [];
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
</script>

<style scoped>
.asset-library {
  max-width: 1400px;
  margin: 0 auto;
}

/* Toolbar Styles */
.toolbar-container {
  margin-bottom: 1.5rem;
}

.responsive-toolbar {
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-start {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.folder-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.folder-input {
  min-width: 200px;
}

.upload-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.toolbar-end {
  display: flex;
  align-items: center;
}

.tag-filter {
  min-width: 200px;
}

/* Breadcrumb Styles */
.breadcrumb-container {
  margin-bottom: 1.5rem;
}

.responsive-breadcrumb {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1rem;
}

/* Action Bar Styles */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.select-all-checkbox {
  margin-right: 0.5rem;
}

.selection-count {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.batch-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-right {
  display: flex;
  align-items: center;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
}

.view-btn {
  width: 2.5rem;
  height: 2.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: var(--text-color-secondary);
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Grid View Styles */
.grid-view {
  margin-bottom: 2rem;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.grid-item {
  height: 100%;
}

.item-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.card-content {
  flex: 1;
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.item-icon {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.item-info {
  width: 100%;
}

.item-name {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  word-break: break-word;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.item-tag {
  font-size: 0.75rem;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* List View Styles */
.list-view {
  margin-bottom: 2rem;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-item {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.list-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.list-item-content {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  gap: 1rem;
}

.item-select {
  flex-shrink: 0;
}

.item-icon-wrapper {
  flex-shrink: 0;
}

.item-icon-large {
  font-size: 2.5rem;
  color: var(--primary-color);
}

.item-details {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.item-main-info {
  margin-bottom: 0.75rem;
}

.item-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  word-break: break-word;
}

.item-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.item-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.item-metadata {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  width: 2.5rem;
  height: 2.5rem;
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

.dialog-content {
  padding: 1rem 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.preview-media {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .toolbar-start {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .folder-input-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .folder-input {
    min-width: auto;
    width: 100%;
  }
  
  .upload-buttons {
    justify-content: center;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-left {
    justify-content: center;
  }
  
  .batch-actions {
    justify-content: center;
  }
  
  .action-right {
    justify-content: center;
  }
  
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .list-item-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .item-actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media screen and (max-width: 480px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
  
  .batch-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .batch-btn {
    width: 100%;
    justify-content: center;
  }
  
  .upload-buttons {
    flex-direction: column;
  }
  
  .upload-btn {
    width: 100%;
  }
  
  .tag-filter {
    min-width: auto;
    width: 100%;
  }
  
  .item-metadata {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Print Styles */
@media print {
  .toolbar-container,
  .action-bar,
  .item-actions,
  .card-header {
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
