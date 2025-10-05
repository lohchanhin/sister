import path from 'node:path'
import fs from 'node:fs/promises'
import mongoose from 'mongoose'
import { t } from '../i18n/messages.js'
import WorkDiary from '../models/workDiary.model.js'
import { uploadFile, getSignedUrl } from '../utils/gcs.js'
import { decodeFilename } from '../utils/decodeFilename.js'
import logger from '../config/logger.js'
import { ROLES } from '../config/roles.js'
import { notifyDiaryReviewed, notifyDiarySubmitted } from '../services/notification.service.js'

const PUBLIC_VISIBILITY = ['team', 'company']
const ALLOWED_VISIBILITIES = ['private', 'team', 'company', 'custom']
const AUTHOR_ALLOWED_STATUSES = new Set(['draft', 'submitted'])
const REVIEW_STATUSES = new Set(['approved', 'rejected'])

const isManager = user => user?.roleId?.name === ROLES.MANAGER

const normalizeDate = value => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error('INVALID_DATE'), { status: 400 })
  }
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  return normalized
}

const parseJSONField = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch (err) {
      throw Object.assign(new Error('INVALID_JSON'), { status: 400 })
    }
  }
  return value
}

const parseKeepImages = keep => {
  if (keep === undefined) return undefined
  const arr = Array.isArray(keep) ? keep : [keep]
  return arr.filter(Boolean)
}

const parseVisibleTo = value => {
  if (value === undefined) return undefined
  const list = Array.isArray(value) ? value : [value]
  return list.filter(Boolean).map(id => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Object.assign(new Error('INVALID_ID'), { status: 400 })
    }
    return id
  })
}

const uploadImages = async files => {
  if (!files?.length) return []
  const paths = await Promise.all(
    files.map(async file => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      const originalName = decodeFilename(file.originalname)
      const ext = path.extname(originalName)
      const filename = `work-diaries/${unique}${ext}`
      const storedPath = await uploadFile(file.path, filename, file.mimetype)
      await fs.unlink(file.path)
      return storedPath
    })
  )
  logger.debug('work diary uploaded images:', paths)
  return paths
}

const DEFAULT_BLOCK_TYPE = 'text'

const buildContentBlocksFromText = content => {
  if (content === undefined || content === null) return undefined
  const text = typeof content === 'string' ? content : String(content)
  if (!text) return []
  return [{ type: DEFAULT_BLOCK_TYPE, value: text, order: 0 }]
}

const deriveContentFromBlocks = blocks => {
  if (!Array.isArray(blocks) || !blocks.length) return ''
  return blocks
    .slice()
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map(block => (block?.value !== undefined && block?.value !== null ? String(block.value) : ''))
    .join('\n')
}

const appendSignedUrls = async diary => {
  if (!diary) return diary
  const base = diary.toObject ? diary.toObject({ virtuals: true }) : { ...diary }
  const content =
    typeof base.content === 'string' && base.content.length
      ? base.content
      : deriveContentFromBlocks(base.contentBlocks)

  if (!Array.isArray(base.images) || base.images.length === 0) {
    return { ...base, images: base.images ?? [], content }
  }

  const images = await Promise.all(
    base.images.map(async image => {
      const path = typeof image === 'string' ? image : image?.path
      if (!path) return image
      if (image?.url) return image
      try {
        const url = await getSignedUrl(path)
        return { path, url }
      } catch (err) {
        logger.warn('failed to get signed url for diary image %s: %s', path, err.message)
        return { path, url: '' }
      }
    })
  )

  return { ...base, images, content }
}

const ensureCanAccess = (user, diary) => {
  if (!diary) return false
  if (isManager(user)) return true
  const authorId = diary.author?._id?.toString?.() || diary.author?.toString?.()
  const userId = user?._id?.toString?.()
  if (authorId && userId && authorId === userId) return true
  if (PUBLIC_VISIBILITY.includes(diary.visibility)) return true
  if (Array.isArray(diary.visibleTo)) {
    const visible = diary.visibleTo.some(person => person?.toString?.() === userId)
    if (visible) return true
  }
  return false
}

const ensureCanEdit = (user, diary) => {
  if (isManager(user)) return true
  const authorId = diary.author?._id?.toString?.() || diary.author?.toString?.()
  const userId = user?._id?.toString?.()
  return authorId === userId
}

