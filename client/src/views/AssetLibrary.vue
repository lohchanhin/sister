<!-- AssetLibrary.vue – 修正版 -->
<template>
  <section class="asset-library p-6 flex gap-6 relative">

    <!-- =============== 左側格線區 =============== -->
    <div class="flex-1">
      <!-- 工具列 -->
      <div class="tool-bar flex flex-wrap gap-4 items-end mb-8">
        <el-button :disabled="!currentFolder" @click="goUp">返回上層</el-button>
        <el-input v-model="newFolderName" placeholder="新增資料夾名稱" class="w-56" @keyup.enter="createNewFolder" />
        <el-button type="primary" @click="createNewFolder">建立資料夾</el-button>
        <el-upload v-if="currentFolder" :http-request="uploadRequest" :on-progress="handleProgress"
          :on-success="handleSuccess" :on-error="handleError" :show-file-list="false">
          <el-button type="success">上傳檔案</el-button>
        </el-upload>

        <el-select v-model="filterTags" multiple placeholder="標籤篩選" style="min-width:150px">
          <el-option v-for="t in allTags" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button type="warning" :disabled="!selectedItems.length" @click="openBatch">批量設定可查看者</el-button>

      </div>

      <el-breadcrumb  separator="/" class="mb-2" style="font-size: larger;margin: 1rem;">
        <el-breadcrumb-item v-for="b in breadcrumb" :key="b._id" class="cursor-pointer" @click="loadData(b._id)">{{
          b.name }}</el-breadcrumb-item>
      </el-breadcrumb>

      <!-- 卡片格線 -->
      <transition-group name="fade-slide" tag="div" class="flex flex-wrap gap-5">

        <!-- ===== 資料夾卡 ===== -->
        <el-card v-for="f in folders" :key="f._id" class="folder-card card-base cursor-pointer" shadow="hover"
          @click="openFolder(f)">
          <template #header>
            <div class="flex items-center mb-2">
              <el-checkbox v-model="selectedItems" :label="f._id" @click.stop class="mr-1" />
              <div class="flex items-center gap-2 flex-1 truncate" @click.stop="openFolder(f)">
                <el-icon>
                  <Folder />
                </el-icon>
                <span class="font-medium">{{ f.name }}</span>
              </div>
              <el-button link size="small" @click.stop="showDetailFor(f, 'folder')"><el-icon>
                  <InfoFilled />
                </el-icon></el-button>
            </div>
          </template>
          <el-scrollbar max-height="60">
            <div class="desc-line">{{ f.description || '—' }}</div>
          </el-scrollbar>
          <div v-if="f.tags?.length" class="tag-list mt-1">
            <el-tag v-for="tag in f.tags" :key="tag" size="small" class="mr-1">{{ tag }}</el-tag>
          </div>
        </el-card>

        <!-- ===== 素材卡 ===== -->
        <el-card v-for="a in assets" :key="a._id" class="asset-card card-base cursor-pointer" shadow="never"
          @click="previewAsset(a)">
          <template #header>
            <div class="flex items-center mb-2">
              <el-checkbox v-model="selectedItems" :label="a._id" @click.stop class="mr-1" />
              <div class="flex-1 truncate" :title="a.title || a.filename">📄 {{ a.title || a.filename }}</div>
              <el-button link size="small" @click.stop="showDetailFor(a, 'asset')"><el-icon>
                  <InfoFilled />
                </el-icon></el-button>
            </div>
          </template>
          <el-scrollbar max-height="60">
            <div class="desc-line">{{ a.description || '—' }}</div>
          </el-scrollbar>
          <div v-if="a.tags?.length" class="tag-list mt-1">
            <el-tag v-for="tag in a.tags" :key="tag" size="small" class="mr-1">{{ tag }}</el-tag>
          </div>
        </el-card>

      </transition-group>
    </div>



    <!-- =============== 詳細資訊 Dialog =============== -->
    <el-dialog v-model="showDetail" width="40%" top="10vh" :modal="true" append-to-body>
      <template #header>
        <header class="panel-header" :style="{ '--panel-bg': sidebarBg }">
          <div class="title">
            <el-icon>
              <InfoFilled />
            </el-icon>
            <span class="text">{{ detail.title || detail.name || detailTitle }}</span>
          </div>
        </header>
      </template>



      <el-scrollbar class="panel-body">
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
          <el-form-item v-if="detailType === 'folder' && isManager" label="可存取使用者">
            <el-select v-model="detail.allowedUsers" multiple filterable style="width:100%">
              <el-option v-for="u in users" :key="u._id" :label="u.username" :value="u._id" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-scrollbar>

      <template #footer>
        <div class="panel-footer">
          <el-popconfirm :title="`確定刪除${detailType === 'folder' ? '資料夾' : '素材'}？`" confirm-button-text="刪除"
            cancel-button-text="取消" confirm-button-type="danger" @confirm="handleDelete">
            <template #reference><el-button size="small" type="danger">刪除</el-button></template>
          </el-popconfirm>
          <el-button size="small" @click="showDetail = false">取消</el-button>
          <el-button size="small" type="primary" @click="saveDetail">儲存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialog" width="30%" top="20vh">
      <template #header>批量設定可查看者</template>
      <el-select v-model="batchUsers" multiple filterable style="width:100%" class="mb-4">
        <el-option v-for="u in users" :key="u._id" :label="u.username" :value="u._id" />
      </el-select>
      <template #footer>
        <el-button @click="batchDialog = false">取消</el-button>
        <el-button type="primary" @click="applyBatch">套用</el-button>
      </template>
    </el-dialog>

    <!-- =============== 素材預覽 Dialog =============== -->
    <el-dialog v-model="previewVisible" width="60%" top="5vh" :destroy-on-close="true">
      <template #header>{{ previewItem?.title || previewItem?.filename }}</template>

      <!-- 讓媒體自適應：max-width:100% + max-height:70vh -->
      <div class="w-full flex justify-center">
        <img v-if="isImage(previewItem)" :src="previewItem.url" class="preview-media" />
        <video v-else controls class="preview-media">
          <source :src="previewItem.url" type="video/mp4" />
        </video>
      </div>

      <template #footer>
        <el-button type="primary" @click="downloadAsset(previewItem)">下載</el-button>
        <el-button @click="previewVisible = false">關閉</el-button>
      </template>
    </el-dialog>


  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { fetchFolders, createFolder, updateFolder, getFolder, deleteFolder } from '../services/folders'
