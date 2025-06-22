<!-- src/views/ProductLibrary.vue -->
<template>
  <section class="product-library p-6 flex gap-6 relative">
    <!-- =============== 左側格線區 =============== -->
    <div class="flex-1">
      <!-- ────────────── 工具列 (統一版) ────────────── -->
      <div class="tool-bar flex flex-wrap items-center justify-between gap-y-4 mb-8">
        <!-- ◤ 左側：主要動作 ◢ -->
        <div class="flex flex-wrap items-end gap-3">
          <!-- 返回上層 -->
          <el-button :disabled="!currentFolder" @click="goUp">
            <el-icon class="mr-1">
              <ArrowLeft />
            </el-icon>
            返回上層
          </el-button>

          <!-- 新增資料夾 -->
          <div class="flex items-end gap-2">
            <el-input v-model="newFolderName" placeholder="資料夾名稱" class="w-52" @keyup.enter="createNewFolder" />
            <el-button type="primary" @click="createNewFolder">
              <el-icon class="mr-1">
                <Plus />
              </el-icon> 建立
            </el-button>
          </div>

          <!-- 上傳（產品主圖等資源） -->
          <el-upload v-if="currentFolder" :http-request="uploadRequest" :on-progress="handleProgress"
            :on-success="handleSuccess" :on-error="handleError" :show-file-list="false">
            <el-button type="success">
              <el-icon class="mr-1">
                <UploadFilled />
              </el-icon> 上傳
            </el-button>
          </el-upload>

          <!-- 標籤篩選 -->
          <el-select v-model="filterTags" multiple placeholder="標籤篩選" class="min-w-[150px]">
            <el-option v-for="t in allTags" :key="t" :label="t" :value="t" />
          </el-select>
        </div>

        <!-- ◤ 右側：檢視 / 批次動作 ◢ -->
        <div class="flex items-end gap-3">
          <el-button-group>
            <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
              <el-icon class="mr-1">
                <Grid />
              </el-icon> 卡片
            </el-button>
            <el-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
              <el-icon class="mr-1">
                <Menu />
              </el-icon> 列表
            </el-button>
          </el-button-group>

          <el-button v-if="selectedItems.length && canManageViewers" @click="openBatchDialog">
            <el-icon class="mr-1">
              <UserFilled />
            </el-icon> 批次設定
          </el-button>
        </div>
      </div>

      <!-- □□□ 麵包屑 □□□ -->
      <el-breadcrumb separator="/" class="mb-2" style="font-size:larger; margin:1rem;">
        <el-breadcrumb-item v-for="b in breadcrumb" :key="b._id" class="cursor-pointer" @click="loadData(b._id)">
          {{ b.name }}
        </el-breadcrumb-item>
      </el-breadcrumb>

      <!-- ==================== 卡片格線檢視 ==================== -->
      <transition-group v-if="viewMode === 'card'" name="fade-slide" tag="div" class="flex flex-wrap gap-5">
        <!-- □□□ Folder Card □□□ -->
        <el-card v-for="f in folders" :key="f._id"
          :class="['folder-card', 'card-base', 'cursor-pointer', { approved: f.reviewStatus === 'approved' }]"
          shadow="hover" @click="openFolder(f)">
          <template #header>
            <div class="flex items-center mb-2 gap-2 w-full min-w-0">
              <el-checkbox v-model="selectedItems" :label="f._id" @click.stop
                class="mr-1 flex-1 min-w-0 flex items-center gap-2">
                <span class="font-medium truncate">{{ f.name }}</span>
                <el-tag v-if="isRecent(f.updatedAt)" type="warning" size="small" class="ml-1">最近更新</el-tag>
              </el-checkbox>
              <el-button link size="small" class="flex-shrink-0" @click.stop="showDetailFor(f, 'folder')">
                <el-icon style="font-size:24px;">
                  <InfoFilled />
                </el-icon>
              </el-button>
            </div>
          </template>

          <!-- 描述 -->
          <el-scrollbar max-height="60">
            <div class="desc-line">
              <template v-if="f.description && f.description.includes('\n')">
                <ul>
                  <li v-for="(line, i) in f.description.split('\n')" :key="i">{{ line }}</li>
                </ul>
              </template>
              <template v-else>{{ f.description || '—' }}</template>
            </div>
          </el-scrollbar>

          <!-- 標籤 -->
          <div v-if="f.tags?.length" class="tag-list mt-1">
            <el-tag v-for="tag in f.tags" :key="tag" size="small" class="mr-1">{{ tag }}</el-tag>
          </div>
        </el-card>

        <!-- □□□ Product Card □□□ -->
        <el-card v-for="p in products" :key="p._id"
          :class="['product-card', 'card-base', 'cursor-pointer', { approved: p.reviewStatus === 'approved' }]"
          shadow="hover" @click="previewProduct(p)">
          <template #header>
            <div class="flex items-center mb-2 gap-2 w-full min-w-0">
              <el-checkbox v-model="selectedItems" :label="p._id" @click.stop
                class="mr-1 flex-1 min-w-0 flex items-center gap-2">
                <span class="font-medium truncate">{{ p.name }}</span>
              </el-checkbox>
              <el-button link size="small" class="flex-shrink-0" @click.stop="showDetailFor(p, 'product')">
                <el-icon style="font-size:24px;">
                  <InfoFilled />
                </el-icon>
              </el-button>
            </div>
          </template>

          <!-- 顯示進度或價錢等資訊 -->
          <el-scrollbar max-height="60">
            <div class="desc-line">
              {{ p.progress ? `${p.progress.done}/${p.progress.total} 流程完成` : (p.price ? `RM ${p.price}` : '—') }}
            </div>
          </el-scrollbar>

          <div v-if="p.tags?.length" class="tag-list mt-1">
            <el-tag v-for="tag in p.tags" :key="tag" size="small" class="mr-1">{{ tag }}</el-tag>
          </div>
        </el-card>
      </transition-group>

      <!-- ==================== 列表檢視 ==================== -->
      <div v-else class="list-view">
        <!-- □□□ Folder Row □□□ -->
        <div v-for="f in folders" :key="f._id" class="list-row" :class="{ approved: f.reviewStatus === 'approved' }">
          <el-checkbox v-model="selectedItems" :label="f._id" class="mr-2" @click.stop />
          <span class="name cursor-pointer" @click="openFolder(f)">{{ f.name }}</span>
          <el-tag v-if="isRecent(f.updatedAt)" type="warning" size="small" class="ml-1">最近更新</el-tag>
          <div class="flex-1"></div>
          <div v-if="f.tags?.length" class="mr-2">
            <el-tag v-for="tag in f.tags" :key="tag" size="small" class="mr-1">{{ tag }}</el-tag>
          </div>
          <el-button link size="small" @click="showDetailFor(f, 'folder')">
            <el-icon>
              <InfoFilled />
            </el-icon>
          </el-button>
        </div>

        <!-- □□□ Product Row □□□ -->
        <div v-for="p in products" :key="p._id" class="list-row" :class="{ approved: p.reviewStatus === 'approved' }">
          <el-checkbox v-model="selectedItems" :label="p._id" class="mr-2" @click.stop />
          <span class="name cursor-pointer" @click="previewProduct(p)">{{ p.name }}</span>
          <span v-if="p.price" class="ml-2 text-xs font-medium">RM {{ p.price }}</span>
          <div class="flex-1"></div>
          <div v-if="p.tags?.length" class="mr-2">
            <el-tag v-for="tag in p.tags" :key="tag" size="small" class="mr-1">{{ tag }}</el-tag>
          </div>
          <el-button link size="small" @click="showDetailFor(p, 'product')">
            <el-icon>
              <InfoFilled />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- ===== 詳細資訊 Dialog ===== -->
    <el-dialog v-model="showDetail" width="60%" top="10vh" :modal="true" append-to-body>
      <template #header>
        <header class="panel-header" :style="{ '--panel-bg': sidebarBg }">
          <div class="title">
            <el-icon class="text-[24px]">
              <InfoFilled />
            </el-icon>
            <span class="text">{{ detail.title || detail.name || detailTitle }}</span>
          </div>
        </header>
      </template>

      <div class="detail-wrapper">
        <el-scrollbar class="panel-body flex-1">
          <!-- 產品 or 資料夾 詳細表單 -->
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="名稱">
              <el-input v-model="detail.title" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="detail.description" type="textarea" rows="4" resize="vertical" />
            </el-form-item>
            <el-form-item label="標籤">
              <el-select v-model="detail.tags" multiple filterable>
                <el-option v-for="t in allTags" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="detailType === 'folder'" label="腳本需求">
              <el-input v-model="detail.script" type="textarea" rows="4" resize="vertical" />
            </el-form-item>
            <el-form-item v-if="detailType === 'folder' && canManageViewers" label="可存取使用者">
              <el-select v-model="detail.allowedUsers" multiple filterable style="width:100%">
                <el-option v-for="u in users" :key="u._id" :label="u.username" :value="u._id" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="detailType === 'product' && canManageViewers" label="可查看使用者">
              <el-select v-model="detail.allowedUsers" multiple filterable style="width:100%">
                <el-option v-for="u in users" :key="u._id" :label="u.username" :value="u._id" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-scrollbar>

        <!-- 审查关卡 -->
        <el-scrollbar v-if="detailType === 'product' || detailType === 'folder'" class="panel-body stage-body"
          style="max-width:260px">
          <div class="stage-list">
            <div v-for="s in stageList" :key="s._id" class="stage-row">
              <span class="stage-label">
                {{ s.order }}. {{ s.name }} (負責: {{ s.responsible?.username || '' }})
              </span>
              <el-checkbox v-model="s.completed" :disabled="!canModify(s)" @change="() => toggleStage(s)" />
            </div>
          </div>
        </el-scrollbar>
      </div>

      <template #footer>
        <div class="panel-footer">
          <el-popconfirm :title="`確定刪除${detailType === 'folder' ? '資料夾' : '產品'}？`" confirm-button-text="刪除"
            cancel-button-text="取消" confirm-button-type="danger" @confirm="handleDelete">
            <template #reference><el-button size="small" type="danger">刪除</el-button></template>
          </el-popconfirm>
          <el-button v-if="(detailType === 'product' || detailType === 'folder') && canReview" size="small"
            type="warning" @click="review('rejected')">退回</el-button>
          <el-button size="small" @click="showDetail = false">取消</el-button>
          <el-button size="small" type="primary" @click="saveDetail">儲存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ===== 預覽（主圖/文件/影片）Dialog ===== -->
    <el-dialog v-model="previewVisible" width="60%" top="5vh" :destroy-on-close="true">
      <template #header>{{ previewItem?.title || previewItem?.filename }}</template>
      <div class="w-full flex justify-center">
        <img v-if="isImage(previewItem)" :src="previewItem.url" class="preview-media" />
        <iframe v-else-if="isDocument(previewItem)" :src="docPreviewUrl(previewItem)" class="preview-media"></iframe>
        <video v-else controls class="preview-media">
          <source :src="previewItem.url" type="video/mp4" />
        </video>
      </div>
      <template #footer>
        <el-button type="primary" @click="downloadProduct(previewItem)">下載</el-button>
        <el-button @click="previewVisible = false">關閉</el-button>
      </template>
    </el-dialog>

    <!-- ===== 批次設定 Dialog ===== -->
    <el-dialog v-model="batchDialog" title="批次設定可查看者" width="30%" append-to-body>
      <el-select v-model="batchUsers" multiple filterable style="width:100%">
        <el-option v-for="u in users" :key="u._id" :label="u.username" :value="u._id" />
      </el-select>
      <template #footer>
        <el-button @click="batchDialog = false">取消</el-button>
        <el-button type="primary" @click="applyBatch">確定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  fetchFolders, createFolder, updateFolder, getFolder, deleteFolder,
  updateFoldersViewers, reviewFolder, fetchFolderStages, updateFolderStage
} from '../services/folders'
import {
  fetchProducts, uploadProduct, updateProduct, deleteProduct,
  reviewProduct, fetchProductStages, updateProductStage,
  updateProductsViewers, getProductUrl
} from '../services/products'
import { fetchUsers } from '../services/user'
import { fetchTags } from '../services/tags'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Plus, UploadFilled, Grid, Menu, UserFilled, InfoFilled
} from '@element-plus/icons-vue'

