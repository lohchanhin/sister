import Tag from '../models/tag.model.js'

export const createTag = async (req, res) => {
  const tag = await Tag.create({ name: req.body.name })
  res.status(201).json(tag)
}

export const getTags = async (_req, res) => {
  const tags = await Tag.find()
  res.json(tags)
}

export const getTag = async (req, res) => {
  const tag = await Tag.findById(req.params.id)
  if (!tag) return res.status(404).json({ message: '標籤不存在' })
  res.json(tag)
}

export const updateTag = async (req, res) => {
  const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!tag) return res.status(404).json({ message: '標籤不存在' })
  res.json(tag)
}

export const deleteTag = async (req, res) => {
  await Tag.findByIdAndDelete(req.params.id)
  res.json({ message: '標籤已刪除' })
}
