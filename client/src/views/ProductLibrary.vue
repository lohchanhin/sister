<!-- ProductLibrary.vue (Final Refactor with All Features) -->
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

    <div class="flex flex-column md:flex-row md:justify-content-between mb-4">
      <div class="flex align-items-center mb-2 md:mb-0">
        <Checkbox v-model="selectAll" :binary="true" class="mr-2" />
        <Button label="批次設定" icon="pi pi-users" class="p-button-secondary mr-2" @click="openBatchDialog" :disabled="!selectedItems.length" />
        <Button label="批次下載" icon="pi pi-download" class="p-button-secondary mr-2" @click="downloadSelected" :disabled="!selectedProducts.length" />
        <Button label="批次刪除" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelected" :disabled="!selectedItems.length" />
      </div>
    </div>

    <div class="grid">
      <div v-if="!combinedItems.length && !loading" class="col-12 text-center text-color-secondary p-4">
        <i class="pi pi-inbox" style="font-size: 2rem"></i>
        <p>此資料夾為空</p>
      </div>
      <div v-for="item in combinedItems" :key="item.id" class="col-12 md:col-4 lg:col-3 xl:col-2 p-2">
        <div class="p-4 border-1 surface-border surface-card border-round h-full flex flex-column">
          <div class="flex justify-content-between align-items-start">
              <Checkbox v-model="selectedItems" :value="item.id" @click.stop />
              <SplitButton 
                icon="pi pi-cog" 
                :model="getItemActions(item)"
                v-if="authStore.hasPermission('REVIEW_MANAGE')"
                @click="showDetailFor(item)"
                class="p-button-sm p-button-secondary"
              ></SplitButton>
              <Button v-else icon="pi pi-info-circle" class="p-button-rounded p-button-text" @click.stop="showDetailFor(item)"></Button>
          </div>
          <div class="flex-1 flex flex-column align-items-center text-center gap-3 cursor-pointer" @click="handleItemClick(item)">
            <i :class="['text-6xl mt-3', item.type === 'folder' ? 'pi pi-folder' : 'pi pi-box']"></i>
            <div class="font-bold">{{ item.name }}</div>
            <div class="flex align-items-center gap-2 flex-wrap justify-content-center">
              <Tag :value="item.reviewStatus" :severity="getStatusSeverity(item.reviewStatus)" />
              <Tag v-for="tag in item.tags" :key="tag" :value="tag"></Tag>
            </div>
          </div>
        </div>
      </div>
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
        <div v-if="reviewStages.length" class="field">
          <label>審查關卡</label>
          <div v-for="stage in reviewStages" :key="stage._id" class="flex align-items-center">
            <Checkbox 
              :modelValue="stage.completed" 
              :binary="true" 
              :inputId="stage._id"
              :disabled="stage.responsible && stage.responsible._id !== authStore.user._id"
              @change="updateStageStatus(stage, $event)"
            />
            <label :for="stage._id" class="ml-2">{{ stage.name }}</label>
          </div>
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
import { fetchFolders, createFolder, updateFolder, getFolder, deleteFolder, updateFoldersViewers, reviewFolder, fetchFolderStages, updateFolderStage } from '../services/folders'
import { fetchProducts, updateProduct, deleteProduct, updateProductsViewers, getProductUrl, batchDownloadProducts, deleteProducts, reviewProduct, fetchProductStages, updateProductStage } from '../services/products'
import { uploadAssetAuto } from '../services/assets'
import { fetchUsers } from '../services/user'
import { fetchTags } from '../services/tags'
import { useAuthStore } from '../stores/auth'

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

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const folders = ref([])
const products = ref([])
const currentFolder = ref(null)
const newFolderName = ref('')
const filterTags = ref([])
const allTags = ref([])
const users = ref([])
const selectedItems = ref([])

const detail = ref({})
const showDetail = ref(false)
const batchDialog = ref(false)
const batchUsers = ref([])
const previewVisible = ref(false)
const previewItem = ref(null)
const reviewStages = ref([])

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
      folderId ? fetchProducts(folderId, filterTags.value) : Promise.resolve([]),
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
    const file = event.files[0];
    const toastId = toast.add({ 
        severity: 'info', 
        summary: `Uploading ${file.name}`,
        detail: 'Starting...', 
        life: 60000 
    });

    try {
        await uploadAssetAuto(file, currentFolder.value?._id, { type: 'edited' }, (progressEvent) => {
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

async function downloadSelected() {
  if (!selectedProducts.value.length) return;
  try {
    const url = await batchDownloadProducts(selectedProducts.value);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products.zip');
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

onMounted(() => {
  loadData(route.params.folderId || null)
  fetchTags().then(tags => allTags.value = tags.map(t => t.name))
  if (authStore.hasPermission('user:read')) {
      fetchUsers().then(u => users.value = u)
  }
})

watch(() => route.params.folderId, (newId) => loadData(newId || null))
watch(filterTags, () => loadData(currentFolder.value?._id), { deep: true })

</script>
