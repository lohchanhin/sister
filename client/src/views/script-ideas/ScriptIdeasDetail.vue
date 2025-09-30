<template>
  <div class="script-ideas-detail">
    <template v-if="permissionError">
      <section class="permission-error">
        <i class="pi pi-lock"></i>
        <h2>無法檢視腳本詳情</h2>
        <p>{{ errorMessage }}</p>
        <Button label="返回列表" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
      </section>
    </template>
    <template v-else>
      <header class="detail-header">
        <div>
          <h2>{{ idea?.headline || '腳本詳情' }}</h2>
          <p class="subtitle">上傳影片素材並維護腳本文案內容</p>
        </div>
        <div class="actions">
          <Button label="返回列表" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
          <Button label="儲存變更" icon="pi pi-save" :loading="saving" @click="save" />
        </div>
      </header>

      <div v-if="loading" class="loading">載入腳本詳情中…</div>

      <div v-else class="detail-content">
        <Card class="detail-card">
          <template #title>影片上傳</template>
          <template #content>
            <p class="description">上傳影片檔案，供腳本團隊參考。支援常見影片格式。</p>
            <div class="upload-area">
              <FileUpload name="video" accept="video/*" :auto="false" :showUploadButton="false"
                :showCancelButton="false" :maxFileSize="1024 * 1024 * 1024" v-model:files="videoFiles"
                @select="onVideoSelect" @remove="onVideoRemove">
                <template #empty>
                  <span class="upload-placeholder">
                    <i class="pi pi-cloud-upload"></i>
                    <span>拖曳或選擇影片檔案</span>
                  </span>
                </template>
              </FileUpload>
              <div v-if="idea?.videoUrl && !removeVideo" class="current-video">
                <p>目前檔案：<a :href="idea.videoUrl" target="_blank" rel="noopener">{{ idea.videoName }}</a></p>
                <Button label="清除既有檔案" severity="secondary" text @click="toggleRemove" />
              </div>
              <div v-else-if="removeVideo" class="current-video muted">
                <p>儲存後將移除現有影片</p>
                <Button label="取消移除" severity="secondary" text @click="toggleRemove" />
              </div>
            </div>
          </template>
        </Card>

        <Card class="detail-card">
          <template #title>腳本內容</template>
          <template #content>
            <div class="form-grid">
              <span class="field">
                <label for="summary">綜合腳本</label>
                <Textarea id="summary" v-model="form.summaryScript" rows="4" autoResize />
              </span>
              <span class="field">
                <label for="title">標題</label>
                <InputText id="title" v-model="form.headline" />
              </span>
              <span class="field">
                <label for="first">第一段</label>
                <Textarea id="first" v-model="form.firstParagraph" rows="3" autoResize />
              </span>
              <span class="field">
                <label for="lines">台詞</label>
                <Textarea id="lines" v-model="form.dialogue" rows="4" autoResize />
              </span>
              <span class="field">
                <label for="keyLines">要講的台詞</label>
                <Textarea id="keyLines" v-model="form.keyLines" rows="3" autoResize />
              </span>
              <span class="field">
                <label for="feedback">修改意見</label>
                <Textarea id="feedback" v-model="form.feedback" rows="4" autoResize />
              </span>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import FileUpload from 'primevue/fileupload'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import {
  getScriptIdea,
  updateScriptIdea
} from '@/services/scriptIdeas'

const props = defineProps({
  clientId: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const idea = ref(null)
const videoFiles = ref([])
const videoFile = ref(null)
const removeVideo = ref(false)
const permissionError = ref(false)
const errorMessage = ref('')

const form = reactive({
  summaryScript: '',
  headline: '',
  firstParagraph: '',
  dialogue: '',
  keyLines: '',
  feedback: ''
})

const assignForm = (data) => {
  form.summaryScript = data.summaryScript || ''
  form.headline = data.headline || ''
  form.firstParagraph = data.firstParagraph || ''
  form.dialogue = data.dialogue || ''
  form.keyLines = data.keyLines || ''
  form.feedback = data.feedback || ''
}

const loadDetail = async () => {
  loading.value = true
  permissionError.value = false
  errorMessage.value = ''
  try {
    const data = await getScriptIdea(props.clientId, props.recordId)
    idea.value = data
    assignForm(data)
    removeVideo.value = false
    videoFiles.value = []
    videoFile.value = null
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      idea.value = null
    } else {
      toast.add({ severity: 'error', summary: '載入失敗', detail: '無法取得腳本詳情', life: 3000 })
    }
  } finally {
    loading.value = false
  }
}

const onVideoSelect = (event) => {
  const file = event.files?.[0]
  videoFile.value = file || null
  removeVideo.value = false
}

const onVideoRemove = () => {
  videoFile.value = null
}

const toggleRemove = () => {
  removeVideo.value = !removeVideo.value
  if (removeVideo.value) {
    videoFiles.value = []
    videoFile.value = null
  }
}

const buildPayload = () => ({
  ...form,
  video: videoFile.value || undefined,
  removeVideo: removeVideo.value ? 'true' : undefined
})

const save = async () => {
  saving.value = true
  try {
    await updateScriptIdea(props.clientId, props.recordId, buildPayload())
    toast.add({ severity: 'success', summary: '已儲存', detail: '腳本詳情更新成功', life: 2500 })
    await loadDetail()
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      toast.add({ severity: 'warn', summary: '無權限', detail: '您沒有腳本創意的編輯權限', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '儲存失敗', detail: '請稍後再試', life: 3000 })
    }
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'ScriptIdeasRecords', params: { clientId: props.clientId } })
}

onMounted(loadDetail)

watch(
  () => [props.clientId, props.recordId],
  () => {
    loadDetail()
  }
)
</script>

<style scoped>
.script-ideas-detail {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.loading {
  text-align: center;
  color: #6b7280;
}

.detail-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5rem;
}

.detail-card {
  height: 100%;
}

.permission-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #6b7280;
}

.permission-error i {
  font-size: 2rem;
  color: #ef4444;
}

.permission-error h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.permission-error p {
  margin: 0;
  max-width: 420px;
}

.description {
  margin-bottom: 1rem;
  color: #6b7280;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #6b7280;
}

.upload-placeholder i {
  font-size: 2rem;
}

.current-video {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
}

.current-video.muted {
  color: #6b7280;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: #374151;
}

@media (max-width: 640px) {
  .script-ideas-detail {
    padding: 1.5rem;
  }

  .detail-content {
    grid-template-columns: 1fr;
  }

  .actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