/* ---------- 狀態 ---------- */
const folders = ref([])
const products = ref([])
const currentFolder = ref(null)
const editingFolder = ref(null)
const viewMode = ref('card')

const newFolderName = ref('')
const filterTags = ref([])
const allTags = ref([])

const selectedItems = ref([])
const batchDialog = ref(false)
const batchUsers = ref([])
const previewVisible = ref(false)
const previewItem = ref(null)
const detail = ref({ title: '', description: '', script: '', tags: [], allowedUsers: [] })
const showDetail = ref(false)
const detailType = ref('folder')  // 'folder' | 'product'

const users = ref([])
const breadcrumb = ref([])

const store = useAuthStore()
const canReview = computed(() => store.hasPermission('review:manage'))
const canManageViewers = computed(
  () => store.hasPermission('product:update') || store.hasPermission('folder:manage')
)

/* ---------- 工具 ---------- */
const RECENT_DAYS = 3
const isRecent = date => date ? (Date.now() - new Date(date).getTime()) < RECENT_DAYS * 86400000 : false
const sidebarBg = computed(() => getComputedStyle(document.querySelector('.sidebar'))?.backgroundColor || '#1f2937')
const detailTitle = computed(() =>
  previewItem.value ? (previewItem.value.title || previewItem.value.filename) : currentFolder.value?.name || '資訊'
)

