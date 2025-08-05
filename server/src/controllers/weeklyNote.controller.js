import { t } from '../i18n/messages.js'
import WeeklyNote from '../models/weeklyNote.model.js'
import path from 'node:path'
import { uploadFile, getSignedUrl } from '../utils/gcs.js'
import { decodeFilename } from '../utils/decodeFilename.js'
import fs from 'node:fs/promises'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

const uploadImages = async files => {
  if (!files?.length) return []
  const paths = await Promise.all(
    files.map(async f => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const originalName = decodeFilename(f.originalname)
      const ext = path.extname(originalName)
      const filename = unique + ext
      const p = await uploadFile(f.path, filename, f.mimetype)
      await fs.unlink(f.path)
      return p
    })
  )
  return paths
}

const parseKeepImages = value => {
  if (value === undefined) return undefined
  const arr = Array.isArray(value) ? value : [value]
  return arr.filter(Boolean)
}

const appendSignedUrls = async note => {
  if (!note) return note
  const obj = note.toObject ? note.toObject() : note
  if (!obj.images?.length) return obj
  const images = await Promise.all(
    obj.images.map(async p => {
      try {
        const url = await getSignedUrl(p)
        return { path: p, url }
      } catch {
        return { path: p, url: '' }
      }
    })
  )
  return { ...obj, images }
}

export const createWeeklyNote = async (req, res) => {
  console.log('uploaded files:', req.files)
  const images = await uploadImages(req.files)
  const note = await WeeklyNote.create({
    clientId: req.params.clientId,
    platformId: req.params.platformId,
    week: req.body.week,
    text: req.body.text || '',
    images
  })
  await clearCacheByPrefix('weeklyNotes:')
  const noteWithUrls = await appendSignedUrls(note)
  res.status(201).json(noteWithUrls)
}

export const getWeeklyNote = async (req, res) => {
  const cacheKey = `weeklyNote:${req.params.clientId}:${req.params.platformId}:${req.params.week}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

  const note = await WeeklyNote.findOne({
    clientId: req.params.clientId,
    platformId: req.params.platformId,
    week: req.params.week
  })
  // if (!note) return res.status(404).json({ message: '備註不存在' })
  await setCache(cacheKey, note)
  res.json(note)
}

export const updateWeeklyNote = async (req, res) => {
  const update = {
    text: req.body.text
  }
  const keep = parseKeepImages(req.body.keepImages)
  let newImages = []
  if (keep !== undefined) newImages = keep
  if (req.files?.length) {
    console.log('uploaded files:', req.files)
    const uploaded = await uploadImages(req.files)
    newImages = [...newImages, ...uploaded]
  }
  if (keep !== undefined || req.files?.length) {
    update.images = newImages
  }
  const note = await WeeklyNote.findOneAndUpdate(
    {
      clientId: req.params.clientId,
      platformId: req.params.platformId,
      week: req.params.week
    },
    update,
    { new: true }
  )
  if (!note) return res.status(404).json({ message: t('NOTE_NOT_FOUND') })
  await clearCacheByPrefix('weeklyNotes:')
  await delCache(`weeklyNote:${req.params.clientId}:${req.params.platformId}:${req.params.week}`)
  const noteWithUrls = await appendSignedUrls(note)
  res.json(noteWithUrls)
}

export const getWeeklyNotes = async (req, res) => {
  const cacheKey = `weeklyNotes:${req.params.clientId}:${req.params.platformId}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const notes = await WeeklyNote.find({
    clientId: req.params.clientId,
    platformId: req.params.platformId
  })
  await setCache(cacheKey, notes)
  res.json(notes)
}

export const getWeeklyImageUrl = async (req, res) => {
  const filePath = req.query.path
  if (!filePath) return res.status(400).json({ message: t('PATH_MISSING') })
  const url = await getSignedUrl(filePath)
  res.json({ url })
}
