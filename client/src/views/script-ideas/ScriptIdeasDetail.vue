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
          <p class="subtitle">設定標題與段落內容，快速完成腳本紀錄</p>
        </div>
        <div class="actions">
          <Button
            label="下載腳本"
            icon="pi pi-download"
            severity="secondary"
            :disabled="loading || saving"
            @click="downloadScript"
          />
          <Button label="返回列表" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
          <Button label="儲存變更" icon="pi pi-save" :loading="saving" @click="save" />
        </div>
      </header>

      <div v-if="loading" class="loading">載入腳本詳情中…</div>

      <Card v-else class="detail-card">
        <template #title>腳本內容</template>
        <template #content>
          <div class="simple-form">
            <span class="field">
              <label for="title">標題</label>
              <InputText id="title" v-model="form.headline" placeholder="請輸入腳本標題" />
            </span>

            <div v-for="(paragraph, index) in form.paragraphs" :key="index" class="paragraph-field">
              <div class="paragraph-field__header">
                <label :for="`paragraph-${index}`">第 {{ index + 1 }} 段內容</label>
                <Button
                  v-if="index > 0"
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  @click="removeParagraph(index)"
                />
              </div>
              <Textarea
                :id="`paragraph-${index}`"
                v-model="form.paragraphs[index]"
                :autoResize="true"
                rows="4"
                placeholder="請輸入段落內容"
              />
            </div>

            <div class="paragraph-actions">
              <Button
                v-if="canAddParagraph"
                label="新增段落"
                icon="pi pi-plus"
                text
                @click="addParagraph"
              />
              <p class="paragraph-hint">可依需求新增或移除第二、第三段內容。</p>
            </div>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import { getScriptIdea, updateScriptIdea } from '@/services/scriptIdeas'

const MAX_PARAGRAPHS = 3

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
const permissionError = ref(false)
const errorMessage = ref('')

const form = reactive({
  headline: '',
  paragraphs: ['']
})

const canAddParagraph = computed(() => form.paragraphs.length < MAX_PARAGRAPHS)

const ensureAtLeastOneParagraph = () => {
  if (form.paragraphs.length === 0) {
    form.paragraphs.push('')
  }
}

const parseStoryboard = (storyboard) => {
  if (Array.isArray(storyboard)) return storyboard
  if (typeof storyboard === 'string') {
    try {
      const parsed = JSON.parse(storyboard)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.warn('[ScriptIdeasDetail] 無法解析故事板資料', error)
    }
  }
  return []
}

const extractParagraphs = (data = {}) => {
  const paragraphs = []
  const storyboard = parseStoryboard(data.storyboard)
  storyboard.forEach((scene) => {
    const narration = (scene?.narration || '').trim()
    if (narration) {
      paragraphs.push(scene.narration)
    }
  })
  if (!paragraphs.length && typeof data.firstParagraph === 'string' && data.firstParagraph.trim()) {
    paragraphs.push(data.firstParagraph)
  }
  if (!paragraphs.length && typeof data.summaryScript === 'string' && data.summaryScript.trim()) {
    paragraphs.push(data.summaryScript)
  }
  if (!paragraphs.length && typeof data.dialogue === 'string' && data.dialogue.trim()) {
    paragraphs.push(data.dialogue)
  }
  return paragraphs.slice(0, MAX_PARAGRAPHS)
}

const assignForm = (data = {}) => {
  form.headline = data.headline || ''
  const paragraphs = extractParagraphs(data)
  form.paragraphs.splice(0, form.paragraphs.length, ...paragraphs)
  ensureAtLeastOneParagraph()
}

const loadDetail = async () => {
  loading.value = true
  permissionError.value = false
  errorMessage.value = ''
  try {
    const data = await getScriptIdea(props.clientId, props.recordId)
    idea.value = data
    assignForm(data)
    console.info('[ScriptIdeasDetail] 已載入腳本詳情', {
      clientId: props.clientId,
      ideaId: props.recordId
    })
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      idea.value = null
      console.warn('[ScriptIdeasDetail] 檢視腳本詳情權限不足', error)
    } else {
      toast.add({ severity: 'error', summary: '載入失敗', detail: '無法取得腳本詳情', life: 3000 })
      console.error('[ScriptIdeasDetail] 載入腳本詳情失敗', error)
    }
  } finally {
    loading.value = false
  }
}

