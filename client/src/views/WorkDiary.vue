<template>
  <div class="work-diary-page">
    <div v-if="!hasDiaryAccess" class="work-diary-no-access">
      <Card>
        <template #content>
          <div class="no-access-content">
            <i class="pi pi-lock"></i>
            <p>您目前沒有觀看工作日誌的權限，請洽系統管理員。</p>
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="work-diary-content">
      <div class="work-diary-toolbar">
        <Card>
          <template #content>
            <div class="toolbar-content">
              <div class="toolbar-field">
                <label class="field-label">選擇日期</label>
                <Calendar
                  v-model="calendarValue"
                  dateFormat="yy-mm-dd"
                  :maxDate="new Date()"
                  showIcon
                />
              </div>
              <div v-if="canReadAll" class="toolbar-field">
                <label class="field-label">篩選成員</label>
                <Dropdown
                  v-model="selectedUserId"
                  :options="userOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="全部成員"
                  showClear
                />
              </div>
              <div class="toolbar-actions">
                <Button
                  v-if="canCreateDiary"
                  data-test="create-diary-button"
                  icon="pi pi-plus"
                  label="新增日誌"
                  :disabled="workDiaryStore.creating"
                  @click="openCreateDialog"
                />
                <Button
                  icon="pi pi-refresh"
                  label="重新整理"
                  class="p-button-outlined"
                  :loading="workDiaryStore.loading"
                  @click="reload"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="work-diary-body">
      <div class="work-diary-list" data-test="work-diary-list">
        <Card class="list-card">
          <template #title>
            <div class="list-header">
              <h2>日誌列表</h2>
              <span class="list-count">{{ diaries.length }} 筆</span>
            </div>
          </template>
          <template #content>
            <div v-if="workDiaryStore.loading" class="list-loading">
              <Skeleton height="2.5rem" class="mb-2" v-for="n in 3" :key="n" />
            </div>
            <div v-else-if="!diaries.length" class="list-empty">
              <i class="pi pi-inbox"></i>
              <p>指定日期尚無日誌資料</p>
            </div>
            <div v-else class="list-items">
              <div
                v-for="diary in diaries"
                :key="diary.id"
                class="list-item"
                :class="{ 'list-item--active': diary.id === workDiaryStore.selectedDiaryId }"
                role="button"
                tabindex="0"
                @click="handleSelectDiary(diary)"
                @keyup.enter="handleSelectDiary(diary)"
              >
                <div class="item-header">
                  <div class="item-title">
                    <h3>{{ diary.title || '未命名日誌' }}</h3>
                    <small>作者：{{ diary.author?.name || diary.owner?.name || '未提供' }}</small>
                  </div>
                  <Tag
                    :value="statusMeta(diary.status).label"
                    :severity="statusMeta(diary.status).severity"
                  />
                </div>
                <p class="item-preview">{{ diary.summary || getDiaryContent(diary) || '尚未填寫內容' }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="work-diary-detail" data-test="work-diary-detail">
        <Card>
          <template #title>
            <div class="detail-header">
              <div>
                <h2>日誌內容</h2>
                <p class="detail-date">{{ formattedDate }}</p>
              </div>
              <Tag
                v-if="activeStatusMeta"
                :value="activeStatusMeta.label"
                :severity="activeStatusMeta.severity"
              />
            </div>
          </template>
          <template #content>
            <div v-if="!selectedDiary && !workDiaryStore.loading" class="detail-empty">
              <i class="pi pi-file"></i>
              <p>請先在左側選取日誌以檢視或編輯</p>
            </div>

            <div v-else>
              <div v-if="workDiaryStore.loading && !selectedDiary" class="detail-loading">
                <Skeleton height="2rem" class="mb-3" />
                <Skeleton height="12rem" class="mb-3" />
                <Skeleton height="6rem" />
              </div>

              <div v-else-if="detailForm" class="detail-form">
                <div class="form-row">
                  <label class="field-label" for="diary-title">標題</label>
                  <InputText
                    id="diary-title"
                    v-model.trim="detailForm.title"
                    :disabled="!canEditContent"
                  />
                </div>

                <div class="form-row">
                  <label class="field-label">狀態</label>
                  <div class="status-control">
                    <Dropdown
                      v-if="canChangeStatus"
                      class="status-dropdown"
                      v-model="detailForm.status"
                      :options="statusOptions"
                      optionLabel="label"
                      optionValue="value"
                    />
                    <Tag
                      v-else
                      :value="activeStatusMeta?.label"
                      :severity="activeStatusMeta?.severity"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <label class="field-label" for="diary-content">日誌內容</label>
                  <Textarea
                    id="diary-content"
                    v-model="detailForm.content"
                    autoResize
                    rows="8"
                    :readonly="!canEditContent"
                  />
                </div>

                <Divider />

                <div class="form-row">
                  <div class="field-label">圖片紀錄</div>
                  <div class="image-grid">
                    <div
                      v-for="image in detailForm.images"
                      :key="image.id || image.path"
                      class="image-item"
                    >
                      <img :src="image.url || image.previewUrl" :alt="image.name || '日誌圖片'" />
                      <Button
                        v-if="canUploadImages"
                        icon="pi pi-trash"
                        severity="danger"
                        class="p-button-rounded p-button-text"
                        @click="handleRemoveImage(image)"
                      />
                    </div>
                    <div v-if="canUploadImages" class="image-upload">
                      <FileUpload
                        name="work-diary-images"
                        accept="image/*"
                        :auto="false"
                        :customUpload="true"
                        :showUploadButton="false"
                        :showCancelButton="false"
                        @select="handleImageSelect"
                      >
                        <div class="upload-placeholder">
                          <i class="pi pi-cloud-upload"></i>
                          <p>拖曳或點擊以上傳圖片</p>
                        </div>
                      </FileUpload>
                    </div>
                  </div>
                </div>

                <Divider />

                <div class="form-row supervisor-comment">
                  <label class="field-label" for="diary-supervisor">主管留言</label>
                  <Textarea
                    id="diary-supervisor"
                    v-model="detailForm.managerCommentText"
                    autoResize
                    rows="5"
                    :readonly="!isSupervisor"
                  />
                </div>

                <div class="form-actions">
                  <Button
                    class="save-button"
                    icon="pi pi-save"
                    label="儲存更新"
                    :disabled="!canSave || workDiaryStore.saving"
                    :loading="workDiaryStore.saving"
                    @click="handleSave"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
      </div>
    </div>

    <Dialog
      v-model:visible="createDialogVisible"
      header="新增工作日誌"
      class="create-diary-dialog"
      modal
      :closable="!workDiaryStore.creating"
      @hide="handleCreateDialogHide"
    >
      <div class="create-diary-form" data-test="create-diary-dialog">
        <div class="form-row">
          <label class="field-label" for="create-diary-date">日誌日期</label>
          <Calendar
            id="create-diary-date"
            v-model="createForm.date"
            dateFormat="yy-mm-dd"
            :maxDate="new Date()"
          />
        </div>

        <div class="form-row">
          <label class="field-label" for="create-diary-title">標題</label>
          <InputText
            id="create-diary-title"
            v-model.trim="createForm.title"
            data-test="create-diary-title-input"
          />
        </div>

        <div class="form-row">
          <label class="field-label" for="create-diary-status">狀態</label>
          <Dropdown
            id="create-diary-status"
            v-model="createForm.status"
            :options="createStatusOptions"
            optionLabel="label"
            optionValue="value"
            :disabled="!createStatusOptions.length"
          />
        </div>

        <div class="form-row">
          <label class="field-label" for="create-diary-content">日誌內容</label>
          <Textarea
            id="create-diary-content"
            v-model="createForm.content"
            autoResize
            rows="6"
          />
        </div>

        <div class="form-row">
          <label class="field-label">圖片</label>
          <div class="create-upload">
            <FileUpload
              data-test="create-diary-upload"
              name="create-work-diary-images"
              accept="image/*"
              :auto="false"
              :customUpload="true"
              :showUploadButton="false"
              :showCancelButton="false"
              @select="handleCreateImageSelect"
            >
              <div class="upload-placeholder">
                <i class="pi pi-cloud-upload"></i>
                <p>拖曳或點擊以上傳圖片</p>
              </div>
            </FileUpload>
            <ul v-if="createImages.length" class="create-upload-list">
              <li v-for="(file, index) in createImages" :key="file.name + index">
                <span>{{ file.name }}</span>
                <Button
                  icon="pi pi-times"
                  class="p-button-text"
                  severity="danger"
                  @click="removeCreateImage(index)"
                />
              </li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="取消"
          class="p-button-text"
          :disabled="workDiaryStore.creating"
          @click="createDialogVisible = false"
        />
        <Button
          label="建立"
          icon="pi pi-check"
          :loading="workDiaryStore.creating"
          data-test="create-diary-submit"
          @click="handleCreateDiarySubmit"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import {
  useWorkDiaryStore,
  WORK_DIARY_STATUS,
  WORK_DIARY_STATUS_META
} from '@/stores/workDiary'

import Card from 'primevue/card'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import FileUpload from 'primevue/fileupload'
import Divider from 'primevue/divider'
import Skeleton from 'primevue/skeleton'
import Dialog from 'primevue/dialog'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const workDiaryStore = useWorkDiaryStore()

const formatDate = (date) => {
  if (!date) return ''
  const normalized = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(normalized?.getTime?.())) return ''
  const yyyy = normalized.getFullYear()
  const mm = String(normalized.getMonth() + 1).padStart(2, '0')
  const dd = String(normalized.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const parseDate = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const initialDateString = route.params.date || route.query.date || formatDate(new Date())
const calendarValue = ref(parseDate(initialDateString) || new Date())
const selectedUserId = ref(route.params.userId || route.query.user || 'all')

const diaries = computed(() => workDiaryStore.diaries)
const selectedDiary = computed(() => workDiaryStore.selectedDiary)

const statusMeta = (status) =>
  WORK_DIARY_STATUS_META[status] || { label: status || '未設定', severity: 'info' }

const activeStatusMeta = computed(() =>
  selectedDiary.value ? statusMeta(selectedDiary.value.status) : null
)

const statusOptions = Object.values(WORK_DIARY_STATUS).map((value) => ({
  value,
  label: WORK_DIARY_STATUS_META[value]?.label || value
}))

const createStatusOptions = computed(() => {
  if (isSupervisor.value) return statusOptions
  return statusOptions.filter((option) =>
    [WORK_DIARY_STATUS.DRAFT, WORK_DIARY_STATUS.SUBMITTED].includes(option.value)
  )
})

const isSupervisor = computed(() => !!authStore.hasPermission('work-diary:review'))
const canReadAll = computed(() => !!authStore.hasPermission('work-diary:read:all'))
const canReadSelf = computed(() => !!authStore.hasPermission('work-diary:read:self'))
const canManageSelf = computed(() => !!authStore.hasPermission('work-diary:manage:self'))
const canCreateDiary = computed(() => canManageSelf.value || isSupervisor.value)
const hasDiaryAccess = computed(() => canReadAll.value || canReadSelf.value)

const userOptions = computed(() => {
  if (!canReadAll.value) {
    const current = authStore.user
    if (!current?._id) return []
    return [
      {
        label: current.name || current.username || '我自己',
        value: current._id
      }
    ]
  }
  const options = workDiaryStore.authorOptions.map((option) => ({
    ...option,
    label: option.label
  }))
  return [
    { label: '全部成員', value: 'all' },
    ...options
  ]
})

const formattedDate = computed(() => formatDate(calendarValue.value))

const buildContentFromBlocks = (blocks) => {
  if (!Array.isArray(blocks) || !blocks.length) return ''
  return blocks
    .slice()
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((block) => {
      if (block?.value === undefined || block?.value === null) return ''
      return String(block.value)
    })
    .join('\n')
}

const getDiaryContent = (diary) => {
  if (!diary) return ''
  if (typeof diary.content === 'string' && diary.content.length) return diary.content
  if (Array.isArray(diary.contentBlocks) && diary.contentBlocks.length) {
    return buildContentFromBlocks(diary.contentBlocks)
  }
  return ''
}
const canEditContent = computed(() => {
  if (!selectedDiary.value) return false
  const authorId = selectedDiary.value.author?._id || selectedDiary.value.author?.id
  const userId = authStore.user?._id || authStore.user?.id
  if (isSupervisor.value) return true
  if (!canManageSelf.value) return false
  return authorId && userId && authorId === userId
})
const canChangeStatus = computed(() => isSupervisor.value)
const canUploadImages = computed(() => canEditContent.value)
const canSave = computed(() => canEditContent.value || canChangeStatus.value)

const detailForm = ref(null)
const createDialogVisible = ref(false)
const createForm = ref({
  date: new Date(calendarValue.value),
  title: '',
  content: '',
  status: WORK_DIARY_STATUS.DRAFT
})
const createImages = ref([])

const resetCreateForm = () => {
  createForm.value = {
    date: new Date(calendarValue.value),
    title: '',
    content: '',
    status: WORK_DIARY_STATUS.DRAFT
  }
  createImages.value = []
}

const openCreateDialog = () => {
  if (!canCreateDiary.value) {
    toast.add({ severity: 'warn', summary: '權限不足', detail: '您沒有建立日誌的權限', life: 3000 })
    return
  }
  resetCreateForm()
  createDialogVisible.value = true
}

const syncRouteParams = async () => {
  const params = {}
  const dateString = formatDate(calendarValue.value)
  if (dateString) params.date = dateString
  const userId = selectedUserId.value
  if (canReadAll.value && userId && userId !== 'all') params.userId = userId

  const currentDate = route.params.date || route.query.date || null
  const currentUser = route.params.userId || route.query.user || null

  if (currentDate !== params.date || currentUser !== params.userId) {
    await router.replace({ name: 'WorkDiaries', params })
  }
}

const loadDiaries = async () => {
  if (!hasDiaryAccess.value) {
    workDiaryStore.$patch({ diaries: [], selectedDiaryId: null })
    return
  }
  const payload = {
    date: formatDate(calendarValue.value)
  }
  if (
    canReadAll.value &&
    selectedUserId.value &&
    selectedUserId.value !== 'all'
  ) {
    payload.userId = selectedUserId.value
  }
  try {
    await workDiaryStore.loadDiaries(payload)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: '讀取失敗',
      detail: '無法載入工作日誌，請稍後再試',
      life: 3000
    })
  }
}

