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
          <div class="scripts-form">
            <div
              v-for="(script, scriptIndex) in form.scripts"
              :key="scriptIndex"
              class="script-block"
            >
              <div class="script-block__header">
                <h3>腳本 {{ scriptIndex + 1 }}</h3>
              </div>

              <span class="field">
                <label :for="`script-${scriptIndex}-title`">標題</label>
                <InputText
                  :id="`script-${scriptIndex}-title`"
                  v-model="form.scripts[scriptIndex].title"
                  placeholder="請輸入腳本標題"
                />
              </span>

              <div
                v-for="(paragraph, paragraphIndex) in script.paragraphs"
                :key="paragraphIndex"
                class="paragraph-field"
              >
                <div class="paragraph-field__header">
                  <label :for="`script-${scriptIndex}-paragraph-${paragraphIndex}`">
                    段落 {{ paragraphIndex + 1 }} 內容
                  </label>
                  <Button
                    v-if="paragraphIndex > 0"
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    @click="removeParagraph(scriptIndex, paragraphIndex)"
                  />
                </div>
                <Textarea
                  :id="`script-${scriptIndex}-paragraph-${paragraphIndex}`"
                  v-model="form.scripts[scriptIndex].paragraphs[paragraphIndex]"
                  :autoResize="true"
                  rows="4"
                  placeholder="請輸入段落內容"
                />
              </div>

              <div class="paragraph-actions">
                <Button
                  v-if="canAddParagraph(scriptIndex)"
                  label="新增段落"
                  icon="pi pi-plus"
                  text
                  @click="addParagraph(scriptIndex)"
                />
                <p class="paragraph-hint">可依需求新增或移除段落內容。</p>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
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
  scripts: []
})

const createEmptyScript = () => ({
  title: '',
  paragraphs: ['']
})

const ensureParagraphs = (script) => {
  if (!Array.isArray(script.paragraphs)) {
    script.paragraphs = ['']
  }
  if (script.paragraphs.length === 0) {
    script.paragraphs.push('')
  }
}

