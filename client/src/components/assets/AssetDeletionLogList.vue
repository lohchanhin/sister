<template>
  <div v-if="visible" class="deletion-log-panel">
    <p class="retention-hint">系統會自動保留素材刪除紀錄 {{ retentionDays }} 天，逾期素材將於離峰時段自動清除。</p>

    <div class="filter-row">
      <label>
        開始日期
        <input type="date" v-model="startDate" />
      </label>
      <label>
        結束日期
        <input type="date" v-model="endDate" />
      </label>
      <div class="filter-actions">
        <button class="primary" type="button" @click="applyFilters" :disabled="loading">
          套用
        </button>
        <button class="ghost" type="button" @click="resetFilters" :disabled="loading">
          清除
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">正在取得刪除紀錄...</div>
    <div v-else>
      <table v-if="logs.length" class="log-table">
        <thead>
          <tr>
            <th>刪除時間</th>
            <th>原始檔名</th>
            <th>執行方式</th>
            <th>操作人員</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in logs" :key="item.id">
            <td>{{ formatDate(item.deletedAt) }}</td>
            <td class="filename">{{ item.originalFilename }}</td>
            <td>{{ formatMethod(item.method) }}</td>
            <td>{{ item.deletedBy?.name || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-state">目前沒有符合條件的刪除紀錄。</p>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button type="button" @click="changePage(currentPage - 1)" :disabled="currentPage === 1 || loading">
        上一頁
      </button>
      <span>第 {{ currentPage }} / {{ totalPages }} 頁</span>
      <button type="button" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages || loading">
        下一頁
      </button>
    </div>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { fetchAssetDeletionLogs } from '../../services/assets'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  retentionDays: {
    type: Number,
    default: 90
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

const startDate = ref('')
const endDate = ref('')
const currentPage = ref(1)
const total = ref(0)
const logs = ref([])
const loading = ref(false)
const errorMessage = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / props.pageSize)))

const buildParams = () => {
  const params = { page: currentPage.value, limit: props.pageSize }
  if (startDate.value) params.startDate = startDate.value
  if (endDate.value) params.endDate = endDate.value
  return params
}

const loadLogs = async () => {
  if (!props.visible) return
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetchAssetDeletionLogs(buildParams())
    logs.value = Array.isArray(response.data) ? response.data : []
    total.value = response.pagination?.total || 0
  } catch (error) {
    errorMessage.value = typeof error === 'string' ? error : '刪除紀錄取得失敗'
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadLogs()
}

const resetFilters = () => {
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  loadLogs()
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadLogs()
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMethod = (method) => {
  const map = {
    'manual-single': '手動刪除',
    'manual-bulk': '批次刪除',
    scheduled: '排程清理'
  }
  return map[method] || method || '—'
}

watch(() => props.visible, (visible) => {
  if (visible) {
    loadLogs()
  }
})

onMounted(() => {
  if (props.visible) {
    loadLogs()
  }
})
</script>

<style scoped>
.deletion-log-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.retention-hint {
  font-size: 0.95rem;
  color: #475569;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-row label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: #1e293b;
}

.filter-row input[type='date'] {
  margin-top: 0.25rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  font-size: 0.9rem;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-actions button {
  padding: 0.45rem 0.9rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}

.filter-actions .primary {
  background-color: #2563eb;
  color: #fff;
}

.filter-actions .ghost {
  background-color: transparent;
  color: #2563eb;
  border: 1px solid #2563eb;
}

.loading-state,
.empty-state,
.error-message {
  font-size: 0.9rem;
  color: #64748b;
}

.error-message {
  color: #dc2626;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
}

.log-table th,
.log-table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  font-size: 0.9rem;
}

.log-table th {
  background-color: #f1f5f9;
  color: #1e293b;
}

.log-table .filename {
  word-break: break-all;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination button {
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #cbd5f5;
  background-color: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
