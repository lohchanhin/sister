import Task from '../models/task.model.js'
import { getCache, setCache, clearCacheByPrefix } from '../utils/cache.js'

export const createTask = async (req, res) => {
  const newTask = await Task.create(req.body)
  await clearCacheByPrefix('tasks:')
  res.status(201).json(newTask)
}

export const getTasks = async (req, res) => {
  const cacheKey = `tasks:${JSON.stringify(req.query)}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

  const tasks = await Task.find().populate('assetId assignedTo')
  await setCache(cacheKey, tasks)
  res.json(tasks)
}

export const updateTask = async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!task) return res.status(404).json({ message: '\u4efb\u52d9\u4e0d\u5b58\u5728' })
  await clearCacheByPrefix('tasks:')
  res.json(task)
}