import { fetchAssets, uploadAsset, updateAsset, deleteAsset, updateAssetsViewers } from '../services/assets'
import { fetchUsers } from '../services/user'
import { fetchTags } from '../services/tags'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { Folder, InfoFilled, Close, Download } from '@element-plus/icons-vue'

const folders = ref([])
const assets = ref([])
const currentFolder = ref(null)
const editingFolder = ref(null)

const store = useAuthStore()
const isManager = computed(() => store.role === 'manager')

const detail = ref({ title: '', description: '', script: '', tags: [], allowedUsers: [] })
const showDetail = ref(false)
const detailType = ref('folder')   // 'folder' | 'asset'
const newFolderName = ref('')
const filterTags = ref([])
const allTags = ref([])

const users = ref([])
const selectedItems = ref([])
const batchDialog = ref(false)
const batchUsers = ref([])

const breadcrumb = ref([])

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

const loadUsers = async () => {
  users.value = await fetchUsers()
}

const loadTags = async () => {
  const list = await fetchTags()
  allTags.value = list.map(t => t.name)
}

/* 預覽 Dialog */
const previewVisible = ref(false)
const previewItem = ref(null)
const isImage = a => /\.(png|jpe?g|gif|webp)$/i.test(a?.filename || '')

/* 主題色 */
const sidebarBg = computed(() => getComputedStyle(document.querySelector('.sidebar')).backgroundColor || '#1f2937')
const detailTitle = computed(() => previewItem.value ? previewItem.value.filename : currentFolder.value?.name || '資訊')

async function loadData(id = null) {
  folders.value = await fetchFolders(id, filterTags.value, 'raw')
  assets.value = id ? await fetchAssets(id, 'raw', filterTags.value) : []
  currentFolder.value = id ? await getFolder(id) : null
  breadcrumb.value = currentFolder.value
    ? await buildBreadcrumb(currentFolder.value)
    : []
  selectedItems.value = []
}

onMounted(() => {
  loadData()
  loadTags()
  if (isManager.value) loadUsers()
})
watch(filterTags, () => loadData(currentFolder.value?._id || null))