/* ---------- 審查關卡 ---------- */
const stageList = ref([])
const stageProduct = ref(null)
const canModify = s => (s.responsible?._id === store.user?._id) &&
  !stageList.value.some(prev => prev.order < s.order && !prev.completed)

/* ---------- 請求 ---------- */
const loadUsers = async () => { users.value = await fetchUsers() }
const loadTags = async () => { allTags.value = (await fetchTags()).map(t => t.name) }

/* ---------- 資料載入 ---------- */
async function buildBreadcrumb(folder) {
  const chain = []
  let cur = folder
  while (cur) {
    chain.unshift({ _id: cur._id, name: cur.name })
    if (!cur.parentId) break
    cur = await getFolder(cur.parentId)
  }
  return chain
}
async function loadData(id = null) {
  folders.value = await fetchFolders(id, filterTags.value, 'edited')
  products.value = id ? await fetchProducts(id, filterTags.value, true) : []
  currentFolder.value = id ? await getFolder(id) : null
  breadcrumb.value = currentFolder.value ? await buildBreadcrumb(currentFolder.value) : []
  selectedItems.value = []
}

/* ---------- 監聽 / 初始化 ---------- */
onMounted(async () => {
  await loadData()
  await loadTags()
  if (canManageViewers.value) await loadUsers()
})
watch(filterTags, () => loadData(currentFolder.value?._id || null))

