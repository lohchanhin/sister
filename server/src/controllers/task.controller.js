import Task from '../models/task.model.js'

export const createTask = async (req, res) => {
  const newTask = await Task.create(req.body)
  res.status(201).json(newTask)
}

export const getTasks = async (req, res) => {
  const tasks = await Task.find().populate('assetId assignedTo')
  res.json(tasks)
}

export const updateTask = async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!task) return res.status(404).json({ message: '\u4efb\u52d9\u4e0d\u5b58\u5728' })
  res.json(task)
}
