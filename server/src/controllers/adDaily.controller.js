import { t } from '../i18n/messages.js'
import mongoose from 'mongoose'
import AdDaily from '../models/adDaily.model.js'
import Platform from '../models/platform.model.js'
import WeeklyNote from '../models/weeklyNote.model.js'
import path from 'node:path'
import { uploadFile } from '../utils/gcs.js'
import { decodeFilename } from '../utils/decodeFilename.js'
import fs from 'node:fs/promises'
import { getCache, setCache, clearCacheByPrefix } from '../utils/cache.js'

/** ------------------ 工具函数 ------------------ **/
const sanitizeNumber = val =>
  parseFloat(String(val).replace(/[^\d.]/g, '')) || 0

// accepts optional currency prefix like RM or USD
const numericPattern = /^[^\d-]*[\d\s,.$]+$/
const sanitizeExtraData = obj => {
  const result = {}
  if (!obj) return result
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number') result[k] = v
    else if (numericPattern.test(String(v))) result[k] = sanitizeNumber(v)
    else result[k] = v
  }
  return result
}

const formulaPattern = /^[0-9+\-*/().\s_a-zA-Z]+$/
const evalFormula = (formula, data) => {
  if (!formula || !formulaPattern.test(formula)) return 0
  try {
    const fn = new Function('data', `with (data) { return ${formula}; }`)
    const res = fn(data)
    return typeof res === 'number' && !isNaN(res) ? res : 0
  } catch {
    return 0
  }
}

/**
 * 将传入数据的 extraData/colors 清洗成只包含平台字段 id
 */
// ✅ 非破坏性：保留未知鍵
const normalizeByPlatform = (platform, rawExtra = {}, rawColors = {}) => {
  const idMap = {}
  platform?.fields?.forEach(f => {
    idMap[f.id] = f.id
    if (f.slug) idMap[f.slug] = f.id
    if (f.name) idMap[f.name] = f.id
  })

  const cleanedExtra = sanitizeExtraData(rawExtra)
  const extra = { ...cleanedExtra }     // 先保留全部
  for (const [k, v] of Object.entries(cleanedExtra)) {
    const nk = idMap[k]
    if (nk && nk !== k) extra[nk] = v   // 能映射的再新增一份到 id 鍵
  }

  const colors = { ...(rawColors || {}) }
  for (const [k, v] of Object.entries(rawColors || {})) {
    const nk = idMap[k]
    if (nk && nk !== k) colors[nk] = v
  }

  return { extra, colors }
}


/**
 * 根据平台公式字段，计算并写入公式结果
 */
const applyFormulas = (platform, payload) => {
  const formulas = platform?.fields?.filter(f => f.type === 'formula' && f.formula) || []
  if (!formulas.length) return payload

  const vars = {
    spent: payload.spent,
    enquiries: payload.enquiries,
    reach: payload.reach,
    impressions: payload.impressions,
    clicks: payload.clicks
  }
  for (const f of platform.fields || []) {
    if (!f?.slug) continue
    if (payload.extraData[f.id] !== undefined) {
      vars[f.slug] = payload.extraData[f.id]
    }
  }
  for (const f of formulas) {
    const val = evalFormula(f.formula, vars)
    payload.extraData[f.id] = val
    vars[f.slug] = val
  }
  return payload
}

/** ------------------ 控制器 ------------------ **/

export const createAdDaily = async (req, res) => {
  const platform = await Platform.findById(req.params.platformId)
  if (!platform) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })

  let payload = {
    date: req.body.date,
    spent: sanitizeNumber(req.body.spent),
    enquiries: sanitizeNumber(req.body.enquiries),
    reach: sanitizeNumber(req.body.reach),
    impressions: sanitizeNumber(req.body.impressions),
    clicks: sanitizeNumber(req.body.clicks),
    clientId: req.params.clientId,
    platformId: req.params.platformId
  }

  const { extra, colors } = normalizeByPlatform(platform, req.body.extraData, req.body.colors)
  payload.extraData = extra
  payload.colors = colors
  payload = applyFormulas(platform, payload)

  const rec = await AdDaily.findOneAndUpdate(
    { clientId: payload.clientId, platformId: payload.platformId, date: payload.date },
    { $set: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
  await clearCacheByPrefix('adDaily:')
  res.status(201).json(rec)
}

export const getAdDaily = async (req, res) => {
  const query = { clientId: req.params.clientId, platformId: req.params.platformId }
  if (req.query.start && req.query.end) {
    query.date = { $gte: new Date(req.query.start), $lte: new Date(req.query.end) }
  }
  const sortObj = { date: req.query.order === 'desc' ? -1 : 1 }

  const cacheKey = `adDaily:${req.params.clientId}:${req.params.platformId}:${JSON.stringify(query)}:${JSON.stringify(sortObj)}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

  const platform = await Platform.findById(req.params.platformId)
  const list = await AdDaily.find(query).sort(sortObj)

  // 清洗每条数据，确保只返回新 id
  for (const rec of list) {
    const { extra, colors } = normalizeByPlatform(platform, rec.extraData, rec.colors)
    // 只映射到響應，不寫回資料庫（非破壞性）
    rec.extraData = extra
    rec.colors = colors
  }

  await setCache(cacheKey, list)
  res.json(list)
}

export const getWeeklyData = async (req, res) => {
  const match = {
    clientId: new mongoose.Types.ObjectId(req.params.clientId),
    platformId: new mongoose.Types.ObjectId(req.params.platformId)
  }
  if (req.query.start && req.query.end) {
    match.date = { $gte: new Date(req.query.start), $lte: new Date(req.query.end) }
  }
  const cacheKey = `adDailyWeekly:${req.params.clientId}:${req.params.platformId}:${JSON.stringify(match)}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

  const data = await AdDaily.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $isoWeekYear: '$date' }, week: { $isoWeek: '$date' } },
        spent: { $sum: '$spent' },
        enquiries: { $sum: '$enquiries' },
        reach: { $sum: '$reach' },
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' }
      }
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } }
  ])
  const result = data.map(d => ({
    week: `${d._id.year}-W${d._id.week}`,
    spent: d.spent,
    enquiries: d.enquiries,
    reach: d.reach,
    impressions: d.impressions,
    clicks: d.clicks
  }))
  await setCache(cacheKey, result)
  res.json(result)
}