/* ---------- 導航 ---------- */
const openFolder = f => loadData(f._id)
const goUp = () => loadData(currentFolder.value?.parentId || null)

/* ---------- 批次 ---------- */
function openBatchDialog() {
  if (!users.value.length) loadUsers()
  batchUsers.value = []
  batchDialog.value = true
}
async function applyBatch() {
  const productIds = selectedItems.value.filter(id => products.value.some(p => p._id === id))
  const folderIds = selectedItems.value.filter(id => folders.value.some(f => f._id === id))
  if (productIds.length) await updateProductsViewers(productIds, batchUsers.value)
  if (folderIds.length) await updateFoldersViewers(folderIds, batchUsers.value)
  ElMessage.success('已更新可查看者')
  batchDialog.value = false
  selectedItems.value = []
  loadData(currentFolder.value?._id)
}

/* ---------- 詳細 / 審查 ---------- */
async function showDetailFor(item, type) {
  detailType.value = type
  if (type === 'folder') editingFolder.value = item

  detail.value.title = type === 'product' ? (item.name || '') : (item.name || '')
  detail.value.description = item.description || ''
  detail.value.script = item.script || ''
  detail.value.tags = Array.isArray(item.tags) ? [...item.tags] : []
  detail.value.allowedUsers = Array.isArray(item.allowedUsers) ? [...item.allowedUsers] : []

  previewItem.value = type === 'product' ? item : null

  if (type === 'product') {
    stageProduct.value = item
    stageList.value = await fetchProductStages(item._id)
  } else {
    stageProduct.value = null
    stageList.value = await fetchFolderStages(item._id)
  }
  showDetail.value = true
}
async function saveDetail() {
  if (detailType.value === 'folder' && editingFolder.value) {
    await updateFolder(editingFolder.value._id, {
      name: detail.value.title, description: detail.value.description, script: detail.value.script,
      tags: detail.value.tags, allowedUsers: detail.value.allowedUsers
    })
  } else if (detailType.value === 'product' && previewItem.value) {
    await updateProduct(previewItem.value._id, {
      name: detail.value.title, description: detail.value.description, tags: detail.value.tags,
      ...(canManageViewers.value ? { allowedUsers: detail.value.allowedUsers } : {})
    })
  }
  ElMessage.success('已儲存')
  showDetail.value = false
  editingFolder.value = null
  loadData(currentFolder.value?._id)
}
async function handleDelete() {
  if (detailType.value === 'folder' && editingFolder.value) {
    await deleteFolder(editingFolder.value._id)
  } else if (detailType.value === 'product' && previewItem.value) {
    await deleteProduct(previewItem.value._id)
  }
  ElMessage.success('已刪除')
  showDetail.value = false
  loadData(currentFolder.value?._id)
}
async function review(status) {
  if (detailType.value === 'product' && previewItem.value) {
    await reviewProduct(previewItem.value._id, status)
  } else if (detailType.value === 'folder' && editingFolder.value) {
    await reviewFolder(editingFolder.value._id, status)
  }
  ElMessage.success('已更新狀態')
  showDetail.value = false
  loadData(currentFolder.value?._id)
}
async function toggleStage(stage) {
  if (detailType.value === 'product' && stageProduct.value) {
    await updateProductStage(stageProduct.value._id, stage._id, stage.completed)
  } else if (detailType.value === 'folder' && editingFolder.value) {
    await updateFolderStage(editingFolder.value._id, stage._id, stage.completed)
  }
  if (stage.completed) ElMessage.success('已完成階段')
}

