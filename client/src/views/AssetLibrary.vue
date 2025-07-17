<!-- AssetLibrary.vue (PrimeVue Refactored) -->
<template>
  <div>
    <Toolbar class="mb-4">
      <template #start>
        <Button icon="pi pi-arrow-left" class="p-button-secondary mr-2" @click="goUp" :disabled="!currentFolder" />
        <div class="p-inputgroup w-full md:w-auto">
          <InputText v-model="newFolderName" placeholder="新資料夾名稱" @keyup.enter="createNewFolder" />
          <Button label="建立" icon="pi pi-plus" @click="createNewFolder" :disabled="!newFolderName" />
        </div>
        <FileUpload mode="basic" :auto="true" :customUpload="true" @uploader="uploadRequest" class="ml-2" chooseLabel="上傳檔案" :disabled="!currentFolder" />
      </template>
      <template #end>
        <MultiSelect v-model="filterTags" :options="allTags" placeholder="標籤篩選" class="w-full md:w-20rem" />
      </template>
    </Toolbar>

    <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" class="mb-4 p-3 border-1 surface-border border-round" />

    <DataView :value="combinedItems" :layout="viewMode" paginator :rows="12" :loading="loading" :dataKey="(slotProps) => slotProps.data ? slotProps.data.id : slotProps.index">
      <template #header>
        <div class="flex flex-column md:flex-row md:justify-content-between">
          <div class="flex align-items-center mb-2 md:mb-0">
            <Checkbox v-model="selectAll" :binary="true" class="mr-2" />
            <Button label="批次設定" icon="pi pi-users" class="p-button-secondary mr-2" @click="openBatchDialog" :disabled="!selectedItems.length" />
            <Button label="批次下載" icon="pi pi-download" class="p-button-secondary mr-2" @click="downloadSelected" :disabled="!selectedAssets.length" />
            <Button label="批次刪除" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelected" :disabled="!selectedItems.length" />
          </div>
          </div>
      </template>

      <template #list="slotProps">
        <div class="col-12">
          <div class="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
            <Checkbox v-model="selectedItems" :value="slotProps.data.id" class="align-self-center xl:align-self-start"/>
            <i :class="['text-4xl text-primary-500', slotProps.data.type === 'folder' ? 'pi pi-folder' : 'pi pi-file']"></i>
            <div class="flex-1 flex flex-column gap-2">
              <div class="font-bold text-lg cursor-pointer" @click="handleItemClick(slotProps.data)">{{ slotProps.data.name }}</div>
              <div class="text-sm text-color-secondary">{{ slotProps.data.description }}</div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(slotProps.data.createdAt) }} by {{ slotProps.data.creatorName || slotProps.data.uploaderName }}</span>
              </div>
              <div class="flex align-items-center gap-2">
                <Tag v-for="tag in slotProps.data.tags" :key="tag" :value="tag"></Tag>
              </div>
            </div>
            <div class="flex flex-row xl:flex-column align-items-center xl:align-items-end gap-2">
              <Button icon="pi pi-info-circle" class="p-button-rounded p-button-secondary" @click="showDetailFor(slotProps.data)"></Button>
              <Button v-if="slotProps.data.type === 'folder'" icon="pi pi-download" class="p-button-rounded p-button-help" @click="downloadFolderItem(slotProps.data)"></Button>
            </div>
          </div>
        </div>
      </template>

      <template #grid="slotProps">
        <div class="col-12 md:col-4 lg:col-3 xl:col-2 p-2">
          <div class="p-4 border-1 surface-border surface-card border-round h-full flex flex-column">
            <div class="flex justify-content-between align-items-start">
                <Checkbox v-model="selectedItems" :value="slotProps.data.id" @click.stop />
                <Button icon="pi pi-info-circle" class="p-button-rounded p-button-text" @click.stop="showDetailFor(slotProps.data)"></Button>
            </div>
            <div class="flex-1 flex flex-column align-items-center text-center gap-3 cursor-pointer" @click="handleItemClick(slotProps.data)">
              <i :class="['text-6xl mt-3', slotProps.data.type === 'folder' ? 'pi pi-folder' : 'pi pi-file']"></i>
              <div class="font-bold">{{ slotProps.data.name }}</div>
              <div class="flex align-items-center gap-2 flex-wrap justify-content-center">
                <Tag v-for="tag in slotProps.data.tags" :key="tag" :value="tag"></Tag>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataView>

    <!-- DEBUGGING LIST -->
    <div class="mt-4 p-4 border-2 border-dashed border-red-500">
      <h3 class="text-lg font-bold text-red-500">Debug Info</h3>
      <p>Total items in combinedItems: {{ combinedItems.length }}</p>
      <ul>
        <li v-for="i in combinedItems" :key="i.id">{{ i.type }}: {{ i.name }} (ID: {{ i.id }})</li>
      </ul>
    </div>

    <!-- Dialogs -->
    <Dialog v-model:visible="showDetail" :header="detail.name" :style="{width: '50vw'}" :modal="true">
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
      </div>
      <template #footer>
        <Button label="取消" icon="pi pi-times" @click="showDetail = false" class="p-button-text"/>
        <Button label="儲存" icon="pi pi-check" @click="saveDetail" autofocus />
      </template>
    </Dialog>

    <Dialog v-model:visible="batchDialog" header="批次設定可查看者" :style="{width: '300px'}" :modal="true">
        <MultiSelect v-model="batchUsers" :options="users" optionLabel="username" optionValue="_id" placeholder="選擇使用者" class="w-full" />
        <template #footer>
            <Button label="取消" icon="pi pi-times" @click="batchDialog = false" class="p-button-text"/>
            <Button label="確定" icon="pi pi-check" @click="applyBatch" autofocus />
        </template>
    </Dialog>

    <Dialog v-model:visible="previewVisible" :header="previewItem?.name" :style="{width: '60vw'}" :modal="true">
        <div class="flex justify-content-center">
            <img v-if="isImage(previewItem)" :src="previewItem.url" class="w-full h-auto" style="max-height: 70vh; object-fit: contain;" />
            <video v-else controls class="w-full h-auto" style="max-height: 70vh;">
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
import { fetchFolders, createFolder, updateFolder, getFolder, deleteFolder, updateFoldersViewers, downloadFolder } from '../services/folders'
import { fetchAssets, uploadAssetAuto, updateAsset, deleteAsset, updateAssetsViewers, getAssetUrl, batchDownloadAssets, deleteAssetsBulk } from '../services/assets'
import { fetchUsers } from '../services/user'
import { fetchTags } from '../services/tags'
import { useAuthStore } from '../stores/auth'

