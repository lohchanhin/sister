<template>
  <div v-if="modelValue" class="dialog-wrapper">
    <div class="dialog-mask" @click="close"></div>
    <div class="dialog-panel">
      <header class="dialog-header">
        <h2>{{ form.title || '影片詳情' }}</h2>
        <button class="icon-button" @click="close" aria-label="關閉">
          <i class="pi pi-times"></i>
        </button>
      </header>

      <section class="dialog-body">
        <div class="field-group">
          <label>發布日</label>
          <input type="date" v-model="form.publishDate" disabled />
        </div>
        <div class="field-group" :class="{ 'metric-alert': alerts.dueDate }">
          <label>截至日期</label>
          <input type="date" v-model="form.dueDate" />
          <small v-if="alerts.dueDate" class="alert-text">截至日期不可早於發布日</small>
        </div>

        <div class="metrics-grid">
          <div class="metric" :class="{ 'metric-alert': alerts.exposure }">
            <label>曝光數據</label>
            <input type="number" min="0" v-model.number="form.exposure" />
            <small v-if="alerts.exposure" class="alert-text">建議曝光需達 3000 以上</small>
          </div>
          <div class="metric" :class="{ 'metric-alert': alerts.viewCount }">
            <label>觀看數</label>
            <input type="number" min="0" v-model.number="form.viewCount" />
            <small v-if="alerts.viewCount" class="alert-text">觀看數建議達 500 以上</small>
          </div>
          <div class="metric" :class="{ 'metric-alert': alerts.coverCtr }">
            <label>封面點擊率 (%)</label>
            <input type="number" min="0" max="100" step="0.1" v-model.number="form.coverCtr" />
            <small v-if="alerts.coverCtr" class="alert-text">封面 CTR 建議 30% 以上</small>
          </div>
          <div class="metric" :class="{ 'metric-alert': alerts.avgWatchSeconds }">
            <label>平均觀看秒數</label>
            <input type="number" min="0" step="0.1" v-model.number="form.avgWatchSeconds" />
            <small v-if="alerts.avgWatchSeconds" class="alert-text">平均觀看建議超過 10 秒</small>
          </div>
          <div class="metric" :class="{ 'metric-alert': alerts.completionRate }">
            <label>完播率 (%)</label>
            <input type="number" min="0" max="100" step="0.1" v-model.number="form.completionRate" />
            <small v-if="alerts.completionRate" class="alert-text">完播率建議超過 10%</small>
          </div>
          <div class="metric" :class="{ 'metric-alert': alerts.twoSecondDropRate }">
            <label>2 秒退出率 (%)</label>
            <input type="number" min="0" max="100" step="0.1" v-model.number="form.twoSecondDropRate" />
            <small v-if="alerts.twoSecondDropRate" class="alert-text">2 秒退出率建議低於 30%</small>
          </div>
        </div>

        <div class="field-group">
          <label>趨勢追蹤連結</label>
          <input type="text" v-model="form.trendLink" placeholder="https://" />
        </div>

        <div class="field-group">
          <label>提醒事項</label>
          <textarea v-model="form.reminderNotes" rows="2" placeholder="記錄需要跟進的事項"></textarea>
        </div>

        <div class="field-group">
          <label>復盤 / 修改意見</label>
          <textarea v-model="form.reviewNotes" rows="4" placeholder="紀錄優化建議或心得"></textarea>
        </div>
      </section>

      <footer class="dialog-footer">
        <button class="secondary" @click="close">取消</button>
        <button class="primary" @click="save">儲存變更</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  content: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const defaultForm = () => ({
  title: '',
  publishDate: '',
  dueDate: '',
  exposure: 0,
  viewCount: 0,
  coverCtr: 0,
  avgWatchSeconds: 0,
  completionRate: 0,
  twoSecondDropRate: 0,
  reviewNotes: '',
  trendLink: '',
  reminderNotes: ''
})

const form = reactive(defaultForm())

const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

const computeDueDate = (publishDate, dueDate) => {
  if (dueDate) return toDateInput(dueDate)
  if (!publishDate) return ''
  const d = new Date(publishDate)
  if (Number.isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

watch(
  () => props.content,
  (value) => {
    const next = value || {}
    form.title = next.title || ''
    form.publishDate = toDateInput(next.publishDate)
    form.dueDate = computeDueDate(next.publishDate, next.dueDate)
    form.exposure = next.exposure ?? 0
    form.viewCount = next.viewCount ?? 0
    form.coverCtr = next.coverCtr ?? 0
    form.avgWatchSeconds = next.avgWatchSeconds ?? 0
    form.completionRate = next.completionRate ?? 0
    form.twoSecondDropRate = next.twoSecondDropRate ?? 0
    form.reviewNotes = next.reviewNotes || ''
    form.trendLink = next.trendLink || ''
    form.reminderNotes = next.reminderNotes || ''
  },
  { immediate: true }
)

const alerts = computed(() => {
  const publishDate = form.publishDate ? new Date(form.publishDate) : null
  const dueDate = form.dueDate ? new Date(form.dueDate) : null
  const dueDateInvalid = publishDate && dueDate && dueDate.getTime() < publishDate.getTime()
  return {
    dueDate: Boolean(dueDateInvalid),
    exposure: Number(form.exposure) < 3000,
    viewCount: Number(form.viewCount) < 500,
    coverCtr: Number(form.coverCtr) < 30,
    avgWatchSeconds: Number(form.avgWatchSeconds) < 10,
    completionRate: Number(form.completionRate) < 10,
    twoSecondDropRate: Number(form.twoSecondDropRate) >= 30
  }
})

const close = () => {
  emit('update:modelValue', false)
}

const save = () => {
  if (alerts.value.dueDate) return
  emit('save', {
    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    exposure: Number(form.exposure) || 0,
    viewCount: Number(form.viewCount) || 0,
    coverCtr: Number(form.coverCtr) || 0,
    avgWatchSeconds: Number(form.avgWatchSeconds) || 0,
    completionRate: Number(form.completionRate) || 0,
    twoSecondDropRate: Number(form.twoSecondDropRate) || 0,
    reviewNotes: form.reviewNotes,
    trendLink: form.trendLink,
    reminderNotes: form.reminderNotes
  })
}
</script>

<style scoped>
.dialog-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}

.dialog-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
}

.dialog-panel {
  position: relative;
  width: min(640px, 95vw);
  max-height: 90vh;
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.icon-button {
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group label {
  font-weight: 600;
  color: #374151;
}

.field-group input,
.field-group textarea {
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: inherit;
}

.field-group textarea {
  resize: vertical;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric label {
  font-weight: 600;
  color: #374151;
}

.metric input {
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  padding: 0.65rem 0.75rem;
  font-size: 1rem;
}

.metric-alert label,
.metric-alert input,
.metric-alert textarea {
  color: #b91c1c;
  border-color: #f87171;
}

.alert-text {
  color: #dc2626;
  font-size: 0.85rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.dialog-footer .secondary,
.dialog-footer .primary {
  border-radius: 999px;
  padding: 0.65rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.dialog-footer .secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.dialog-footer .primary {
  background: linear-gradient(135deg, #f97316, #fb7185);
  color: #fff;
  box-shadow: 0 10px 25px rgba(251, 113, 133, 0.35);
}

.dialog-footer .primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
