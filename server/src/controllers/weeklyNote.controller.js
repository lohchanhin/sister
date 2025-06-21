import WeeklyNote from '../models/weeklyNote.model.js'
import path from 'node:path'
import { uploadBuffer, getSignedUrl } from '../utils/gcs.js'

const uploadImages = async files => {
  if (!files?.length) return []
  const paths = await Promise.all(
    files.map(async f => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const ext = path.extname(f.originalname)
      const filename = unique + ext
      return uploadBuffer(f.buffer, filename, f.mimetype)
    })
  )
  return paths
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
  if (req.files?.length) {
    update.images = await uploadImages(req.files)
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