watch(
  () => route.params,
  (params) => {
    const nextDate = parseDate(params.date) || parseDate(route.query.date)
    if (nextDate && formatDate(nextDate) !== formatDate(calendarValue.value)) {
      calendarValue.value = nextDate
    }
    if (!canReadAll.value) {
      selectedUserId.value = 'all'
      return
    }
    const nextUser = params.userId || route.query.user || 'all'
    if (selectedUserId.value !== nextUser) {
      selectedUserId.value = nextUser
    }
  }
)

watch(
  [calendarValue, selectedUserId],
  async () => {
    await syncRouteParams()
    await loadDiaries()
  },
  { immediate: true }
)

watch(calendarValue, (value) => {
  if (!createDialogVisible.value) return
  createForm.value = {
    ...createForm.value,
    date: value ? new Date(value) : null
  }
})

watch(hasDiaryAccess, async (allowed) => {
  if (allowed) {
    await loadDiaries()
  } else {
    workDiaryStore.$patch({ diaries: [], selectedDiaryId: null })
  }
})

watch(
  () => workDiaryStore.selectedDiaryId,
  async (diaryId) => {
    if (!diaryId) return
    const diary = workDiaryStore.diaries.find((item) => item.id === diaryId)
    if (diary?.detailLoaded) return
    try {
      await workDiaryStore.fetchDiaryDetail(diaryId)
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: '讀取失敗',
        detail: '無法載入日誌內容',
        life: 3000
      })
    }
  },
  { immediate: true }
)