function openFolder(f) { loadData(f._id) }
function goUp() { loadData(currentFolder.value?.parentId || null) }

function showDetailFor(item, type) {
  detailType.value = type
  if (type === 'folder') editingFolder.value = item

  detail.value.title = item.title || item.name || item.filename || ''
  detail.value.description = item.description || ''
  detail.value.script = item.script || ''
  detail.value.tags = Array.isArray(item.tags) ? [...item.tags] : []
  detail.value.allowedUsers = Array.isArray(item.allowedUsers) ? [...item.allowedUsers] : []

  previewItem.value = type === 'asset' ? item : null
  showDetail.value = true
}

async function saveDetail() {
  if (detailType.value === 'folder' && editingFolder.value) {
    await updateFolder(editingFolder.value._id, {
      name: detail.value.title,
      description: detail.value.description,
      script: detail.value.script,
      tags: detail.value.tags,
      allowedUsers: detail.value.allowedUsers
    })
  } else if (detailType.value === 'asset' && previewItem.value) {
    await updateAsset(previewItem.value._id, {
      title: detail.value.title,
      description: detail.value.description,
      tags: detail.value.tags
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
    ElMessage.success('資料夾已刪除')
    loadData(currentFolder.value?._id)
  } else if (detailType.value === 'asset' && previewItem.value) {
    await deleteAsset(previewItem.value._id)
    ElMessage.success('素材已刪除')
    loadData(currentFolder.value?._id)
  }
  showDetail.value = false
  editingFolder.value = null
}

async function createNewFolder() {
  if (!newFolderName.value.trim()) return
  await createFolder({ name: newFolderName.value.trim(), parentId: currentFolder.value?._id || null }, 'raw')
  newFolderName.value = ''
  loadData(currentFolder.value?._id)
}

const progressList = ref({})

function handleProgress(evt, file) {
  progressList.value[file.uid] = Math.round(evt.percent)
}

function handleSuccess(_, file) {
  progressList.value[file.uid] = 100
  setTimeout(() => delete progressList.value[file.uid], 500)
  ElMessage.success('上傳完成')
  loadData(currentFolder.value?._id)
}

function handleError(_, file) {
  delete progressList.value[file.uid]
}

function openBatch() {
  batchUsers.value = []
  batchDialog.value = true
}

async function applyBatch() {
  const ids = selectedItems.value.filter(id =>
    assets.value.some(a => a._id === id)
  )
  if (!ids.length) {
    batchDialog.value = false
    return
  }
  await updateAssetsViewers(ids, batchUsers.value)
  batchDialog.value = false
  selectedItems.value = []
  loadData(currentFolder.value?._id)
}

async function uploadRequest({ file, onProgress, onSuccess, onError }) {
  try {
    await uploadAsset(file, currentFolder.value?._id, null, onProgress)
    onSuccess()
  } catch (e) {
    onError(e)
  }
}

function previewAsset(a) {
  // 如果 url 已經以 /static/ 開頭就不重複加
  const url = /^\/static\//.test(a.url) ? a.url : `/static/${a.filename}`
  previewItem.value = { ...a, url }
  console.log('[預覽素材]', url)
  previewVisible.value = true
}

function downloadAsset(asset) {
  const url = /^\/static\//.test(asset.url)
    ? asset.url
    : `/static/${asset.filename}`
  const link = document.createElement('a')
  link.href = url
  link.download = asset.title || asset.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>


<style scoped>
/* ================== 卡片 ================== */
.card-base {
  width: 208px;
  min-width: 208px;
  height: auto;
  min-height: auto;
  display: flex;
  flex-direction: column;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.card-base :deep(.el-card__body) {
  min-height: 150px;
  /* body 最小高度 */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.folder-card .el-icon {
  font-size: 1.2rem;
}

.desc-line {
  font-size: .75rem;
  line-height: 1.1rem;
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

/* 亮 / 暗文字 */
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

/* ===== 動畫 ===== */
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

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform .25s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}

/* ================= 右側面板 ================= */

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
  overscroll-behavior: contain;
}

.panel-footer {
  padding: .75rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, .15);
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  background: rgba(0, 0, 0, .05);
}

.panel-body :deep(.el-scrollbar__bar) {
  display: none;
}

/* 預覽圖片 / 影片：限制寬高，保持比例 */
.preview-media {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  /* 影片、圖片皆等比縮放 */
}
</style>