/* ---------- 新增資料夾 ---------- */
async function createNewFolder() {
  if (!newFolderName.value.trim()) return
  await createFolder({ name: newFolderName.value.trim(), parentId: currentFolder.value?._id || null }, 'edited')
  newFolderName.value = ''
  loadData(currentFolder.value?._id)
}

/* ---------- 上傳 ---------- */
const progressList = ref({})
const handleProgress = (evt, f) => progressList.value[f.uid] = Math.round(evt.percent)
const handleSuccess = (_, f) => { progressList.value[f.uid] = 100; setTimeout(() => delete progressList.value[f.uid], 500); ElMessage.success('上傳完成'); loadData(currentFolder.value?._id) }
const handleError = (_, f) => delete progressList.value[f.uid]
async function uploadRequest({ file, onProgress, onSuccess, onError }) {
  try {
    await uploadProduct(file, currentFolder.value?._id, null, onProgress)
    onSuccess()
  } catch (e) { onError(e) }
}

/* ---------- 預覽 / 下載 ---------- */
async function previewProduct(p) {
  const url = await getProductUrl(p._id)
  previewItem.value = { ...p, url }
  previewVisible.value = true
}
async function downloadProduct(p) {
  const url = await getProductUrl(p._id, true)
  const link = document.createElement('a')
  link.href = url
  link.download = p.name || p.filename
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
}

/* ---------- 其他 ---------- */
const isImage = a => /\.(png|jpe?g|gif|webp)$/i.test(a?.filename || '')
const isDocument = a => /\.(docx?|pdf)$/i.test(a?.filename || '')
const docPreviewUrl = a => `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(a?.url || '')}`
</script>

<style scoped>
/* ==== 共用樣式；與 AssetLibrary 同步 ==== */
.card-base {
  width: 208px;
  min-width: 208px;
  display: flex;
  flex-direction: column;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.card-base :deep(.el-card__body) {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.desc-line {
  font-size: .75rem;
  line-height: 1.1rem;
  white-space: pre-line;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  font-size: .75rem;
  line-height: 1.1rem;
}

.tag-list .el-tag {
  margin-bottom: .25rem;
}

:not(.dark) .desc-line,
:not(.dark) .panel-body textarea,
:not(.dark) .panel-body .el-input__inner {
  color: #111827;
}

.dark .desc-line,
.dark .panel-body textarea,
.dark .panel-body .el-input__inner {
  color: #f3f4f6;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all .2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.panel-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, .15);
}

.panel-header .title {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex: 1;
}

.panel-header .title .text {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-body {
  flex: 1;
  padding: 1.5rem;
}

.panel-footer {
  padding: .75rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, .15);
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  background: rgba(0, 0, 0, .05);
}

.preview-media {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.folder-card :deep(.el-checkbox),
.product-card :deep(.el-checkbox) {
  min-width: 0 !important;
  flex: 1 1 0% !important;
  overflow: hidden !important;
}

.folder-card :deep(.el-checkbox__label),
.product-card :deep(.el-checkbox__label) {
  display: block !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.folder-card :deep(.el-card__header),
.product-card :deep(.el-card__header) {
  display: flex !important;
  align-items: center !important;
  gap: .5rem !important;
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.list-row {
  display: flex;
  align-items: center;
  padding: .5rem;
  border-bottom: 1px solid var(--el-border-color);
}

.list-row .name {
  flex: 1;
}

.tool-bar>div {
  flex: 1 1 auto;
}

@media (max-width:640px) {
  .tool-bar .w-52 {
    width: 100% !important;
  }
}

/* 審查顏色 */
.approved {
  border-color: var(--el-color-success);
}

.approved :deep(.el-card__body) {
  background-color: var(--el-color-success-light-9, #f0f9eb);
}

/* Stage list */
.detail-wrapper {
  display: flex;
  gap: 1rem;
}

.stage-body {
  min-width: 220px;
}

.stage-list {
  display: flex;
  flex-direction: column;
}

.stage-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stage-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
