import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useProgressStore = defineStore('progress', () => {
  const tasks = ref({});

  const activeTasks = computed(() =>
    Object.values(tasks.value).sort((a, b) => b.startTime - a.startTime)
  );

  const hasActiveDownloads = computed(() =>
    Object.values(tasks.value).some(task => task.status === 'compressing')
  );

  function addTask({ id, name, status = 'processing', progress = 0 }) {
    tasks.value[id] = {
      id,
      name,
      status, // 'processing', 'compressing', 'uploading', 'success', 'error'
      progress,
      startTime: Date.now(),
    };
  }

  function updateTaskProgress(id, progress) {
    if (tasks.value[id]) {
      tasks.value[id].progress = progress;
    }
  }

  function updateTaskStatus(id, status, detail = '') {
    if (tasks.value[id]) {
      tasks.value[id].status = status;
      tasks.value[id].detail = detail;
      
      // Automatically remove successful or failed tasks after a delay
      if (status === 'success' || status === 'error') {
        setTimeout(() => {
          removeTask(id);
        }, 5000);
      }
    }
  }

  function removeTask(id) {
    delete tasks.value[id];
  }

  function clearActiveDownloads() {
    Object.keys(tasks.value).forEach(id => {
      if (tasks.value[id].status === 'compressing') {
        delete tasks.value[id];
      }
    });
  }

  return {
    tasks,
    activeTasks,
    hasActiveDownloads,
    addTask,
    updateTaskProgress,
    updateTaskStatus,
    removeTask,
    clearActiveDownloads,
  };
});
