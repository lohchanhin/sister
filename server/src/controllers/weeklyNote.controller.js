import WeeklyNote from '../models/weeklyNote.model.js'
import path from 'node:path'
import { uploadFile, getSignedUrl } from '../utils/gcs.js'
import { decodeFilename } from '../utils/decodeFilename.js'
import fs from 'node:fs/promises'

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

export const createWeeklyNote = async (req, res) => {
  const note = await WeeklyNote.create({
    clientId: req.params.clientId,
    platformId: req.params.platformId,
    week: req.body.week,
    text: req.body.text || '',
    images: await uploadImages(req.files)
  })
  res.status(201).json(note)
}

export const getWeeklyNote = async (req, res) => {
  const note = await WeeklyNote.findOne({
    clientId: req.params.clientId,
    platformId: req.params.platformId,
    week: req.params.week
  })
  // if (!note) return res.status(404).json({ message: '備註不存在' })
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
  if (!note) return res.status(404).json({ message: '備註不存在' })
  res.json(note)
}

export const getWeeklyNotes = async (req, res) => {
  const notes = await WeeklyNote.find({
    clientId: req.params.clientId,
    platformId: req.params.platformId
  })
  res.json(notes)
}

export const getWeeklyImageUrl = async (req, res) => {
  const filePath = req.query.path
  if (!filePath) return res.status(400).json({ message: '缺少 path 參數' })
  const url = await getSignedUrl(filePath)
  res.json({ url })
}
