import path from 'node:path'
import fs from 'node:fs/promises'
import { validationResult } from 'express-validator'
import { t } from '../i18n/messages.js'
import PopularContent from '../models/popularContent.model.js'
import { uploadFile, getSignedUrl } from '../utils/gcs.js'
import { decodeFilename } from '../utils/decodeFilename.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

const CACHE_PREFIX = 'popularContent:'
const listCacheKey = (clientId, platformKey = 'all') => `${CACHE_PREFIX}list:${clientId}:${platformKey}`
const itemCacheKey = (contentId) => `${CACHE_PREFIX}item:${contentId}`

const ensureClientAccess = (req) => {
  const allowed = req.user?.allowedClients || []
  if (!allowed.length) return true
  return allowed.some((id) => String(id) === String(req.params.clientId))
}

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

const buildPayload = (body, options = {}) => {
  const payload = {}
  if (body.title !== undefined) payload.title = body.title
  if (body.platformKey !== undefined) payload.platformKey = body.platformKey
  if (body.publishDate !== undefined) {
    const publish = new Date(body.publishDate)
    if (!Number.isNaN(publish.getTime())) payload.publishDate = publish
  }
  if (body.dueDate !== undefined) {
    const due = new Date(body.dueDate)
    if (!Number.isNaN(due.getTime())) payload.dueDate = due
  }
  const fields = [
    'exposure',
    'viewCount',
    'coverCtr',
    'avgWatchSeconds',
    'completionRate',
    'twoSecondDropRate'
  ]
  for (const field of fields) {
    const num = toNumber(body[field])
    if (num !== undefined) payload[field] = num
  }
  if (body.reviewNotes !== undefined) payload.reviewNotes = body.reviewNotes
  if (body.trendLink !== undefined) payload.trendLink = body.trendLink
  if (body.reminderNotes !== undefined) payload.reminderNotes = body.reminderNotes

  if (!payload.dueDate && payload.publishDate && options.forceDueDate) {
    const due = new Date(payload.publishDate)
    due.setDate(due.getDate() + 7)
    payload.dueDate = due
  }
  return payload
}

const appendCoverUrl = async (doc) => {
  if (!doc) return doc
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  if (obj.coverPath) {
    try {
      obj.coverUrl = await getSignedUrl(obj.coverPath)
    } catch {
      obj.coverUrl = ''
    }
  } else {
    obj.coverUrl = ''
  }
  return obj
}

export const listPopularContents = async (req, res) => {
  if (!ensureClientAccess(req)) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  const platformKey = req.query.platformKey || 'all'
  const cacheKey = listCacheKey(req.params.clientId, platformKey)
  const cached = await getCache(cacheKey)
  if (cached) {
    const withCovers = await Promise.all(cached.map((item) => appendCoverUrl(item)))
    return res.json(withCovers)
  }
  const query = { clientId: req.params.clientId }
  if (req.query.platformKey) query.platformKey = req.query.platformKey
  const docs = await PopularContent.find(query).sort({ publishDate: -1 })
  const plain = docs.map((doc) => doc.toObject())
  await setCache(cacheKey, plain)
  const withCovers = await Promise.all(plain.map((item) => appendCoverUrl(item)))
  res.json(withCovers)
}

export const createPopularContent = async (req, res) => {
  if (!ensureClientAccess(req)) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR'), errors: errors.array() })
  }
  const publishDate = new Date(req.body.publishDate)
  const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : new Date(publishDate)
  if (!req.body.dueDate) dueDate.setDate(dueDate.getDate() + 7)
  const payload = {
    clientId: req.params.clientId,
    platformKey: req.body.platformKey,
    title: req.body.title,
    publishDate,
    dueDate,
    reviewNotes: req.body.reviewNotes || '',
    trendLink: req.body.trendLink || '',
    reminderNotes: req.body.reminderNotes || ''
  }
  const numericPayload = buildPayload(req.body)
  Object.assign(payload, numericPayload)
  const created = await PopularContent.create(payload)
  await clearCacheByPrefix(`${CACHE_PREFIX}list:${req.params.clientId}`)
  const response = await appendCoverUrl(created)
  res.status(201).json(response)
}

export const getPopularContent = async (req, res) => {
  if (!ensureClientAccess(req)) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR'), errors: errors.array() })
  }
  const cacheKey = itemCacheKey(req.params.contentId)
  const cached = await getCache(cacheKey)
  if (cached) {
    const withCover = await appendCoverUrl(cached)
    return res.json(withCover)
  }
  const doc = await PopularContent.findOne({
    _id: req.params.contentId,
    clientId: req.params.clientId
  })
  if (!doc) return res.status(404).json({ message: t('RECORD_NOT_FOUND') })
  await setCache(cacheKey, doc.toObject())
  const withCover = await appendCoverUrl(doc)
  res.json(withCover)
}

export const updatePopularContent = async (req, res) => {
  if (!ensureClientAccess(req)) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR'), errors: errors.array() })
  }
  const update = buildPayload(req.body, { forceDueDate: Boolean(req.body.publishDate) })
  const doc = await PopularContent.findOneAndUpdate(
    { _id: req.params.contentId, clientId: req.params.clientId },
    { $set: update },
    { new: true }
  )
  if (!doc) return res.status(404).json({ message: t('RECORD_NOT_FOUND') })
  await clearCacheByPrefix(`${CACHE_PREFIX}list:${req.params.clientId}`)
  await delCache(itemCacheKey(req.params.contentId))
  const response = await appendCoverUrl(doc)
  res.json(response)
}

export const deletePopularContent = async (req, res) => {
  if (!ensureClientAccess(req)) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR'), errors: errors.array() })
  }
  await PopularContent.findOneAndDelete({
    _id: req.params.contentId,
    clientId: req.params.clientId
  })
  await clearCacheByPrefix(`${CACHE_PREFIX}list:${req.params.clientId}`)
  await delCache(itemCacheKey(req.params.contentId))
  res.json({ message: t('RECORD_DELETED') })
}

export const uploadPopularContentCover = async (req, res) => {
  if (!ensureClientAccess(req)) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR'), errors: errors.array() })
  }
  if (!req.file) {
    return res.status(400).json({ message: t('FILE_NOT_UPLOADED') })
  }
  const doc = await PopularContent.findOne({
    _id: req.params.contentId,
    clientId: req.params.clientId
  })
  if (!doc) {
    await fs.unlink(req.file.path)
    return res.status(404).json({ message: t('RECORD_NOT_FOUND') })
  }
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  const originalName = decodeFilename(req.file.originalname)
  const ext = path.extname(originalName)
  const destination = `popular-content/${req.params.clientId}/${unique}${ext}`
  await uploadFile(req.file.path, destination, req.file.mimetype)
  await fs.unlink(req.file.path)
  doc.coverPath = destination
  await doc.save()
  await clearCacheByPrefix(`${CACHE_PREFIX}list:${req.params.clientId}`)
  await delCache(itemCacheKey(req.params.contentId))
  const response = await appendCoverUrl(doc)
  res.json(response)
}
