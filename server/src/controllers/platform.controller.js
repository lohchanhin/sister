// platform.controller.js
import { t } from '../i18n/messages.js'
import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'
import WeeklyNote from '../models/weeklyNote.model.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'
import mongoose from 'mongoose'

/** 公式/slug 校验（仅英文字母/数字/下划线；变量名以字母或 _ 开头） */
const formulaPattern = /^[0-9+\-*/().\s_a-zA-Z]+$/
const varPattern = /[a-zA-Z_][a-zA-Z0-9_]*/g
const slugPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * 根据名称生成 slug；若名称不含合法字元或重复，则返回唯一的 f_1、f_2…
 * @param {string} s 名称
 * @param {Set} exist 已存在的 slug 集合
 */
const slugify = (s, exist = new Set()) => {
  let base = s?.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (!base || !slugPattern.test(base) || exist.has(base)) {
    let i = 1
    while (exist.has(`f_${i}`)) i++
    base = `f_${i}`
  }
  exist.add(base)
  return base
}

/** —— 校验并标准化字段集合 —— */
const validateFields = (fields) => {
  const messages = []
  if (!Array.isArray(fields)) return { fields: [], messages }

  // 1) 预处理 slug
  const slugs = new Set()
  for (const f of fields) {
    const original = f.slug
    f.slug = slugify(original || f.name, slugs)
    if (original && original !== f.slug) {
      messages.push(`${original} 已被替換為 ${f.slug}`)
    }
  }

  // 2) 校验公式：语法 + 变量名必须存在于 slugs
  for (const f of fields) {
    if (!f.formula) continue
    if (!formulaPattern.test(f.formula)) {
      throw new Error('INVALID_FORMULA')
    }
    const vars = f.formula.match(varPattern) || []
    for (const v of vars) {
      if (!slugs.has(v)) throw new Error('INVALID_FORMULA')
    }
  }
  return { fields, messages }
}

/** 将字段列表标准化：id → string，保留 name/slug/type/order/formula */
const normalizeFields = (fields = []) =>
  fields.map(f => ({
    id: String(f.id || new mongoose.Types.ObjectId()),
    name: f.name,
    slug: f.slug,
    type: f.type,
    order: f.order,
    formula: f.formula
  }))

/** 缓存键工具 */
const listCacheKey = (clientId) => `platforms:${clientId}`
const oneCacheKey  = (id)       => `platform:${id}`

/** ─────────────────────────── Controllers ─────────────────────────── */

export const createPlatform = async (req, res) => {
  try {
    const { name, platformType, fields, mode } = req.body
    const { fields: validated, messages } = validateFields(fields)
    const normalized = normalizeFields(validated)

    const platform = await Platform.create({
      name,
      platformType,
      fields: normalized,
      mode,
      clientId: req.params.clientId
    })

    await clearCacheByPrefix('platforms:')
    res.status(201).json({ ...platform.toObject(), messages })
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
  const cacheKey = listCacheKey(req.params.clientId)
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

  const list = await Platform.find({ clientId: req.params.clientId })
  await setCache(cacheKey, list)
  res.json(list)
}

export const getPlatform = async (req, res) => {
  const cacheKey = oneCacheKey(req.params.id)
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
    const { fields: validated, messages } = validateFields(fields)
    const normalized = normalizeFields(validated)

    const p = await Platform.findOneAndUpdate(
      { _id: req.params.id, clientId: req.params.clientId },
      { name, platformType, fields: normalized, mode },
      { new: true }
    )
    if (!p) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })

    await clearCacheByPrefix('platforms:')
    await delCache(oneCacheKey(req.params.id))
    res.json({ ...p.toObject(), messages })
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

/**
 * 重命名单个字段 slug / name，并同步：
 * 1) 修正同平台内所有公式里的变量名
 * 2) 将 AdDaily.extraData/colors 的 oldSlug → newSlug（$rename）
 */
export const renamePlatformField = async (req, res) => {
  try {
    const { id, name, slug } = req.body
    if (!id || !slug) {
      return res.status(400).json({ message: t('PARAMS_ERROR') })
    }
    if (!slugPattern.test(slug)) {
      return res.status(400).json({ code: 'SLUG_INVALID', message: t('SLUG_INVALID') })
    }

    const platform = await Platform.findOne({ _id: req.params.id, clientId: req.params.clientId })
    if (!platform) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })

    // 用字符串比较，兼容历史 ObjectId / string 混用
    const field = platform.fields?.find(f => String(f.id) === String(id))
    if (!field) return res.status(404).json({ message: t('RECORD_NOT_FOUND') })

    // slug 唯一性
    if (platform.fields.some(f => f.slug === slug && String(f.id) !== String(id))) {
      return res.status(409).json({ code: 'SLUG_DUPLICATE', message: t('SLUG_DUPLICATE') })
    }

    const oldSlug = field.slug
    field.name = name
    field.slug = slug

    // 公式中的变量名同步替换
    if (oldSlug !== slug) {
      for (const f of platform.fields) {
        if (f.formula) {
          f.formula = f.formula.replace(new RegExp(`\\b${oldSlug}\\b`, 'g'), slug)
        }
      }
    }

    await platform.save()

    // 历史数据字段重命名
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
    await delCache(oneCacheKey(req.params.id))
    res.json(platform)
  } catch (err) {
    if (err.message === 'INVALID_FORMULA') {
      return res.status(400).json({ message: t('INVALID_FORMULA') })
    }
    throw err
  }
}

export const deletePlatform = async (req, res) => {
  await Platform.findOneAndDelete({ _id: req.params.id, clientId: req.params.clientId })
  await clearCacheByPrefix('platforms:')
  await delCache(oneCacheKey(req.params.id))
  res.json({ message: t('PLATFORM_DELETED') })
}

export const getPlatformAliases = async (req, res) => {
  const p = await Platform.findOne(
    { _id: req.params.id, clientId: req.params.clientId },
    'fieldAliases'
  )
  if (!p) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })
  res.json(p.fieldAliases || {})
}

export const updatePlatformAliases = async (req, res) => {
  // 兼容兩種鍵名：前端可能發 {fieldAliases} 或 {aliases}
  const { fieldAliases, aliases } = req.body || {}
  const incoming = fieldAliases || aliases
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ message: t('PARAMS_ERROR') })
  }

  const platform = await Platform.findOne({ _id: req.params.id, clientId: req.params.clientId })
  if (!platform) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })

  // 允許的目標：當前平台所有欄位 id（string）
  const validIds = new Set((platform.fields || []).map(f => String(f.id)))

  // 僅保留 string->string，且目標 newId 必須是有效欄位 id
  const clean = {}
  for (const [oldKey, newId] of Object.entries(incoming)) {
    if (typeof oldKey !== 'string' || typeof newId !== 'string') continue
    if (!validIds.has(newId)) continue           // 目標不是現有欄位 id，丟棄
    if (oldKey === newId) continue               // 本身相等沒意義，丟棄
    // 避免把 “新 id” 當作 oldKey 再被錯指向別的 id（防止自我污染）
    // 舊鍵一般為 24HEX，不作硬限制，但這條能防不少誤操作
    clean[oldKey] = newId
  }

  // 合併（不整體覆蓋），後寫覆蓋同鍵
  platform.fieldAliases = { ...(platform.fieldAliases || {}), ...clean }
  await platform.save()

  await clearCacheByPrefix('platforms:')
  await delCache(`platform:${req.params.id}`)
  res.json(platform.fieldAliases || {})
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
  await delCache(oneCacheKey(req.params.id))
  res.json(platform)
}
