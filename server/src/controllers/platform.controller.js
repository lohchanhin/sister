import { t } from '../i18n/messages.js'
import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'
import WeeklyNote from '../models/weeklyNote.model.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'
import mongoose from 'mongoose'

const formulaPattern = /^[0-9+\-*/().\s_a-zA-Z]+$/
const slugPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const slugify = s => s.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')

const validateFields = fields => {
  if (!Array.isArray(fields)) return []
  const slugs = new Set()
  for (const f of fields) {
    f.slug = f.slug || slugify(f.name)
    if (!f.slug || !slugPattern.test(f.slug) || slugs.has(f.slug)) {
      throw new Error('INVALID_FORMULA')
    }
    slugs.add(f.slug)
  }
  for (const f of fields) {
    if (f.formula) {
      if (!formulaPattern.test(f.formula)) {
        throw new Error('INVALID_FORMULA')
      }
      const vars = f.formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || []
      for (const v of vars) {
        if (!slugs.has(v)) {
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
    const normalized = (fields || []).map(f => ({
      id: f.id || new mongoose.Types.ObjectId().toString(),
      name: f.name,
      slug: f.slug,
      type: f.type,
      order: f.order,
      formula: f.formula
    }))
    const platform = await Platform.create({
      name,
      platformType,
      fields: normalized,
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
    const normalized = (fields || []).map(f => ({
      id: f.id || new mongoose.Types.ObjectId().toString(),
      name: f.name,
      slug: f.slug,
      type: f.type,
      order: f.order,
      formula: f.formula
    }))
    const p = await Platform.findOneAndUpdate(
      { _id: req.params.id, clientId: req.params.clientId },
      { name, platformType, fields: normalized, mode },
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

export const renamePlatformField = async (req, res) => {
  const { id, name, slug } = req.body
  if (!id || !slug) {
    return res.status(400).json({ message: t('PARAMS_ERROR') })
  }
  if (!slugPattern.test(slug)) {
    return res.status(400).json({ message: t('INVALID_FORMULA') })
  }
  const platform = await Platform.findOne({ _id: req.params.id, clientId: req.params.clientId })
  if (!platform) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })
  const field = platform.fields?.find(f => f.id === id)
  if (!field) return res.status(404).json({ message: t('RECORD_NOT_FOUND') })

  if (platform.fields.some(f => f.slug === slug && f.id !== id)) {
    return res.status(409).json({ message: t('INVALID_FORMULA') })
  }

  const oldSlug = field.slug
  field.name = name
  field.slug = slug

  if (oldSlug !== slug) {
    for (const f of platform.fields) {
      if (f.formula) {
        f.formula = f.formula.replace(new RegExp(`\\b${oldSlug}\\b`, 'g'), slug)
      }
    }
  }

  await platform.save()
  if (oldSlug !== slug) {
    await AdDaily.updateMany(
      { platformId: req.params.id },
      {
        $rename: {
          [`extraData.${oldSlug}`]: `extraData.${slug}`,
          [`colors.${oldSlug}`]: `colors.${slug}`
        }
      }
    )
  }
  await clearCacheByPrefix('platforms:')
  await delCache(`platform:${req.params.id}`)
  res.json(platform)
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