watch(
  selectedDiary,
  (diary) => {
    if (!diary) {
      detailForm.value = null
      return
    }
    const content = getDiaryContent(diary)
    const commentText =
      diary.managerComment?.text ?? diary.supervisorComment ?? ''
    detailForm.value = {
      title: diary.title || '',
      content,
      managerCommentText: commentText,
      status: diary.status || WORK_DIARY_STATUS.DRAFT,
      images: Array.isArray(diary.images) ? [...diary.images] : []
    }
  },
  { immediate: true }
)

const handleSelectDiary = async (diary) => {
  if (!diary?.id) return
  workDiaryStore.selectDiary(diary.id)
  if (!diary.detailLoaded) {
    try {
      await workDiaryStore.fetchDiaryDetail(diary.id)
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: '讀取失敗',
        detail: '無法載入日誌內容',
        life: 3000
      })
    }
  }
}

const handleSave = async () => {
  if (!workDiaryStore.selectedDiaryId || !detailForm.value) return
  if (!canSave.value) {
    toast.add({ severity: 'warn', summary: '權限不足', detail: '無法儲存此日誌', life: 3000 })
    return
  }
  const payload = {
    title: detailForm.value.title,
    content: detailForm.value.content,
    status: canChangeStatus.value
      ? detailForm.value.status
      : workDiaryStore.selectedDiary?.status,
  }
  if (isSupervisor.value) {
    payload.managerComment = {
      text: detailForm.value.managerCommentText ?? ''
    }
  }
  try {
    await workDiaryStore.saveDiary(workDiaryStore.selectedDiaryId, payload)
    toast.add({ severity: 'success', summary: '儲存成功', detail: '日誌已更新', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: '儲存失敗', detail: '請稍後再試', life: 3000 })
  }
}

