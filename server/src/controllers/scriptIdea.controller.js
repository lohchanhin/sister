import path from 'node:path'
import fs from 'node:fs/promises'
import ScriptIdea from '../models/scriptIdea.model.js'
import { decodeFilename } from '../utils/decodeFilename.js'
import { uploadFile, getSignedUrl } from '../utils/gcs.js'
import { getCache, setCache, delCache } from '../utils/cache.js'

const listCacheKey = (clientId) => `scriptIdeas:list:${clientId}`
const detailCacheKey = (ideaId) => `scriptIdeas:detail:${ideaId}`

const normalizeDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const normalizeNumber = (value, defaultValue = 0) => {
  if (value === '' || value === null || value === undefined) return defaultValue
  const num = Number(value)
  return Number.isNaN(num) ? defaultValue : num
}

const normalizeStatus = (value) => {
  const allowed = ['pending', 'approved', 'revision']
  return allowed.includes(value) ? value : 'pending'
}

const normalizeString = (value) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value.trim()
  return String(value).trim()
}

const toScene = (input = {}) => ({
  stage: normalizeString(input.stage),
  narration: normalizeString(input.narration),
  visuals: normalizeString(input.visuals),
  assets: normalizeString(input.assets),
  cta: normalizeString(input.cta),
  notes: normalizeString(input.notes)
})

const hasSceneContent = (scene) =>
  Boolean(
    scene.stage ||
      scene.narration ||
      scene.visuals ||
      scene.assets ||
      scene.cta ||
      scene.notes
  )

const parseStoryboard = (value) => {
  if (!value) return []
  let raw = value
  if (typeof value === 'string') {
    try {
      raw = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (!Array.isArray(raw)) return []
  return raw.map(toScene).filter(hasSceneContent)
}

const uploadVideo = async (file, clientId) => {
  if (!file) return null
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const originalName = decodeFilename(file.originalname)
  const ext = path.extname(originalName)
  const destination = `script-ideas/${clientId}/${unique}${ext}`
  try {
    const storedPath = await uploadFile(file.path, destination, file.mimetype)
    return { path: storedPath, name: originalName }
  } finally {
    await fs.unlink(file.path).catch(() => {})
  }
}

const appendVideoInfo = async (idea) => {
  if (!idea) return idea
  const obj = idea.toObject ? idea.toObject() : { ...idea }
  if (!obj.videoPath) {
    return { ...obj, videoUrl: '', videoName: obj.videoName || '' }
  }
  try {
    const url = await getSignedUrl(obj.videoPath)
    return {
      ...obj,
      videoUrl: url,
      videoName: obj.videoName || path.basename(obj.videoPath)
    }
  } catch {
    return { ...obj, videoUrl: '', videoName: obj.videoName || path.basename(obj.videoPath) }
  }
}

export const listScriptIdeas = async (req, res) => {
  const clientId = req.params.clientId
  const cacheKey = listCacheKey(clientId)
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const ideas = await ScriptIdea.find({ clientId }).sort({ date: -1, createdAt: -1 }).lean()
  await setCache(cacheKey, ideas)
  res.json(ideas)
}

export const createScriptIdea = async (req, res) => {
  const clientId = req.params.clientId
  const date = normalizeDate(req.body.date)
  if (!date) {
    return res.status(400).json({ message: '腳本日期為必填欄位' })
  }
  const payload = {
    clientId,
    date,
    location: req.body.location || '',
    scriptCount: normalizeNumber(req.body.scriptCount, 0),
    status: normalizeStatus(req.body.status),
    summaryScript: req.body.summaryScript || '',
    headline: req.body.headline || '',
    firstParagraph: req.body.firstParagraph || '',
    dialogue: req.body.dialogue || '',
    keyLines: req.body.keyLines || '',
    feedback: req.body.feedback || '',
    templateId: normalizeString(req.body.templateId),
    targetAudience: req.body.targetAudience || '',
    corePromise: req.body.corePromise || '',
    visualTone: req.body.visualTone || '',
    storyboard: parseStoryboard(req.body.storyboard)
  }
  if (req.file) {
    const uploaded = await uploadVideo(req.file, clientId)
    if (uploaded) {
      payload.videoPath = uploaded.path
      payload.videoName = uploaded.name
    }
  }
  const idea = await ScriptIdea.create(payload)
  await delCache(listCacheKey(clientId))
  const result = await appendVideoInfo(idea)
  res.status(201).json(result)
}

export const getScriptIdea = async (req, res) => {
  const cacheKey = detailCacheKey(req.params.ideaId)
  const cached = await getCache(cacheKey)
  if (cached) {
    const withVideo = await appendVideoInfo(cached)
    return res.json(withVideo)
  }
  const idea = await ScriptIdea.findOne({ _id: req.params.ideaId, clientId: req.params.clientId })
  if (!idea) {
    return res.status(404).json({ message: '找不到腳本記錄' })
  }
  const plain = idea.toObject()
  await setCache(cacheKey, plain)
  const withVideo = await appendVideoInfo(plain)
  res.json(withVideo)
}

export const updateScriptIdea = async (req, res) => {
  const clientId = req.params.clientId
  const ideaId = req.params.ideaId
  const update = {}
  if (Object.prototype.hasOwnProperty.call(req.body, 'location')) {
    update.location = req.body.location || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'scriptCount')) {
    update.scriptCount = normalizeNumber(req.body.scriptCount, 0)
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
    update.status = normalizeStatus(req.body.status)
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'summaryScript')) {
    update.summaryScript = req.body.summaryScript || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'headline')) {
    update.headline = req.body.headline || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'firstParagraph')) {
    update.firstParagraph = req.body.firstParagraph || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'dialogue')) {
    update.dialogue = req.body.dialogue || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'keyLines')) {
    update.keyLines = req.body.keyLines || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'feedback')) {
    update.feedback = req.body.feedback || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'templateId')) {
    update.templateId = normalizeString(req.body.templateId)
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'targetAudience')) {
    update.targetAudience = req.body.targetAudience || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'corePromise')) {
    update.corePromise = req.body.corePromise || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'visualTone')) {
    update.visualTone = req.body.visualTone || ''
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'storyboard')) {
    update.storyboard = parseStoryboard(req.body.storyboard)
  }
  if (req.body.date) {
    const parsed = normalizeDate(req.body.date)
    if (!parsed) {
      return res.status(400).json({ message: '腳本日期格式錯誤' })
    }
    update.date = parsed
  }
  if (req.body.removeVideo === 'true' || req.body.removeVideo === true) {
    update.videoPath = ''
    update.videoName = ''
  }
  if (req.file) {
    const uploaded = await uploadVideo(req.file, clientId)
    if (uploaded) {
      update.videoPath = uploaded.path
      update.videoName = uploaded.name
    }
  }
  const idea = await ScriptIdea.findOneAndUpdate(
    { _id: ideaId, clientId },
    update,
    { new: true }
  )
  if (!idea) {
    return res.status(404).json({ message: '找不到腳本記錄' })
  }
  await delCache(listCacheKey(clientId))
  await delCache(detailCacheKey(ideaId))
  const withVideo = await appendVideoInfo(idea)
  res.json(withVideo)
}

export const deleteScriptIdea = async (req, res) => {
  const clientId = req.params.clientId
  const ideaId = req.params.ideaId
  const idea = await ScriptIdea.findOneAndDelete({ _id: ideaId, clientId })
  if (!idea) {
    return res.status(404).json({ message: '找不到腳本記錄' })
  }
  await delCache(listCacheKey(clientId))
  await delCache(detailCacheKey(ideaId))
  res.json({ success: true })
}
