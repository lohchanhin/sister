import Tag from '../models/tag.model.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

export const createTag = async (req, res) => {
  const tag = await Tag.create({ name: req.body.name })
  await clearCacheByPrefix('tags:')
  res.status(201).json(tag)
}

export const getTags = async (_req, res) => {
  const cacheKey = 'tags:all'
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const tags = await Tag.find()
  await setCache(cacheKey, tags)
  res.json(tags)
}

export const getTag = async (req, res) => {
  const cacheKey = `tag:${req.params.id}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const tag = await Tag.findById(req.params.id)
  if (!tag) return res.status(404).json({ message: '標籤不存在' })
  await setCache(cacheKey, tag)
  res.json(tag)
}

export const updateTag = async (req, res) => {
  const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!tag) return res.status(404).json({ message: '標籤不存在' })
  await clearCacheByPrefix('tags:')
  await delCache(`tag:${req.params.id}`)
  res.json(tag)
}

export const deleteTag = async (req, res) => {
  await Tag.findByIdAndDelete(req.params.id)
  await clearCacheByPrefix('tags:')
  await delCache(`tag:${req.params.id}`)
  res.json({ message: '標籤已刪除' })
}
