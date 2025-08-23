import { t } from '../i18n/messages.js'
import mongoose from 'mongoose'
import AdDaily from '../models/adDaily.model.js'
import Platform from '../models/platform.model.js'
import path from 'node:path'
import { uploadFile } from '../utils/gcs.js'
import { decodeFilename } from '../utils/decodeFilename.js'
import fs from 'node:fs/promises'
import { getCache, setCache, clearCacheByPrefix } from '../utils/cache.js'

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

export const createAdDaily = async (req, res) => {
  const payload = {
    date: req.body.date,
    spent: sanitizeNumber(req.body.spent),
    enquiries: sanitizeNumber(req.body.enquiries),
    reach: sanitizeNumber(req.body.reach),
    impressions: sanitizeNumber(req.body.impressions),
    clicks: sanitizeNumber(req.body.clicks),
    clientId: req.params.clientId,
    platformId: req.params.platformId,
    extraData: sanitizeExtraData(req.body.extraData),
    colors: req.body.colors || {}
  }

  const platform = await Platform.findById(req.params.platformId)
  const formulas = platform?.fields?.filter(f => f.formula) || []
  if (formulas.length) {
    payload.extraData = payload.extraData || {}
    const vars = { ...payload, ...payload.extraData }
    for (const f of formulas) {
      const val = evalFormula(f.formula, vars)
      payload.extraData[f.name] = val
      vars[f.name] = val
    }
  }
  const rec = await AdDaily.findOneAndUpdate(
    { clientId: payload.clientId, platformId: payload.platformId, date: payload.date },
    payload,
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
  const sortFields = ['date', 'spent', 'enquiries', 'reach', 'impressions', 'clicks']
  let sortObj = { date: 1 }
  if (req.query.sort && sortFields.includes(req.query.sort)) {
    sortObj = { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 }
  }
  const cacheKey = `adDaily:${req.params.clientId}:${req.params.platformId}:${JSON.stringify(query)}:${JSON.stringify(sortObj)}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

  const list = await AdDaily.find(query).sort(sortObj)
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

  const known = ['date', 'spent', 'enquiries', 'reach', 'impressions', 'clicks', 'extraData', 'colors']

  const platform = await Platform.findById(req.params.platformId)
  const formulas = platform?.fields?.filter(f => f.formula) || []

  const records = req.body
    .map(row => {
      const extra = sanitizeExtraData({ ...(row.extraData || {}) })
      for (const k of Object.keys(row)) {
        if (!known.includes(k)) extra[k] = numericPattern.test(String(row[k]))
          ? sanitizeNumber(row[k])
          : row[k]
      }
      return {
        date: row.date,
        spent: sanitizeNumber(row.spent),
        enquiries: sanitizeNumber(row.enquiries),
        reach: sanitizeNumber(row.reach),
        impressions: sanitizeNumber(row.impressions),
        clicks: sanitizeNumber(row.clicks),
        clientId: req.params.clientId,
        platformId: req.params.platformId,
        extraData: Object.keys(extra).length ? extra : undefined,
        colors: row.colors || undefined
      }
    })
    .filter(r => r.date)
    .map(r => ({ ...r, date: new Date(r.date) }))

  if (formulas.length) {
    for (const r of records) {
      r.extraData = r.extraData || {}
      const vars = { ...r, ...r.extraData }
      for (const f of formulas) {
        const val = evalFormula(f.formula, vars)
        r.extraData[f.name] = val
        vars[f.name] = val
      }
    }
  }

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
  const filePath = await uploadFile(
    req.file.path,
    filename,
    req.file.mimetype
  )
  const xlsxBuffer = await fs.readFile(req.file.path)
  await fs.unlink(req.file.path)

  const xlsx = await import('xlsx')
  const wb = xlsx.read(xlsxBuffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json(sheet)

  const known = [
    'date', 'Date', '日期',
    'spent', 'Spent', '花費',
    'enquiries', 'Enquiries', '詢問',
    'reach', 'Reach', '觸及',
    'impressions', 'Impressions', '曝光',
    'clicks', 'Clicks', '點擊',
    'extraData',
    'colors'
  ]

  const platform = await Platform.findById(req.params.platformId)
  const formulas = platform?.fields?.filter(f => f.formula) || []

  const records = rows
    .map(row => {
      const extra = sanitizeExtraData({ ...(row.extraData || {}) })
      for (const k of Object.keys(row)) {
        if (!known.includes(k))
          extra[k] = numericPattern.test(String(row[k]))
            ? sanitizeNumber(row[k])
            : row[k]
      }
      return {
        date: row.date || row.Date || row['日期'],
        spent: sanitizeNumber(row.spent || row.Spent || row['花費']),
        enquiries: sanitizeNumber(row.enquiries || row.Enquiries || row['詢問']),
        reach: sanitizeNumber(row.reach || row.Reach || row['觸及']),
        impressions: sanitizeNumber(row.impressions || row.Impressions || row['曝光']),
        clicks: sanitizeNumber(row.clicks || row.Clicks || row['點擊']),
        clientId: req.params.clientId,
        platformId: req.params.platformId,
        extraData: Object.keys(extra).length ? extra : undefined,
        colors: row.colors || undefined
      }
    })
    .filter(r => r.date)
    .map(r => ({ ...r, date: new Date(r.date) }))

  if (formulas.length) {
    for (const r of records) {
      r.extraData = r.extraData || {}
      const vars = { ...r, ...r.extraData }
      for (const f of formulas) {
        const val = evalFormula(f.formula, vars)
        r.extraData[f.name] = val
        vars[f.name] = val
      }
    }
  }

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
  const payload = {
    date: req.body.date,
    spent: sanitizeNumber(req.body.spent),
    enquiries: sanitizeNumber(req.body.enquiries),
    reach: sanitizeNumber(req.body.reach),
    impressions: sanitizeNumber(req.body.impressions),
    clicks: sanitizeNumber(req.body.clicks),
    extraData: sanitizeExtraData(req.body.extraData),
    colors: req.body.colors || {}
  }

  const platform = await Platform.findById(req.params.platformId)
  const formulas = platform?.fields?.filter(f => f.formula) || []
  if (formulas.length) {
    payload.extraData = payload.extraData || {}
    const vars = { ...payload, ...payload.extraData }
    for (const f of formulas) {
      const val = evalFormula(f.formula, vars)
      payload.extraData[f.name] = val
      vars[f.name] = val
    }
  }

  const rec = await AdDaily.findByIdAndUpdate(
    req.params.id,
    payload,
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