import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import MultiSelect from 'primevue/multiselect'
import Breadcrumb from 'primevue/breadcrumb'
import DataView from 'primevue/dataview'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

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
  console.log('[AssetLibrary] Re-computing combinedItems. Folders:', folders.value, 'Assets:', assets.value);
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

async function loadData(folderId = null) {
  console.log(`[AssetLibrary] loadData called with folderId:`, folderId);
  loading.value = true
  try {
    const [folderData, assetData, currentFolderData] = await Promise.all([
      fetchFolders(folderId, filterTags.value), // REMOVED 'raw'
      folderId ? fetchAssets(folderId, 'raw', filterTags.value) : Promise.resolve([]),
      folderId ? getFolder(folderId) : Promise.resolve(null)
    ])
    console.log('[AssetLibrary] API returned. Folders:', folderData.length, 'Assets:', assetData.length);
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
    current = current.parent // This requires parent to be populated, or another strategy
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
    const file = event.files[0];
    const toastId = toast.add({ 
        severity: 'info', 
        summary: `Uploading ${file.name}`, 
        detail: 'Starting...', 
        life: 60000 // Keep toast open for a while
    });

    try {
        await uploadAssetAuto(file, currentFolder.value?._id, 'raw', (progressEvent) => {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            toast.add({ 
                id: toastId,
                severity: 'info', 
                summary: `Uploading ${file.name}`, 
                detail: `${percent}%`,
            });
        });
        toast.add({ 
            id: toastId,
            severity: 'success', 
            summary: 'Success', 
            detail: 'File uploaded', 
            life: 3000 
        });
        loadData(currentFolder.value?._id);
    } catch (error) {
        toast.add({ 
            id: toastId,
            severity: 'error', 
            summary: 'Error', 
            detail: 'File upload failed', 
            life: 3000 
        });
    }
};

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

async function downloadSelected() {
  if (!selectedAssets.value.length) return;
  try {
    const url = await batchDownloadAssets(selectedAssets.value);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'assets.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
     toast.add({ severity: 'error', summary: 'Error', detail: 'Download failed', life: 3000 });
  }
}

function confirmDeleteSelected() {
  confirm.require({
    message: `Are you sure you want to delete ${selectedItems.value.length} items?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
        // delete logic
    }
  });
}

function downloadFolderItem(item) {
  // Placeholder for folder download
  toast.add({ severity: 'info', summary: 'Info', detail: 'Folder download not implemented yet.', life: 3000 });
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

onMounted(() => {
  loadData(route.params.folderId || null)
  fetchTags().then(tags => allTags.value = tags.map(t => t.name))
  if (authStore.hasPermission('user:read')) {
      fetchUsers().then(u => users.value = u)
  }
})

watch(() => route.params.folderId, (newId) => loadData(newId || null))
watch(filterTags, () => {
  console.log('[AssetLibrary] filterTags watch triggered. currentFolder:', currentFolder.value);
  const folderId = currentFolder.value ? currentFolder.value._id : null;
  loadData(folderId);
}, { deep: true })

</script>