const buildPayload = () => {
  const trimmedParagraphs = form.paragraphs.map((text) => text.trim())
  const filledParagraphs = trimmedParagraphs
    .map((text, index) => ({ text, index }))
    .filter(({ text }) => text)
    .map(({ text }) => text)

  const storyboard = filledParagraphs.map((text, index) => ({
    stage: `段落 ${index + 1}`,
    narration: text,
    visuals: '',
    assets: '',
    cta: '',
    notes: ''
  }))

  const firstNarration = filledParagraphs[0]?.split('\n')[0] || ''

  return {
    headline: form.headline,
    summaryScript: '',
    dialogue: '',
    keyLines: '',
    feedback: '',
    targetAudience: '',
    corePromise: '',
    visualTone: '',
    templateId: '',
    storyboard: JSON.stringify(storyboard),
    firstParagraph: firstNarration
  }
}

const save = async () => {
  saving.value = true
  try {
    await updateScriptIdea(props.clientId, props.recordId, buildPayload())
    toast.add({ severity: 'success', summary: '已儲存', detail: '腳本詳情更新成功', life: 2500 })
    await loadDetail()
    console.info('[ScriptIdeasDetail] 已儲存腳本詳情', {
      clientId: props.clientId,
      ideaId: props.recordId,
      paragraphCount: form.paragraphs.filter((text) => text.trim()).length
    })
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      toast.add({ severity: 'warn', summary: '無權限', detail: '您沒有腳本創意的編輯權限', life: 3000 })
      console.warn('[ScriptIdeasDetail] 儲存腳本詳情權限不足', error)
    } else {
      toast.add({ severity: 'error', summary: '儲存失敗', detail: '請稍後再試', life: 3000 })
      console.error('[ScriptIdeasDetail] 儲存腳本詳情失敗', error)
    }
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'ScriptIdeasRecords', params: { clientId: props.clientId } })
}

const addParagraph = () => {
  if (!canAddParagraph.value) return
  form.paragraphs.push('')
}

const removeParagraph = (index) => {
  if (index <= 0 || index >= form.paragraphs.length) return
  form.paragraphs.splice(index, 1)
  ensureAtLeastOneParagraph()
}

const downloadScript = () => {
  if (loading.value || saving.value) return

  const headline = (form.headline || idea.value?.headline || '').trim()
  const paragraphs = form.paragraphs.map((text) => text.trim()).filter(Boolean)

  if (!headline && !paragraphs.length) {
    toast.add({ severity: 'warn', summary: '無內容', detail: '目前沒有可下載的腳本內容', life: 2500 })
    console.info('[ScriptIdeasDetail] 嘗試下載但沒有腳本內容', {
      clientId: props.clientId,
      ideaId: props.recordId
    })
    return
  }

  const titleLine = headline ? `標題：${headline}` : '腳本內容'
  const paragraphLines = paragraphs.map((text, index) => [`段落 ${index + 1}`, text].join('\n'))
  const content = [titleLine, ...paragraphLines].join('\n\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const formattedDate = new Date().toISOString().slice(0, 10)
  const safeTitle = (headline || 'script-idea').replace(/[\\/:*?"<>|]/g, '').trim() || 'script-idea'
  link.href = objectUrl
  link.download = `${safeTitle}-${formattedDate}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)

  console.info('[ScriptIdeasDetail] 已下載腳本內容', {
    clientId: props.clientId,
    ideaId: props.recordId,
    headline,
    paragraphCount: paragraphs.length
  })
}

watch(
  () => [props.clientId, props.recordId],
  () => {
    loadDetail()
  }
)

onMounted(loadDetail)
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

.detail-card {
  height: 100%;
}

.simple-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.paragraph-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.paragraph-field__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.paragraph-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.paragraph-hint {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.permission-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1.5rem;
  border: 1px dashed #d1d5db;
  border-radius: 1rem;
  text-align: center;
  color: #4b5563;
}

.permission-error i {
  font-size: 2rem;
  color: #9ca3af;
}
</style>
