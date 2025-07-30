<template>
  <div class="shared-library-container">
    <Toast position="bottom-right" group="br" />
    <Toast position="bottom-right" />
    <Toast position="top-center" group="upload-batch" />

    <div class="header">
      <div class="title">成品區</div>
      <div class="subtitle">管理您的完成作品和最終產出</div>
    </div>

    <Toolbar class="toolbar">
      <template #start>
        <Button icon="pi pi-arrow-left" class="p-button-secondary mr-2" @click="goUp" :disabled="!currentFolder" />
        <div class="p-inputgroup">
          <InputText v-model="newFolderName" placeholder="新資料夾名稱" @keyup.enter="createNewFolder" />
          <Button label="建立" icon="pi pi-plus" @click="createNewFolder" :disabled="!newFolderName" />
        </div>
        <FileUpload mode="basic" :auto="true" :customUpload="true" @uploader="uploadRequest" class="ml-2" chooseLabel="上傳單一檔案" :disabled="!currentFolder" />
        <FileUpload mode="basic" :auto="true" :customUpload="true" @uploader="uploadRequest" class="ml-2" chooseLabel="批量上傳" :disabled="!currentFolder" :multiple="true" />
      </template>
      <template #end>
        <MultiSelect v-model="filterTags" :options="allTags" placeholder="標籤篩選" class="w-full md:w-20rem" />
      </template>
    </Toolbar>

    <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" class="breadcrumb" />

    <div class="actions">
      <div class="left">
        <Checkbox v-model="selectAll" :binary="true" class="mr-2" />
        <Button label="批次設定" icon="pi pi-users" class="p-button-secondary mr-2" @click="openBatchDialog" :disabled="!selectedItems.length" />
        <Button label="批次下載" icon="pi pi-download" class="p-button-secondary mr-2" @click="downloadSelected" :disabled="!selectedProducts.length" />
        <Button label="移動至..." icon="pi pi-folder-open" class="p-button-secondary mr-2" @click="openMoveDialog" :disabled="!selectedItems.length" />
        <Button label="批次刪除" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelected" :disabled="!selectedItems.length" />
      </div>
      <div class="right">
        <Button icon="pi pi-table" @click="viewMode = 'grid'" :class="{ 'p-button-primary': viewMode === 'grid', 'p-button-secondary': viewMode !== 'grid' }" />
        <Button icon="pi pi-list" @click="viewMode = 'list'" :class="{ 'p-button-primary': viewMode === 'list', 'p-button-secondary': viewMode !== 'list' }" />
      </div>
    </div>

    <div v-if="!combinedItems.length && !loading" class="empty-message">
      <i class="pi pi-inbox" style="font-size: 2rem"></i>
      <p>此資料夾為空</p>
    </div>

    <div v-if="viewMode === 'grid'" class="grid-view">
      <div v-for="item in combinedItems" :key="item.id" class="grid-item">
        <div class="item-container">
          <div class="item-header">
            <Checkbox v-model="selectedItems" :value="item.id" @click.stop />
            <SplitButton
              icon="pi pi-cog"
              :model="getItemActions(item)"
              v-if="authStore.hasPermission('REVIEW_MANAGE')"
              @click="showDetailFor(item)"
              class="p-button-sm p-button-text"
            ></SplitButton>
            <Button v-else icon="pi pi-info-circle" class="p-button-rounded p-button-text" @click.stop="showDetailFor(item)"></Button>
          </div>
          <div class="item-content" @click="handleItemClick(item)">
            <i :class="['item-icon', item.type === 'folder' ? 'pi pi-folder' : 'pi pi-box']"></i>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-tags">
              <Tag :value="item.reviewStatus" :severity="getStatusSeverity(item.reviewStatus)" />
              <Tag v-for="tag in item.tags" :key="tag" :value="tag"></Tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="viewMode === 'list'" class="list-view">
      <div v-for="item in combinedItems" :key="item.id" class="list-item">
        <Checkbox v-model="selectedItems" :value="item.id" class="list-item-checkbox" />
        <i :class="['item-icon', item.type === 'folder' ? 'pi pi-folder' : 'pi pi-box']"></i>
        <div class="list-item-details" @click="handleItemClick(item)">
          <div class="list-item-name">{{ item.name }}</div>
          <div class="list-item-tags">
            <Tag :value="item.reviewStatus" :severity="getStatusSeverity(item.reviewStatus)" />
            <Tag v-for="tag in item.tags" :key="tag" :value="tag"></Tag>
          </div>
          <div class="list-item-description">{{ item.description }}</div>
          <div class="list-item-date">
            <i class="pi pi-calendar"></i>
            <span>{{ formatDate(item.createdAt) }} by {{ item.creatorName || item.uploaderName }}</span>
          </div>
        </div>
        <div class="list-item-actions">
          <SplitButton
            icon="pi pi-cog"
            :model="getItemActions(item)"
            v-if="authStore.hasPermission('REVIEW_MANAGE')"
            @click="showDetailFor(item)"
            class="p-button-sm p-button-secondary"
          ></SplitButton>
          <Button v-else icon="pi pi-info-circle" class="p-button-rounded p-button-secondary" @click.stop="showDetailFor(item)"></Button>
          <Button v-if="item.type !== 'folder'" icon="pi pi-download" class="p-button-rounded p-button-help" @click="downloadSingleItem(item)"></Button>
        </div>
      </div>
    </div>

    <Dialog v-model:visible="showDetail" :header="detail.name" :style="{ width: '50vw' }" :modal="true">
      <div class="p-fluid">
        <div class="field">
          <label for="detail-name">名稱</label>
          <InputText id="detail-name" v-model="detail.name" />
        </div>
        <div class="field">
          <label for="detail-desc">描述</label>
          <Textarea id="detail-desc" v-model="detail.description" :rows="5" />
        </div>
        <div class="field">
          <label for="detail-tags">標籤</label>
          <MultiSelect id="detail-tags" v-model="detail.tags" :options="allTags" :filter="true" />
        </div>
        <div v-if="reviewStages.length" class="field">
          <label>審查關卡</label>
          <div v-for="stage in reviewStages" :key="stage._id" class="flex align-items-center">
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
        <Button label="取消" icon="pi pi-times" @click="showDetail = false" class="p-button-text" />
        <Button label="儲存" icon="pi pi-check" @click="saveDetail" autofocus />
      </template>
    </Dialog>

    <Dialog v-model:visible="batchDialog" header="批次設定可查看者" :style="{ width: '300px' }" :modal="true">
      <MultiSelect v-model="batchUsers" :options="users" optionLabel="username" optionValue="_id" placeholder="選擇使用者" class="w-full" />
      <template #footer>
        <Button label="取消" icon="pi pi-times" @click="batchDialog = false" class="p-button-text" />
        <Button label="確定" icon="pi pi-check" @click="applyBatch" autofocus />
      </template>
    </Dialog>

    <Dialog v-model:visible="moveDialog" header="移動至" :style="{ width: '300px' }" :modal="true">
      <Dropdown v-model="targetFolder" :options="folderOptions" optionLabel="label" optionValue="value" placeholder="選擇資料夾" class="w-full" />
      <template #footer>
        <Button label="取消" icon="pi pi-times" @click="moveDialog = false" class="p-button-text" />
        <Button label="確定" icon="pi pi-check" @click="applyMove" autofocus />
      </template>
    </Dialog>

    <Dialog v-model:visible="previewVisible" :header="previewItem?.name" :style="{ width: '60vw' }" :modal="true">
      <div class="flex justify-content-center">
        <img v-if="isImage(previewItem)" :src="previewItem.url" class="w-full h-auto" style="max-height: 70vh; object-fit: contain;" />
        <video v-else-if="previewItem" controls class="w-full h-auto" style="max-height: 70vh;">
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
import { fetchFolders, createFolder, updateFolder, getFolder, deleteFolder, updateFoldersViewers, reviewFolder, fetchFolderStages, updateFolderStage, moveFolders } from '../services/folders'
import { fetchProducts, updateProduct, deleteProduct, updateProductsViewers, getProductUrl, batchDownloadProducts, deleteProducts, reviewProduct, fetchProductStages, updateProductStage, startBatchDownload as startProductBatchDownload, getBatchDownloadProgress as getProductBatchDownloadProgress, moveProducts } from '../services/products'
import { useUploadStore } from '../stores/upload'
import { fetchUsers } from '../services/user'
import { fetchTags } from '../services/tags'
import { useAuthStore } from '../stores/auth'
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

