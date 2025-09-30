<template>
  <div class="popular-xhs">
    <header class="xhs-header">
      <Button label="返回平台" icon="pi pi-arrow-left" class="p-button-text" @click="goBack" />
      <div class="title-group">
        <h1>{{ clientName }}</h1>
        <p>上傳小紅書爆款內容並追蹤關鍵指標</p>
      </div>
    </header>

    <section class="upload-section">
      <h2>新增影片</h2>
      <div class="upload-grid">
        <FileUpload
          ref="fileUploadRef"
          name="cover"
          mode="basic"
          :auto="false"
          :customUpload="true"
          accept="image/*"
          chooseLabel="選擇封面截圖"
          @select="handleFileSelect"
          @clear="handleFileClear"
        />
        <input v-model="newVideo.title" type="text" placeholder="影片名稱" />
        <input v-model="newVideo.publishDate" type="date" />
        <Button label="儲存影片" icon="pi pi-save" class="p-button-rounded" @click="saveNewVideo" />
      </div>
      <p v-if="uploadError" class="error">{{ uploadError }}</p>
    </section>

    <section class="cards-section">
      <header class="cards-header">
        <h2>影片列表</h2>
        <span class="hint">點擊卡片檢視與編輯指標</span>
      </header>
      <div v-if="loading" class="loading">載入小紅書爆款資料中…</div>
      <p v-else-if="contents.length === 0" class="empty">目前尚未建立任何爆款紀錄</p>
      <div v-else class="card-grid">
        <article v-for="item in contents" :key="item._id" class="xhs-card" @click="openDialog(item)">
          <div class="cover" :class="{ 'cover--empty': !item.coverUrl }">
            <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" />
            <span v-else>尚未上傳封面</span>
          </div>
          <div class="card-body">
            <h3>{{ item.title }}</h3>
            <p class="date">發布：{{ formatDate(item.publishDate) }}｜截止：{{ formatDate(item.dueDate) }}</p>
            <ul class="metric-list">
              <li>曝光：{{ formatNumber(item.exposure) }}</li>
              <li>觀看：{{ formatNumber(item.viewCount) }}</li>
              <li>CTR：{{ item.coverCtr ? item.coverCtr + '%' : '-' }}</li>
            </ul>
            <div v-if="item.trendLink" class="trend">趨勢連結：{{ item.trendLink }}</div>
          </div>
          <button class="delete-button" @click.stop="deleteContent(item)">
            <i class="pi pi-trash"></i>
          </button>
        </article>
      </div>
    </section>

    <PopularDataCardDialog
      v-model="dialogVisible"
      :content="activeContent"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import { getClient } from '@/services/clients'
import {
  listPopularContents,
  createPopularContent,
  updatePopularContent,
  deletePopularContent,
  uploadPopularContentCover
} from '@/services/popularData'
import PopularDataCardDialog from './PopularDataCardDialog.vue'