const ensureScripts = (count) => {
  const target = Number.isFinite(count) && count > 0 ? count : 1
  while (form.scripts.length < target) {
    form.scripts.push(createEmptyScript())
  }
  if (form.scripts.length > target) {
    form.scripts.splice(target)
  }
  form.scripts.forEach((script) => ensureParagraphs(script))
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

const sanitizeScript = (script = {}) => {
  const sanitized = {
    title: typeof script.title === 'string' ? script.title : ''
  }
  if (Array.isArray(script.paragraphs) && script.paragraphs.length > 0) {
    sanitized.paragraphs = script.paragraphs.map((text) => (typeof text === 'string' ? text : ''))
  } else {
    sanitized.paragraphs = ['']
  }
  return sanitized
}

const buildScriptsFromIdea = (data = {}) => {
  const expectedCount = Math.max(Number(data.scriptCount) || 0, 1)
  let scripts = []
  if (Array.isArray(data.scripts) && data.scripts.length > 0) {
    scripts = data.scripts.map((item) => sanitizeScript(item))
  } else {
    scripts = [
      sanitizeScript({
        title: data.headline || '',
        paragraphs: extractParagraphs(data)
      })
    ]
  }
  while (scripts.length < expectedCount) {
    scripts.push(createEmptyScript())
  }
  return scripts.slice(0, Math.max(expectedCount, scripts.length))
}

const assignForm = (data = {}) => {
  const scripts = buildScriptsFromIdea(data)
  form.scripts.splice(0, form.scripts.length, ...scripts)
  ensureScripts(scripts.length || 1)
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

const buildScriptsPayload = () =>
  form.scripts.map((script) => ({
    title: script.title.trim(),
    paragraphs: script.paragraphs.map((text) => text.trim())
  }))

const buildLegacyFields = (scriptsPayload) => {
  const firstScript = scriptsPayload[0] || { title: '', paragraphs: [] }
  const filledParagraphs = firstScript.paragraphs.filter((text) => text)
  const storyboard = filledParagraphs.map((text, index) => ({
    stage: `腳本 1 - 段落 ${index + 1}`,
    narration: text,
    visuals: '',
    assets: '',
    cta: '',
    notes: ''
  }))
  return {
    headline: firstScript.title || idea.value?.headline || '',
    summaryScript: filledParagraphs.join('\n\n') || idea.value?.summaryScript || '',
    firstParagraph: filledParagraphs[0] || idea.value?.firstParagraph || '',
    dialogue: idea.value?.dialogue || '',
    keyLines: idea.value?.keyLines || '',
    feedback: idea.value?.feedback || '',
    targetAudience: idea.value?.targetAudience || '',
    corePromise: idea.value?.corePromise || '',
    visualTone: idea.value?.visualTone || '',
    templateId: idea.value?.templateId || '',
    storyboard: JSON.stringify(storyboard)
  }
}

const buildPayload = (scriptsPayload = buildScriptsPayload()) => {
  const scriptCount = Math.max(idea.value?.scriptCount || 0, scriptsPayload.length)
  return {
    ...buildLegacyFields(scriptsPayload),
    scripts: JSON.stringify(scriptsPayload),
    scriptCount
  }
}

const save = async () => {
  saving.value = true
  try {
    const scriptsPayload = buildScriptsPayload()
    const payload = buildPayload(scriptsPayload)
    await updateScriptIdea(props.clientId, props.recordId, payload)
    toast.add({ severity: 'success', summary: '已儲存', detail: '腳本詳情更新成功', life: 2500 })
    await loadDetail()
    const totalParagraphs = scriptsPayload.reduce((count, script) => {
      const filled = script.paragraphs.filter((text) => text).length
      return count + filled
    }, 0)
    console.info('[ScriptIdeasDetail] 已儲存腳本詳情', {
      clientId: props.clientId,
      ideaId: props.recordId,
      scriptCount: scriptsPayload.length,
      paragraphCount: totalParagraphs
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

const canAddParagraph = (scriptIndex) => {
  const script = form.scripts[scriptIndex]
  if (!script) return false
  return script.paragraphs.length < MAX_PARAGRAPHS
}

const addParagraph = (scriptIndex) => {
  if (!canAddParagraph(scriptIndex)) return
  form.scripts[scriptIndex].paragraphs.push('')
}

const removeParagraph = (scriptIndex, paragraphIndex) => {
  const script = form.scripts[scriptIndex]
  if (!script) return
  if (paragraphIndex <= 0 || paragraphIndex >= script.paragraphs.length) return
  script.paragraphs.splice(paragraphIndex, 1)
  ensureParagraphs(script)
}

const downloadScript = () => {
  if (loading.value || saving.value) return

  const scriptsPayload = buildScriptsPayload()
  const nonEmptyScripts = scriptsPayload.filter((script) => {
    const hasTitle = Boolean(script.title)
    const hasParagraph = script.paragraphs.some((text) => text)
    return hasTitle || hasParagraph
  })

  if (!nonEmptyScripts.length) {
    toast.add({ severity: 'warn', summary: '無內容', detail: '目前沒有可下載的腳本內容', life: 2500 })
    console.info('[ScriptIdeasDetail] 嘗試下載但沒有腳本內容', {
      clientId: props.clientId,
      ideaId: props.recordId
    })
    return
  }

  const contentBlocks = nonEmptyScripts.map((script, index) => {
    const titleLine = script.title ? `腳本 ${index + 1}：${script.title}` : `腳本 ${index + 1}`
    const paragraphLines = script.paragraphs
      .map((text, paragraphIndex) => (text ? [`段落 ${paragraphIndex + 1}`, text].join('\n') : ''))
      .filter(Boolean)
    return [titleLine, ...paragraphLines].join('\n\n')
  })

  const content = contentBlocks.join('\n\n')

  const primaryTitle = scriptsPayload[0]?.title || idea.value?.headline || '腳本內容'

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const formattedDate = new Date().toISOString().slice(0, 10)
  const safeTitle = (primaryTitle || 'script-idea').replace(/[\\/:*?"<>|]/g, '').trim() || 'script-idea'
  link.href = objectUrl
  link.download = `${safeTitle}-${formattedDate}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)

  console.info('[ScriptIdeasDetail] 已下載腳本內容', {
    clientId: props.clientId,
    ideaId: props.recordId,
    scriptCount: nonEmptyScripts.length
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

.scripts-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.script-block {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background-color: #fff;
}

.script-block__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.script-block__header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
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
