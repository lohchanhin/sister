import { defineStore } from 'pinia'
import {
  createWorkDiary,
  listWorkDiaries,
  getWorkDiary,
  updateWorkDiary,
  uploadWorkDiaryImages,
  removeWorkDiaryImage
} from '../services/workDiary'

export const WORK_DIARY_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REVISION: 'revision'
})

export const WORK_DIARY_STATUS_META = Object.freeze({
  [WORK_DIARY_STATUS.DRAFT]: { label: '草稿', severity: 'info' },
  [WORK_DIARY_STATUS.SUBMITTED]: { label: '待審核', severity: 'warning' },
  [WORK_DIARY_STATUS.APPROVED]: { label: '已核准', severity: 'success' },
  [WORK_DIARY_STATUS.REVISION]: { label: '退回修改', severity: 'danger' }
})

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.records)) return payload.records
    if (Array.isArray(payload.items)) return payload.items
  }
  return []
}

const deriveContentFromBlocks = (blocks) => {
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

const normalizeDiaryItem = (item) => {
  if (!item) return item
  const id = item.id || item._id || item.diaryId || null
  const hasContentField = typeof item.content === 'string'
  const derivedContent = hasContentField
    ? item.content
    : deriveContentFromBlocks(item.contentBlocks)
  const detailLoaded =
    item.detailLoaded !== undefined
      ? item.detailLoaded
      : hasContentField
      ? Boolean(item.content)
      : false
  const managerComment =
    item.managerComment && typeof item.managerComment === 'object'
      ? {
          ...item.managerComment,
          text:
            item.managerComment.text !== undefined && item.managerComment.text !== null
              ? String(item.managerComment.text)
              : '',
          commentedBy: item.managerComment.commentedBy ?? null,
          commentedAt: item.managerComment.commentedAt ?? null
        }
      : { text: '', commentedBy: null, commentedAt: null }
  const supervisorComment =
    item.supervisorComment !== undefined && item.supervisorComment !== null
      ? String(item.supervisorComment)
      : managerComment.text
  const visibleTo = Array.isArray(item.visibleTo)
    ? item.visibleTo
        .map((viewer) => {
          const viewerId = viewer?._id || viewer?.id || viewer
          if (!viewerId) return null
          if (typeof viewer === 'object') {
            return {
              ...viewer,
              id: viewerId,
              name: viewer.name || viewer.displayName || viewer.username || viewer.email || ''
            }
          }
          return { id: viewerId }
        })
        .filter(Boolean)
    : []
  return {
    ...item,
    id,
    content: derivedContent,
    detailLoaded,
    managerComment,
    supervisorComment,
    visibleTo,
    visibility: item.visibility || 'private'
  }
}

export const useWorkDiaryStore = defineStore('workDiary', {
  state: () => ({
    diaries: [],
    loading: false,
    saving: false,
    creating: false,
    uploading: false,
    error: null,
    selectedDiaryId: null,
    filters: {
      date: null,
      userId: null
    }
  }),
  getters: {
    selectedDiary(state) {
      return state.diaries.find((diary) => diary.id === state.selectedDiaryId) || null
    },
    authorOptions(state) {
      const map = new Map()
      state.diaries.forEach((diary) => {
        const author = diary.author || diary.owner
        if (!author) return
        const id = author._id || author.id
        if (!id || map.has(id)) return
        map.set(id, {
          value: id,
          label: author.name || author.displayName || author.username || '未命名'
        })
      })
      return Array.from(map.values())
    }
  },
  actions: {
    setFilters(partial) {
      this.filters = { ...this.filters, ...partial }
    },
    selectDiary(diaryId) {
      this.selectedDiaryId = diaryId
    },
    updateLocalDiary(diaryId, patch = {}) {
      const index = this.diaries.findIndex((diary) => diary.id === diaryId)
      if (index === -1) return
      const merged = normalizeDiaryItem({
        ...this.diaries[index],
        ...patch,
        id: diaryId
      })
      this.diaries.splice(index, 1, merged)
      if (this.selectedDiaryId === diaryId && this.selectedDiary?.id === diaryId) {
        this.selectedDiaryId = diaryId
      }
    },
    async loadDiaries(params = {}) {
      this.loading = true
      this.error = null
      try {
        const result = await listWorkDiaries(params)
        const diaries = normalizeList(result).map((item) => normalizeDiaryItem(item))
        this.diaries = diaries
        this.filters = {
          date: params.date ?? this.filters.date,
          userId: params.userId ?? this.filters.userId
        }
        if (!this.selectedDiaryId || !this.diaries.some((d) => d.id === this.selectedDiaryId)) {
          this.selectedDiaryId = this.diaries[0]?.id ?? null
        }
        return diaries
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchDiaryDetail(diaryId) {
      if (!diaryId) return null
      try {
        const detail = await getWorkDiary(diaryId)
        const normalized = normalizeDiaryItem({
          ...detail,
          id: detail.id || detail._id || diaryId,
          detailLoaded: true
        })
        this.updateLocalDiary(diaryId, normalized)
        return normalized
      } catch (error) {
        this.error = error
        throw error
      }
    },
    async saveDiary(diaryId, payload) {
      if (!diaryId) return null
      this.saving = true
      this.error = null
      try {
        const updated = await updateWorkDiary(diaryId, payload)
        const normalized = normalizeDiaryItem({
          ...updated,
          id: updated.id || updated._id || diaryId,
          detailLoaded: true
        })
        this.updateLocalDiary(diaryId, normalized)
        return normalized
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.saving = false
      }
    },
    async createDiary(payload = {}) {
      this.creating = true
      this.error = null
      try {
        const created = await createWorkDiary(payload)
        const normalized = normalizeDiaryItem({
          ...created,
          id: created?.id || created?._id || null
        })
        if (normalized.id) {
          const existingIndex = this.diaries.findIndex((item) => item.id === normalized.id)
          if (existingIndex >= 0) {
            this.diaries.splice(existingIndex, 1, normalized)
          } else {
            this.diaries.unshift(normalized)
          }
          this.selectedDiaryId = normalized.id
        }
        return normalized
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.creating = false
      }
    },
    async uploadImages(diaryId, files) {
      if (!diaryId) return null
      this.uploading = true
      this.error = null
      try {
        const updated = await uploadWorkDiaryImages(diaryId, files)
        const normalized = normalizeDiaryItem({
          ...updated,
          id: updated.id || updated._id || diaryId,
          detailLoaded: true
        })
        this.updateLocalDiary(diaryId, normalized)
        return normalized
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.uploading = false
      }
    },
    async removeImage(diaryId, imageId) {
      if (!diaryId || !imageId) return null
      this.error = null
      try {
        const updated = await removeWorkDiaryImage(diaryId, imageId)
        const normalized = normalizeDiaryItem({
          ...updated,
          id: updated.id || updated._id || diaryId,
          detailLoaded: true
        })
        this.updateLocalDiary(diaryId, normalized)
        return normalized
      } catch (error) {
        this.error = error
        throw error
      }
    }
  }
})
