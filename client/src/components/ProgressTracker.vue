<template>
  <div v-if="activeTasks.length > 0" class="progress-tracker-container">
    <Card>
      <template #title>
        <div class="card-title">活動狀態</div>
      </template>
      <template #content>
        <div class="task-list">
          <div v-for="task in activeTasks" :key="task.id" class="task-item">
            <div class="task-info">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-status" :class="`status-${task.status}`">
                {{ getStatusText(task.status) }}
                <span v-if="task.status === 'processing'"> ({{ task.progress }}%)</span>
              </div>
            </div>
            <ProgressBar 
              v-if="task.status === 'processing' || task.status === 'uploading' || task.status === 'compressing'" 
              :value="task.progress" 
              :showValue="false" 
              style="height: .5rem"
            />
            <div v-if="task.status === 'error'" class="task-error-detail">
              {{ task.detail }}
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useProgressStore } from '../stores/progress';
import Card from 'primevue/card';
import ProgressBar from 'primevue/progressbar';

const progressStore = useProgressStore();
const activeTasks = computed(() => progressStore.activeTasks);

const getStatusText = (status) => {
  const statusMap = {
    processing: '處理中',
    uploading: '上傳中',
    compressing: '壓縮中',
    success: '成功',
    error: '失敗',
  };
  return statusMap[status] || status;
};
</script>

<style scoped>
.progress-tracker-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 350px;
  z-index: 1100; /* Higher than other elements */
}

.card-title {
  font-size: 1.1rem;
  font-weight: bold;
  padding: 0.5rem 0;
  margin: 0;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.task-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.task-status {
  font-size: 0.8rem;
}

.status-success {
  color: var(--green-500);
}

.status-error {
  color: var(--red-500);
}

.task-error-detail {
  font-size: 0.8rem;
  color: var(--red-400);
  margin-top: 0.25rem;
}
</style>