const handleImageSelect = async (event) => {
  if (!canUploadImages.value) {
    toast.add({ severity: 'warn', summary: '權限不足', detail: '您沒有上傳權限', life: 3000 })
    event?.options?.clear?.()
    return
  }
  const files = event?.files || []
  if (!files.length) return
  try {
    await workDiaryStore.uploadImages(workDiaryStore.selectedDiaryId, files)
    toast.add({ severity: 'success', summary: '上傳完成', detail: '圖片已新增', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: '上傳失敗', detail: '請稍後再試', life: 3000 })
  } finally {
    event?.options?.clear?.()
  }
}

const handleRemoveImage = async (image) => {
  if (!canUploadImages.value) {
    toast.add({ severity: 'warn', summary: '權限不足', detail: '您沒有刪除圖片的權限', life: 3000 })
    return
  }
  try {
    await workDiaryStore.removeImage(workDiaryStore.selectedDiaryId, image.id || image.path)
    toast.add({ severity: 'success', summary: '已移除圖片', detail: '圖片刪除成功', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: '刪除失敗', detail: '請稍後再試', life: 3000 })
  }
}

const reload = async () => {
  await loadDiaries()
}

const handleCreateDialogHide = () => {
  if (workDiaryStore.creating) return
  resetCreateForm()
}