const props = defineProps({
  clientId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const toast = useToast()

const clientName = ref('小紅書爆款數據')
const fileUploadRef = ref(null)
const newVideo = reactive({
  title: '',
  publishDate: '',
  file: null
})
const uploadError = ref('')
const loading = ref(true)
const contents = ref([])
const dialogVisible = ref(false)
const activeContent = ref(null)

const goBack = () => {
  router.push({ name: 'PopularDataPlatforms', params: { clientId: props.clientId } })
}

const handleFileSelect = (event) => {
  newVideo.file = event.files?.[0] || null
}

const handleFileClear = () => {
  newVideo.file = null
}

const resetForm = () => {
  newVideo.title = ''
  newVideo.publishDate = ''
  newVideo.file = null
  uploadError.value = ''
  fileUploadRef.value?.clear?.()
}

const loadContents = async () => {
  loading.value = true
  try {
    const data = await listPopularContents(props.clientId, 'xhs')
    contents.value = data.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
  } catch (error) {
    toast.add({ severity: 'error', summary: '讀取失敗', detail: '無法取得爆款資料', life: 3000 })
  } finally {
    loading.value = false
  }
}

const saveNewVideo = async () => {
  if (!newVideo.title.trim()) {
    uploadError.value = '請輸入影片名稱'
    return
  }
  if (!newVideo.publishDate) {
    uploadError.value = '請選擇發布日期'
    return
  }
  if (!newVideo.file) {
    uploadError.value = '請選擇封面截圖'
    return
  }

  uploadError.value = ''
  try {
    const payload = {
      platformKey: 'xhs',
      title: newVideo.title,
      publishDate: new Date(newVideo.publishDate).toISOString()
    }
    const created = await createPopularContent(props.clientId, payload)
    await uploadPopularContentCover(props.clientId, created._id, newVideo.file)
    toast.add({ severity: 'success', summary: '已建立', detail: '新影片已建立並上傳封面', life: 3000 })
    resetForm()
    await loadContents()
  } catch (error) {
    toast.add({ severity: 'error', summary: '建立失敗', detail: '請稍後再試', life: 3000 })
  }
}

const openDialog = (item) => {
  activeContent.value = { ...item }
  dialogVisible.value = true
}

const handleSave = async (payload) => {
  if (!activeContent.value) return
  try {
    const updated = await updatePopularContent(props.clientId, activeContent.value._id, payload)
    toast.add({ severity: 'success', summary: '已更新', detail: '影片指標已更新', life: 3000 })
    dialogVisible.value = false
    contents.value = contents.value.map((item) => (item._id === updated._id ? updated : item))
    activeContent.value = null
  } catch (error) {
    toast.add({ severity: 'error', summary: '更新失敗', detail: '指標儲存失敗', life: 3000 })
  }
}

const deleteContent = async (item) => {
  const confirmDelete = window.confirm(`確定刪除「${item.title}」嗎？`)
  if (!confirmDelete) return
  try {
    await deletePopularContent(props.clientId, item._id)
    toast.add({ severity: 'success', summary: '已刪除', detail: '影片紀錄已刪除', life: 3000 })
    contents.value = contents.value.filter((content) => content._id !== item._id)
  } catch (error) {
    toast.add({ severity: 'error', summary: '刪除失敗', detail: '無法刪除影片', life: 3000 })
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-TW')
}

const formatNumber = (value) => {
  const num = Number(value)
  if (!num) return '0'
  return Intl.NumberFormat('zh-TW').format(num)
}

onMounted(async () => {
  try {
    const client = await getClient(props.clientId)
    clientName.value = `${client.name}｜小紅書爆款` || '小紅書爆款數據'
  } catch {
    clientName.value = '小紅書爆款數據'
  }
  await loadContents()
})
</script>

<style scoped>
.popular-xhs {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.xhs-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.title-group h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.title-group p {
  margin: 0.25rem 0 0;
  color: #6b7280;
}

.upload-section {
  background: #fff7ed;
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 20px 45px rgba(249, 115, 22, 0.15);
}

.upload-section h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  color: #fb7185;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  align-items: end;
}

.upload-grid input[type='text'],
.upload-grid input[type='date'] {
  border: 1px solid #fbd1b8;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: inherit;
}

.error {
  margin-top: 1rem;
  color: #dc2626;
}

.cards-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cards-header h2 {
  margin: 0;
}

.hint {
  color: #9ca3af;
}

.loading {
  color: #6b7280;
}

.empty {
  color: #9ca3af;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

.xhs-card {
  position: relative;
  background: #ffffff;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.xhs-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
}

.cover {
  height: 180px;
  background: linear-gradient(135deg, #fde68a, #f97316);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover--empty {
  color: #fff7ed;
  font-weight: 600;
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-body h3 {
  margin: 0;
  font-size: 1.25rem;
}

.date {
  color: #6b7280;
}

.metric-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #374151;
}

.trend {
  color: #f97316;
  word-break: break-all;
}

.delete-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  border-radius: 999px;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.delete-button:hover {
  background: rgba(220, 38, 38, 0.85);
}

@media (max-width: 600px) {
  .popular-xhs {
    padding: 1.5rem;
  }
}
</style>