export const listWorkDiaries = async (req, res) => {
  const query = {}

  if (req.query.author) {
    if (!mongoose.Types.ObjectId.isValid(req.query.author)) {
      return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
    }
    query.author = req.query.author
  }

  if (req.query.date) {
    try {
      const date = normalizeDate(req.query.date)
      const next = new Date(date)
      next.setUTCDate(next.getUTCDate() + 1)
      query.date = { $gte: date, $lt: next }
    } catch (err) {
      return res.status(err.status || 400).json({ message: t('DATA_FORMAT_ERROR') })
    }
  } else {
    const { startDate, endDate } = req.query
    if (startDate || endDate) {
      try {
        const range = {}
        if (startDate) range.$gte = normalizeDate(startDate)
        if (endDate) {
          const end = normalizeDate(endDate)
          const next = new Date(end)
          next.setUTCDate(next.getUTCDate() + 1)
          range.$lt = next
        }
        query.date = range
      } catch (err) {
        return res.status(err.status || 400).json({ message: t('DATA_FORMAT_ERROR') })
      }
    }
  }

  if (!isManager(req.user)) {
    query.$or = [
      { author: req.user._id },
      { visibility: { $in: PUBLIC_VISIBILITY } },
      { visibleTo: req.user._id }
    ]
  }

  const diaries = await WorkDiary.find(query)
    .sort({ date: -1 })
    .populate('author', 'username name email roleId')
    .populate('managerComment.commentedBy', 'username name email roleId')

  const diariesWithUrls = await Promise.all(diaries.map(appendSignedUrls))
  res.json(diariesWithUrls)
}

export const getWorkDiary = async (req, res) => {
  const diary = await WorkDiary.findById(req.params.diaryId)
    .populate('author', 'username name email roleId')
    .populate('managerComment.commentedBy', 'username name email roleId')
  if (!diary) return res.status(404).json({ message: t('DIARY_NOT_FOUND') })
  if (!ensureCanAccess(req.user, diary)) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  const diaryWithUrls = await appendSignedUrls(diary)
  res.json(diaryWithUrls)
}

export const createWorkDiary = async (req, res) => {
  const { title, status, visibility } = req.body
  if (!title) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
  }
  let date
  try {
    date = normalizeDate(req.body.date)
  } catch (err) {
    return res.status(err.status || 400).json({ message: t('DATA_FORMAT_ERROR') })
  }
  if (!date) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
  }

  const hasContentField = Object.prototype.hasOwnProperty.call(req.body, 'content')
  const normalizedContent = hasContentField ? (req.body.content ?? '') : undefined
  let contentBlocks
  try {
    contentBlocks = parseJSONField(req.body.contentBlocks, [])
  } catch (err) {
    return res.status(err.status || 400).json({ message: t('DATA_FORMAT_ERROR') })
  }
  if (!Array.isArray(contentBlocks)) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
  }

  if ((req.body.contentBlocks === undefined || contentBlocks.length === 0) && hasContentField) {
    const blocksFromText = buildContentBlocksFromText(normalizedContent)
    if (blocksFromText !== undefined) {
      contentBlocks = blocksFromText
    }
  }

  let visibleTo
  try {
    visibleTo = parseVisibleTo(req.body.visibleTo)
  } catch {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
  }

  const images = await uploadImages(req.files)

  let authorId = req.user._id
  if (isManager(req.user) && req.body.author) {
    if (!mongoose.Types.ObjectId.isValid(req.body.author)) {
      return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
    }
    authorId = req.body.author
  }

  const diaryData = {
    author: authorId,
    date,
    title,
    contentBlocks,
    images,
    visibility: visibility || 'private'
  }
  if (visibleTo !== undefined) diaryData.visibleTo = visibleTo

  if (status) {
    if (isManager(req.user) || AUTHOR_ALLOWED_STATUSES.has(status)) {
      diaryData.status = status
    } else {
      return res.status(403).json({ message: t('DIARY_EDIT_FORBIDDEN') })
    }
  }

  if (visibility && !ALLOWED_VISIBILITIES.includes(visibility)) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
  }

  try {
    const diary = await WorkDiary.create(diaryData)
    const populated = await diary
      .populate('author', 'username name email roleId')
      .populate('managerComment.commentedBy', 'username name email roleId')
    const diaryWithUrls = await appendSignedUrls(populated)
    if (diaryWithUrls.status === 'submitted') {
      await notifyDiarySubmitted({ diary: diaryWithUrls, actor: req.user })
    }
    res.status(201).json(diaryWithUrls)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: t('DIARY_DUPLICATE') })
    }
    throw err
  }
}