const formatDate = d => d ? new Date(d).toLocaleString() : '—'
const isImage = item => item && item.name && /\.(png|jpe?g|gif|webp)$/i.test(item.name)

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
      label: 'Approve',
      icon: 'pi pi-check',
      command: () => handleReview(item, 'approved')
    },
    {
      label: 'Reject',
      icon: 'pi pi-times',
      command: () => handleReview(item, 'rejected')
    }
  ]
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
      fetchFolders(folderId, filterTags.value, 'edited'),
      fetchProducts(folderId, filterTags.value),
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
  detail.value = { ...item };
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
    if (detail.value.type === 'folder') {
      await updateFolder(detail.value._id, { name: detail.value.name, description: detail.value.description, tags: detail.value.tags });
    } else {
      await updateProduct(detail.value._id, { title: detail.value.name, description: detail.value.description, tags: detail.value.tags });
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
          // Note: Assumes a deleteProduct function exists for single deletion.
          // If a batch delete function (e.g., deleteProducts) exists, it would be more efficient.
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

</script>

<style scoped>
.shared-library-container {
  padding: 1rem;
}

.header {
  margin-bottom: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-color);
}

.subtitle {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
}

.toolbar {
  margin-bottom: 1rem;
}

.p-inputgroup {
  width: 100%;
  max-width: 300px;
}

.breadcrumb {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 6px;
  background-color: var(--surface-d);
  color: var(--text-color-secondary);
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.actions .left,
.actions .right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.empty-message {
  text-align: center;
  color: var(--text-color-secondary);
  padding: 2rem;
  border: 1px dashed var(--surface-border);
  border-radius: 6px;
}

/* Grid View */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.grid-item {
  display: flex;
}

.item-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background-color: var(--surface-card);
  padding: 0.5rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
}

.item-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.item-name {
  font-weight: bold;
  color: var(--text-color);
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

/* List View */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background-color: var(--surface-card);
}

.list-item-checkbox {
  margin-right: 1rem;
}

.list-item-icon {
  font-size: 2rem;
  margin-right: 1rem;
  color: var(--primary-color);
}

.list-item-details {
  flex: 1;
  cursor: pointer;
}

.list-item-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-color);
}

.list-item-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.list-item-description {
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.list-item-date {
  display: flex;
  align-items: center;
  color: var(--text-color-secondary);
}

.list-item-date i {
  margin-right: 0.25rem;
}

.list-item-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
