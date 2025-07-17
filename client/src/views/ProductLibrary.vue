<!-- ProductLibrary.vue (PrimeVue Refactored) -->
<template>
  <div>
    <Toolbar class="mb-4">
      <template #start>
        <Button icon="pi pi-arrow-left" class="p-button-secondary mr-2" @click="goUp" :disabled="!currentFolder" />
        <div class="p-inputgroup w-full md:w-auto">
          <InputText v-model="newFolderName" placeholder="新資料夾名稱" @keyup.enter="createNewFolder" />
          <Button label="建立" icon="pi pi-plus" @click="createNewFolder" :disabled="!newFolderName" />
        </div>
        <FileUpload mode="basic" :auto="true" :customUpload="true" @uploader="uploadRequest" class="ml-2" chooseLabel="上傳成品" :disabled="!currentFolder" />
      </template>
      <template #end>
        <MultiSelect v-model="filterTags" :options="allTags" placeholder="標籤篩選" class="w-full md:w-20rem" />
      </template>
    </Toolbar>

    <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" class="mb-4 p-3 border-1 surface-border border-round" />

    <DataView :value="combinedItems" :layout="viewMode" paginator :rows="12" :loading="loading" dataKey="id">
      <template #header>
        <div class="flex flex-column md:flex-row md:justify-content-between">
          <div class="flex align-items-center mb-2 md:mb-0">
            <Checkbox v-model="selectAll" :binary="true" class="mr-2" />
            <Button label="批次設定" icon="pi pi-users" class="p-button-secondary mr-2" @click="openBatchDialog" :disabled="!selectedItems.length" />
            <Button label="批次下載" icon="pi pi-download" class="p-button-secondary mr-2" @click="downloadSelected" :disabled="!selectedProducts.length" />
            <Button label="批次刪除" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelected" :disabled="!selectedItems.length" />
          </div>
          <DataViewLayoutOptions v-model="viewMode" />
        </div>
      </template>

      <template #list="slotProps">
        <!-- List Item Layout -->
      </template>

      <template #grid="slotProps">
        <!-- Grid Item Layout -->
      </template>
    </DataView>

    <!-- Dialogs -->
    <Dialog v-model:visible="showDetail" :header="detail.name" :style="{width: '50vw'}" :modal="true">
        <!-- Detail Form Content -->
    </Dialog>

    <Dialog v-model:visible="batchDialog" header="批次設定可查看者" :style="{width: '300px'}" :modal="true">
        <MultiSelect v-model="batchUsers" :options="users" optionLabel="username" optionValue="_id" placeholder="選擇使用者" class="w-full" />
        <template #footer>
            <Button label="取消" icon="pi pi-times" @click="batchDialog = false" class="p-button-text"/>
            <Button label="確定" icon="pi pi-check" @click="applyBatch" autofocus />
        </template>
    </Dialog>

    <Dialog v-model:visible="previewVisible" :header="previewItem?.name" :style="{width: '60vw'}" :modal="true">
        <!-- Preview Content -->
    </Dialog>
  </div>
</template>

<script setup>
import '../assets/shared-library-styles.css';
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
// Import all necessary services and stores
import { fetchFolders, createFolder, updateFolder, getFolder, deleteFolder, updateFoldersViewers, downloadFolder } from '../services/folders'
import { fetchProducts, updateProduct, deleteProduct, updateProductsViewers, getProductUrl, batchDownloadProducts, deleteProducts } from '../services/products'
import { uploadAssetAuto } from '../services/assets'
import { fetchUsers } from '../services/user'
import { fetchTags } from '../services/tags'
import { useAuthStore } from '../stores/auth'

// Import PrimeVue components
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import MultiSelect from 'primevue/multiselect'
import Breadcrumb from 'primevue/breadcrumb'
import DataView from 'primevue/dataview'
import DataViewLayoutOptions from 'primevue/dataviewlayoutoptions'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'

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
const viewMode = ref('grid')
const selectedItems = ref([])

const detail = ref({})
const showDetail = ref(false)
const batchDialog = ref(false)
const batchUsers = ref([])
const previewVisible = ref(false)
const previewItem = ref(null)

const combinedItems = computed(() => [
  ...folders.value.map(f => ({ ...f, id: `folder-${f._id}`, type: 'folder', name: f.name })),
  ...products.value.map(p => ({ ...p, id: `product-${p._id}`, type: 'product', name: p.title || p.filename }))
])

const selectedProducts = computed(() => selectedItems.value.filter(id => id.startsWith('product-')).map(id => id.replace('product-', '')))

const selectAll = computed({
  get: () => combinedItems.value.length > 0 && selectedItems.value.length === combinedItems.value.length,
  set: val => { selectedItems.value = val ? combinedItems.value.map(i => i.id) : [] }
})

const breadcrumbHome = ref({ icon: 'pi pi-home', to: '/products' })
const breadcrumbItems = ref([])

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

</script>