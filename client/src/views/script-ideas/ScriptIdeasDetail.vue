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
          <p class="subtitle">集中管理腳本思考與段落內容</p>
        </div>
        <div class="actions">
          <Button label="返回列表" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
          <Button label="儲存變更" icon="pi pi-save" :loading="saving" @click="save" />
        </div>
      </header>

      <div v-if="loading" class="loading">載入腳本詳情中…</div>

      <div v-else class="detail-content">
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
            <div class="paragraphs">
              <header class="paragraphs__header">
                <h3>腳本段落</h3>
                <Button label="新增段落" icon="pi pi-plus" text @click="addParagraph" />
              </header>
              <div v-if="form.paragraphs.length === 0" class="paragraphs__empty">目前沒有任何段落，請新增。</div>
              <div v-else class="paragraphs__list">
                <div v-for="(paragraph, index) in form.paragraphs" :key="index" class="paragraphs__item">
                  <label :for="`paragraph-${index}`">段落 {{ index + 1 }}</label>
                  <Textarea :id="`paragraph-${index}`" v-model="form.paragraphs[index]" rows="3" autoResize />
                  <Button v-if="form.paragraphs.length > 1" icon="pi pi-trash" severity="danger" text
                    @click="removeParagraph(index)" />
                </div>
              </div>
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
const permissionError = ref(false)
const errorMessage = ref('')

const form = reactive({
  summaryScript: '',
  headline: '',
  paragraphs: [],
  dialogue: '',
  keyLines: '',
  feedback: ''
})

const assignForm = (data) => {
  form.summaryScript = data.summaryScript || ''
  form.headline = data.headline || ''
  if (Array.isArray(data.paragraphs)) {
    form.paragraphs = data.paragraphs.length ? [...data.paragraphs] : ['']
  } else if (data.firstParagraph) {
    form.paragraphs = [data.firstParagraph]
  } else {
    form.paragraphs = ['']
  }
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

const buildPayload = () => ({
  ...form,
  paragraphs: form.paragraphs.filter((paragraph) => paragraph.trim().length > 0),
  firstParagraph: form.paragraphs.find((paragraph) => paragraph.trim().length > 0) || ''
})

const save = async () => {
  saving.value = true
  try {
    await updateScriptIdea(props.clientId, props.recordId, buildPayload())
    toast.add({ severity: 'success', summary: '已儲存', detail: '腳本詳情更新成功', life: 2500 })
    await loadDetail()
    console.info('[ScriptIdeasDetail] 已儲存腳本詳情', {
      clientId: props.clientId,
      ideaId: props.recordId,
      paragraphCount: form.paragraphs.length
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

onMounted(loadDetail)

watch(
  () => [props.clientId, props.recordId],
  () => {
    loadDetail()
  }
)

const addParagraph = () => {
  form.paragraphs.push('')
}

const removeParagraph = (index) => {
  if (index < 0 || index >= form.paragraphs.length) return
  form.paragraphs.splice(index, 1)
}
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
  grid-template-columns: minmax(0, 1fr);
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background-color: #f9fafb;
}

.form-section + .form-section {
  margin-top: 1.5rem;
}

.form-section__header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.form-section__header p {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
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

.paragraphs {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.paragraphs__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.paragraphs__header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.paragraphs__empty {
  color: #6b7280;
  font-style: italic;
}

.paragraphs__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.paragraphs__item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background-color: #f9fafb;
}

.paragraphs__item label {
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

  .form-section {
    padding: 1.25rem;
  }

  .actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
