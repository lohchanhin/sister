import ReviewStage from '../models/reviewStage.model.js'
import User from '../models/user.model.js'

export const createStage = async (req, res) => {
  const user = await User.findById(req.body.responsible)
  if (!user) return res.status(400).json({ message: '找不到使用者' })

  const stage = await ReviewStage.create(req.body)
  res.status(201).json(stage)
}

export const getStages = async (_, res) => {
  const stages = await ReviewStage.find().populate('responsible').sort('order')
  res.json(stages)
}

export const updateStage = async (req, res) => {
  if (req.body.responsible) {
    const user = await User.findById(req.body.responsible)
    if (!user) return res.status(400).json({ message: '找不到使用者' })
  }

  const stage = await ReviewStage.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!stage) return res.status(404).json({ message: '階段不存在' })
  res.json(stage)
}

export const deleteStage = async (req, res) => {
  await ReviewStage.findByIdAndDelete(req.params.id)
  res.json({ message: '已刪除' })
}
