<!-- ProductLibrary.vue (PrimeVue Refactored) -->
<template>
  <div>
    <Toolbar class="mb-4">
      <!-- ... Toolbar content ... -->
    </Toolbar>

    <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" class="mb-4 p-3 border-1 surface-border border-round" />

    <div class="grid">
      <div v-for="item in combinedItems" :key="item.id" class="col-12 md:col-4 lg:col-3 xl:col-2 p-2">
        <div class="p-4 border-1 surface-border surface-card border-round h-full flex flex-column">
          <div class="flex justify-content-between align-items-start">
              <Checkbox v-model="selectedItems" :value="item.id" @click.stop />
              <Button icon="pi pi-info-circle" class="p-button-rounded p-button-text" @click.stop="showDetailFor(item)"></Button>
          </div>
          <div class="flex-1 flex flex-column align-items-center text-center gap-3 cursor-pointer" @click="handleItemClick(item)">
            <i :class="['text-6xl mt-3', item.type === 'folder' ? 'pi pi-folder' : 'pi pi-box']"></i>
            <div class="font-bold">{{ item.name }}</div>
            <div class="flex align-items-center gap-2 flex-wrap justify-content-center">
              <Tag v-for="tag in item.tags" :key="tag" :value="tag"></Tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DEBUGGING LIST -->
    <div class="mt-4 p-4 border-2 border-dashed border-red-500">
      <h3 class="text-lg font-bold text-red-500">Debug Info</h3>
      <p>Total items in combinedItems: {{ combinedItems.length }}</p>
      <ul>
        <li v-for="i in combinedItems" :key="i.id">{{ i.type }}: {{ i.name }} (ID: {{ i.id }})</li>
      </ul>
    </div>

    <!-- Dialogs -->
  </div>
</template>

<script setup>
import '../assets/shared-library-styles.css';
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { fetchFolders, createFolder, updateFolder, getFolder, deleteFolder, updateFoldersViewers, downloadFolder } from '../services/folders'
import { fetchProducts, updateProduct, deleteProduct, updateProductsViewers, getProductUrl, batchDownloadProducts, deleteProducts } from '../services/products'
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

const combinedItems = computed(() => {
  console.log('[ProductLibrary] Re-computing combinedItems. Folders:', folders.value, 'Products:', products.value);
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

async function loadData(folderId = null) {
  console.log(`[ProductLibrary] loadData called with folderId:`, folderId);
  loading.value = true
  try {
    const [folderData, productData, currentFolderData] = await Promise.all([
      fetchFolders(folderId, filterTags.value, 'edited'), // RESTORED 'edited'
      folderId ? fetchProducts(folderId, filterTags.value) : Promise.resolve([]),
      folderId ? getFolder(folderId) : Promise.resolve(null)
    ])
    console.log('[ProductLibrary] API returned. Folders:', folderData.length, 'Products:', productData.length);
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
    current = current.parent // This requires parent to be populated, or another strategy
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

function handleItemClick(item) {
  if (item.type === 'folder') {
    router.push({ name: 'Products', params: { folderId: item._id } })
  } else {
    // previewProduct(item)
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