const handleCreateImageSelect = (event) => {
  const files = event?.files || []
  if (!files.length) return
  createImages.value = [...createImages.value, ...files]
}

const removeCreateImage = (index) => {
  createImages.value = createImages.value.filter((_, idx) => idx !== index)
}

const handleCreateDiarySubmit = async () => {
  if (!canCreateDiary.value) {
    toast.add({ severity: 'warn', summary: '權限不足', detail: '您沒有建立日誌的權限', life: 3000 })
    return
  }
  if (!createForm.value.title?.trim()) {
    toast.add({ severity: 'warn', summary: '資料不足', detail: '請輸入日誌標題', life: 3000 })
    return
  }
  const formatted = formatDate(createForm.value.date || calendarValue.value)
  if (!formatted) {
    toast.add({ severity: 'warn', summary: '資料不足', detail: '請選擇日誌日期', life: 3000 })
    return
  }

  const formData = new FormData()
  formData.append('title', createForm.value.title)
  if (createForm.value.content?.trim()) formData.append('content', createForm.value.content)
  if (createForm.value.status) formData.append('status', createForm.value.status)
  formData.append('date', formatted)
  if (isSupervisor.value && canReadAll.value && selectedUserId.value && selectedUserId.value !== 'all') {
    formData.append('author', selectedUserId.value)
  }
  createImages.value.forEach((file) => {
    const payload = file?.raw || file?.file || file
    if (payload) formData.append('images', payload)
  })

  try {
    await workDiaryStore.createDiary(formData)
    await reload()
    toast.add({ severity: 'success', summary: '建立成功', detail: '已新增日誌', life: 3000 })
    createDialogVisible.value = false
    resetCreateForm()
  } catch (error) {
    const status = error?.response?.status
    if (status === 403) {
      toast.add({ severity: 'warn', summary: '權限不足', detail: '您沒有建立日誌的權限', life: 3000 })
    } else if (status === 400 || status === 422) {
      toast.add({ severity: 'warn', summary: '資料格式錯誤', detail: '請確認日誌內容是否完整', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '建立失敗', detail: '建立日誌時發生錯誤', life: 3000 })
    }
  }
}
</script>

<style scoped>
.work-diary-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.work-diary-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.work-diary-no-access {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
}

.no-access-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  color: var(--surface-500);
}

.no-access-content .pi {
  font-size: 2rem;
}

.work-diary-toolbar .toolbar-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.toolbar-field {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.field-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.toolbar-actions {
  margin-left: auto;
}

.work-diary-body {
  display: grid;
  grid-template-columns: minmax(260px, 380px) 1fr;
  gap: 1.5rem;
}

.list-card {
  height: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-count {
  font-size: 0.875rem;
  color: var(--surface-500);
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-item {
  border: 1px solid var(--surface-200);
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.list-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.list-item--active {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.08);
}

.item-header {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: flex-start;
}

.item-title h3 {
  margin: 0;
  font-size: 1.125rem;
}

.item-title small {
  color: var(--surface-500);
}

.item-preview {
  margin-top: 0.75rem;
  color: var(--surface-600);
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list-empty,
.list-loading,
.detail-empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  min-height: 240px;
  color: var(--surface-500);
  text-align: center;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.detail-date {
  margin: 0;
  color: var(--surface-500);
}

.detail-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-control {
  display: flex;
  align-items: center;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--surface-200);
}

.image-item img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}

.image-item .p-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.image-upload {
  border: 2px dashed var(--surface-300);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--surface-500);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.create-diary-dialog :deep(.p-dialog-content) {
  padding-top: 0;
}

.create-diary-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.create-upload {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.create-upload-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.create-upload-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--surface-200);
  border-radius: 8px;
}

@media (max-width: 1024px) {
  .work-diary-body {
    grid-template-columns: 1fr;
  }
}
</style>