export const updateWorkDiary = async (req, res) => {
  const diary = await WorkDiary.findById(req.params.diaryId)
  if (!diary) return res.status(404).json({ message: t('DIARY_NOT_FOUND') })
  if (!ensureCanEdit(req.user, diary)) {
    return res.status(403).json({ message: t('DIARY_EDIT_FORBIDDEN') })
  }

  const update = {}
  const previousStatus = diary.status

  if (req.body.title !== undefined) update.title = req.body.title

  if (req.body.date) {
    try {
      update.date = normalizeDate(req.body.date)
    } catch (err) {
      return res.status(err.status || 400).json({ message: t('DATA_FORMAT_ERROR') })
    }
  }

  const hasContentField = Object.prototype.hasOwnProperty.call(req.body, 'content')
  const normalizedContent = hasContentField ? (req.body.content ?? '') : undefined

  if (req.body.contentBlocks !== undefined) {
    try {
      update.contentBlocks = parseJSONField(req.body.contentBlocks, [])
    } catch (err) {
      return res.status(err.status || 400).json({ message: t('DATA_FORMAT_ERROR') })
    }
    if (!Array.isArray(update.contentBlocks)) {
      return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
    }
  } else if (hasContentField) {
    const blocksFromText = buildContentBlocksFromText(normalizedContent)
    if (blocksFromText !== undefined) {
      update.contentBlocks = blocksFromText
    }
  }

  if (req.body.visibility) {
    if (!ALLOWED_VISIBILITIES.includes(req.body.visibility)) {
      return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
    }
    update.visibility = req.body.visibility
  }

  if (req.body.visibleTo !== undefined) {
    try {
      update.visibleTo = parseVisibleTo(req.body.visibleTo)
    } catch (err) {
      return res.status(err.status || 400).json({ message: t('DATA_FORMAT_ERROR') })
    }
  }

  if (req.body.status) {
    const requestedStatus = req.body.status
    if (isManager(req.user) || AUTHOR_ALLOWED_STATUSES.has(requestedStatus)) {
      update.status = requestedStatus
    } else {
      return res.status(403).json({ message: t('DIARY_EDIT_FORBIDDEN') })
    }
  }

  const keep = parseKeepImages(req.body.keepImages)
  let images = keep !== undefined ? [...keep] : undefined
  if (req.files?.length) {
    const uploaded = await uploadImages(req.files)
    images = images ? [...images, ...uploaded] : uploaded
  }
  if (images !== undefined) {
    update.images = images
  }

  Object.assign(diary, update)
  await diary.save()
  await diary.populate('author', 'username name email roleId')
  await diary.populate('managerComment.commentedBy', 'username name email roleId')
  const diaryWithUrls = await appendSignedUrls(diary)
  if (previousStatus !== 'submitted' && diary.status === 'submitted') {
    await notifyDiarySubmitted({ diary: diaryWithUrls, actor: req.user })
  }
  res.json(diaryWithUrls)
}

export const addWorkDiaryImages = async (req, res) => {
  const diary = await WorkDiary.findById(req.params.diaryId)
    .populate('author', 'username name email roleId')
    .populate('managerComment.commentedBy', 'username name email roleId')

  if (!diary) {
    return res.status(404).json({ message: t('DIARY_NOT_FOUND') })
  }
  if (!ensureCanEdit(req.user, diary)) {
    return res.status(403).json({ message: t('DIARY_EDIT_FORBIDDEN') })
  }

  const uploaded = await uploadImages(req.files)
  const currentImages = Array.isArray(diary.images) ? diary.images.slice() : []
  if (uploaded.length) {
    diary.images = [...currentImages, ...uploaded]
  } else if (!Array.isArray(diary.images)) {
    diary.images = currentImages
  }

  await diary.save()
  const diaryWithUrls = await appendSignedUrls(diary)
  res.json(diaryWithUrls)
}

export const removeWorkDiaryImage = async (req, res) => {
  const diary = await WorkDiary.findById(req.params.diaryId)
    .populate('author', 'username name email roleId')
    .populate('managerComment.commentedBy', 'username name email roleId')

  if (!diary) {
    return res.status(404).json({ message: t('DIARY_NOT_FOUND') })
  }
  if (!ensureCanEdit(req.user, diary)) {
    return res.status(403).json({ message: t('DIARY_EDIT_FORBIDDEN') })
  }

  const target = req.params.imageId
  const images = Array.isArray(diary.images) ? diary.images.slice() : []
  const index = images.findIndex(image => {
    if (typeof image === 'string') return image === target
    if (image && typeof image === 'object') return image.path === target
    return false
  })

  if (index === -1) {
    return res.status(404).json({ message: t('DIARY_IMAGE_NOT_FOUND') })
  }

  images.splice(index, 1)
  diary.images = images
  await diary.save()
  const diaryWithUrls = await appendSignedUrls(diary)
  res.json(diaryWithUrls)
}

export const reviewWorkDiary = async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ message: t('DIARY_REVIEW_FORBIDDEN') })
  }

  const { status, comment } = req.body
  if (!status || !REVIEW_STATUSES.has(status)) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
  }

  const update = {
    status,
    managerComment: {
      text: comment || '',
      commentedBy: req.user._id,
      commentedAt: new Date()
    }
  }

  const diary = await WorkDiary.findByIdAndUpdate(req.params.diaryId, update, { new: true })
    .populate('author', 'username name email roleId')
    .populate('managerComment.commentedBy', 'username name email roleId')

  if (!diary) return res.status(404).json({ message: t('DIARY_NOT_FOUND') })

  const diaryWithUrls = await appendSignedUrls(diary)
  await notifyDiaryReviewed({ diary: diaryWithUrls, actor: req.user })
  res.json(diaryWithUrls)
}
