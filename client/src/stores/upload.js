import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uploadAssetAuto } from '../services/assets'
import { useProgressStore } from './progress'

export const useUploadStore = defineStore('upload', () => {
  const queue = ref({})
  const progressStore = useProgressStore()

  const activeTasks = computed(() => progressStore.activeTasks)

  const hasPending = computed(() =>
    Object.values(queue.value).some(task =>
      ['pending', 'uploading'].includes(task.status)
    )
  )

  function addUploadTask(file, options = {}) {
    const id = `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`
    queue.value[id] = {
      id,
      file,
      options,
      status: 'pending',
      progress: 0,
      canceled: false
    }
    progressStore.addTask({ id, name: file.name, status: 'uploading', progress: 0 })
    startUpload(id)
    return id
  }

  async function startUpload(id) {
    const task = queue.value[id]
    if (!task) return
    task.status = 'uploading'
    const { file, options } = task
    const progressCb = evt => {
      let percent = 0
      if (evt && typeof evt.percent === 'number') {
        percent = Math.round(evt.percent)
      } else if (evt && evt.total) {
        percent = Math.round((evt.loaded / evt.total) * 100)
      }
      task.progress = percent
      progressStore.updateTaskProgress(id, percent)
    }
    try {
      await uploadAssetAuto(file, options.folderId, options.extraData || null, progressCb)
      if (task.canceled) {
        progressStore.updateTaskStatus(id, 'error', '已取消')
      } else {
        progressStore.updateTaskStatus(id, 'success')
        task.status = 'success'
      }
    } catch (e) {
      if (!task.canceled) {
        task.status = 'error'
        progressStore.updateTaskStatus(id, 'error', '上傳失敗')
      } else {
        progressStore.updateTaskStatus(id, 'error', '已取消')
      }
    } finally {
      setTimeout(() => {
        delete queue.value[id]
      }, 5000)
    }
  }

  function cancelTask(id) {
    const task = queue.value[id]
    if (task) {
      task.canceled = true
      task.status = 'canceled'
    }
  }

  function cancelAll() {
    Object.keys(queue.value).forEach(cancelTask)
  }

  return { queue, activeTasks, addUploadTask, cancelTask, cancelAll, hasPending }
})
