import { t } from '../i18n/messages.js'
import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'
import WeeklyNote from '../models/weeklyNote.model.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

const formulaPattern = /^[0-9+\-*/().\s_a-zA-Z]+$/

const validateFields = fields => {
  if (!Array.isArray(fields)) return []
  const fieldNames = new Set(fields.map(f => f.name))
  for (const f of fields) {
    if (f.formula) {
      if (!formulaPattern.test(f.formula)) {
        throw new Error('INVALID_FORMULA')
      }
      const vars = f.formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []
      for (const v of vars) {
        if (!fieldNames.has(v)) {
          throw new Error('INVALID_FORMULA')
        }
      }
    }
  }
  return fields
}

export const createPlatform = async (req, res) => {
  try {
    const { name, platformType, fields, mode } = req.body
    validateFields(fields)
    const platform = await Platform.create({
      name,
      platformType,
      fields,
      mode,
      clientId: req.params.clientId
    })
    await clearCacheByPrefix('platforms:')
    res.status(201).json(platform)
  } catch (err) {
    if (err.message === 'INVALID_FORMULA') {
      return res.status(400).json({ message: t('INVALID_FORMULA') })
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: t('PLATFORM_NAME_DUPLICATE') })
    }
    throw err
  }
}

export const getPlatforms = async (req, res) => {
  const cacheKey = `platforms:${req.params.clientId}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const list = await Platform.find({ clientId: req.params.clientId })
  await setCache(cacheKey, list)
  res.json(list)
}

export const getPlatform = async (req, res) => {
  const cacheKey = `platform:${req.params.id}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const p = await Platform.findOne({ _id: req.params.id, clientId: req.params.clientId })
  if (!p) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })
  await setCache(cacheKey, p)
  res.json(p)
}

export const updatePlatform = async (req, res) => {
  try {
    const { name, platformType, fields, mode } = req.body
    validateFields(fields)
    const p = await Platform.findOneAndUpdate(
      { _id: req.params.id, clientId: req.params.clientId },
      { name, platformType, fields, mode },
      { new: true }
    )
    if (!p) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })
    await clearCacheByPrefix('platforms:')
    await delCache(`platform:${req.params.id}`)
    res.json(p)
  } catch (err) {
    if (err.message === 'INVALID_FORMULA') {
      return res.status(400).json({ message: t('INVALID_FORMULA') })
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: t('PLATFORM_NAME_DUPLICATE') })
    }
    throw err
  }
}

export const deletePlatform = async (req, res) => {
  await Platform.findOneAndDelete({ _id: req.params.id, clientId: req.params.clientId })
  await clearCacheByPrefix('platforms:')
  await delCache(`platform:${req.params.id}`)
  res.json({ message: t('PLATFORM_DELETED') })
}

export const transferPlatform = async (req, res) => {
  const { clientId } = req.body
  if (!clientId) {
    return res.status(400).json({ message: t('MISSING_CLIENT_ID') })
  }
  const platform = await Platform.findById(req.params.id)
  if (!platform) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })
  platform.clientId = clientId
  await platform.save()
  await AdDaily.updateMany({ platformId: req.params.id }, { clientId })
  await WeeklyNote.updateMany({ platformId: req.params.id }, { clientId })
  await clearCacheByPrefix('platforms:')
  await delCache(`platform:${req.params.id}`)
  res.json(platform)
}
