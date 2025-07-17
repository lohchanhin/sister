<!-- ProductLibrary.vue (PrimeVue Refactored) -->
<template>
  <div>
    <Toolbar class="mb-4">
      <!-- ... Toolbar content ... -->
    </Toolbar>

    <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" class="mb-4 p-3 border-1 surface-border border-round" />

    <DataView :value="combinedItems" :layout="viewMode" paginator :rows="12" :loading="loading" dataKey="id">
      <template #header>
        <!-- ... Header content ... -->
      </template>

      <template #list="slotProps">
        <div class="col-12">
          <div class="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
            <Checkbox v-model="selectedItems" :value="slotProps.data.id" class="align-self-center xl:align-self-start"/>
            <i :class="['text-4xl text-primary-500', slotProps.data.type === 'folder' ? 'pi pi-folder' : 'pi pi-box']"></i>
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
              <i :class="['text-6xl mt-3', slotProps.data.type === 'folder' ? 'pi pi-folder' : 'pi pi-box']"></i>
              <div class="font-bold">{{ slotProps.data.name }}</div>
              <div class="flex align-items-center gap-2 flex-wrap justify-content-center">
                <Tag v-for="tag in slotProps.data.tags" :key="tag" :value="tag"></Tag>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataView>

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

// ... (PrimeVue component imports)

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

const formatDate = d => d ? new Date(d).toLocaleString() : '—'
const isImage = item => item && item.name && /\.(png|jpe?g|gif|webp)$/i.test(item.name)

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
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 })
  } finally {
    loading.value = false
    selectedItems.value = []
  }
}

// ... (rest of the functions: buildBreadcrumb, goUp, createNewFolder, etc.)

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
watch(filterTags, () => loadData(currentFolder.value?._id))

</script>