export const bulkCreateAdDaily = async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: t('DATA_FORMAT_ERROR') })
  }

  const platform = await Platform.findById(req.params.platformId)
  const records = req.body.map(row => {
    let payload = {
      date: new Date(row.date),
      spent: sanitizeNumber(row.spent),
      enquiries: sanitizeNumber(row.enquiries),
      reach: sanitizeNumber(row.reach),
      impressions: sanitizeNumber(row.impressions),
      clicks: sanitizeNumber(row.clicks),
      clientId: req.params.clientId,
      platformId: req.params.platformId
    }
    const { extra, colors } = normalizeByPlatform(platform, row.extraData, row.colors)
    payload.extraData = extra
    payload.colors = colors
    payload = applyFormulas(platform, payload)
    return payload
  })

  let docs
  try {
    docs = await AdDaily.insertMany(records, { ordered: false })
  } catch (err) {
    if (err.insertedDocs) docs = err.insertedDocs
    else throw err
  }
  await clearCacheByPrefix('adDaily:')
  res.status(201).json(docs)
}

export const importAdDaily = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: t('FILE_NOT_UPLOADED') })
  }

  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const originalName = decodeFilename(req.file.originalname)
  const ext = path.extname(originalName)
  const filename = unique + ext
  const filePath = await uploadFile(req.file.path, filename, req.file.mimetype)
  const xlsxBuffer = await fs.readFile(req.file.path)
  await fs.unlink(req.file.path)

  const xlsx = await import('xlsx')
  const wb = xlsx.read(xlsxBuffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json(sheet)

  const platform = await Platform.findById(req.params.platformId)
  const records = rows.map(row => {
    let payload = {
      date: new Date(row.date || row.Date || row['日期']),
      spent: sanitizeNumber(row.spent || row.Spent || row['花費']),
      enquiries: sanitizeNumber(row.enquiries || row.Enquiries || row['詢問']),
      reach: sanitizeNumber(row.reach || row.Reach || row['觸及']),
      impressions: sanitizeNumber(row.impressions || row.Impressions || row['曝光']),
      clicks: sanitizeNumber(row.clicks || row.Clicks || row['點擊']),
      clientId: req.params.clientId,
      platformId: req.params.platformId
    }
    const { extra, colors } = normalizeByPlatform(platform, row.extraData, row.colors)
    payload.extraData = extra
    payload.colors = colors
    payload = applyFormulas(platform, payload)
    return payload
  })

  let docs
  try {
    docs = await AdDaily.insertMany(records, { ordered: false })
  } catch (err) {
    if (err.insertedDocs) docs = err.insertedDocs
    else throw err
  }
  await clearCacheByPrefix('adDaily:')
  res.status(201).json({ docs, filePath })
}

export const updateAdDaily = async (req, res) => {
  const platform = await Platform.findById(req.params.platformId)
  if (!platform) return res.status(404).json({ message: t('PLATFORM_NOT_FOUND') })

  let payload = {
    date: req.body.date,
    spent: sanitizeNumber(req.body.spent),
    enquiries: sanitizeNumber(req.body.enquiries),
    reach: sanitizeNumber(req.body.reach),
    impressions: sanitizeNumber(req.body.impressions),
    clicks: sanitizeNumber(req.body.clicks)
  }

  const { extra, colors } = normalizeByPlatform(platform, req.body.extraData, req.body.colors)
  payload.extraData = extra
  payload.colors = colors
  payload = applyFormulas(platform, payload)

  const rec = await AdDaily.findByIdAndUpdate(
    req.params.id,
    { $set: payload },
    { new: true }
  )
  if (!rec) return res.status(404).json({ message: t('RECORD_NOT_FOUND') })
  await clearCacheByPrefix('adDaily:')
  res.json(rec)
}

export const deleteAdDaily = async (req, res) => {
  await AdDaily.findByIdAndDelete(req.params.id)
  await clearCacheByPrefix('adDaily:')
  res.json({ message: t('RECORD_DELETED') })
}
