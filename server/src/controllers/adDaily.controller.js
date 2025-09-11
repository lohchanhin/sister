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
  const idMap = {}
  platform?.fields?.forEach(f => {
    idMap[f.id] = f.id
    idMap[f.slug] = f.id
    idMap[f.name] = f.id
  })
  const mapped = {}
  for (const [k, v] of Object.entries(payload.extraData || {})) {
    mapped[idMap[k] || k] = v
  }
  payload.extraData = mapped
  const formulas = platform?.fields?.filter(f => f.formula) || []
  if (formulas.length) {
    payload.extraData = payload.extraData || {}
    const vars = {
      spent: payload.spent,
      enquiries: payload.enquiries,
      reach: payload.reach,
      impressions: payload.impressions,
      clicks: payload.clicks
    }
    for (const f of platform.fields || []) {
      const v = payload.extraData[f.id]
      if (v !== undefined) vars[f.slug] = v
    }
    for (const f of formulas) {
      const val = evalFormula(f.formula, vars)
      payload.extraData[f.id] = val
      vars[f.slug] = val
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

  const platform = await Platform.findById(req.params.platformId)
  const idMap = {}
  platform?.fields?.forEach(f => {
    if (f.name) idMap[f.name] = f.id
    if (f.slug) idMap[f.slug] = f.id
  })

  let list = await AdDaily.find(query).sort(sortObj)
  if (!Array.isArray(list) && list && typeof list === 'object') {
    const keys = Object.keys(list).filter(k => Array.isArray(list[k]))
    if (keys.length) {
      const maxLen = Math.max(...keys.map(k => list[k].length))
      list = Array.from({ length: maxLen }, (_, i) => {
        const row = {}
        keys.forEach(k => { row[k] = list[k][i] })
        return row
      })
    } else list = []
  }
  for (const rec of list) {
    if (!rec || typeof rec !== 'object') continue
    let updated = false
    const extra = {}
    for (const [k, v] of Object.entries(rec.extraData || {})) {
      const nk = idMap[k]
      if (nk) {
        extra[nk] = v
        if (nk !== k) updated = true
      } else {
        extra[k] = v
      }
    }
    const colors = {}
    for (const [k, v] of Object.entries(rec.colors || {})) {
      const nk = idMap[k]
      if (nk) {
        colors[nk] = v
        if (nk !== k) updated = true
      } else {
        colors[k] = v
      }
    }
    if (updated && rec._id) {
      await AdDaily.updateOne({ _id: rec._id }, { extraData: extra, colors })
    }
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

  const known = ['date', 'spent', 'enquiries', 'reach', 'impressions', 'clicks', 'extraData', 'colors']

  const platform = await Platform.findById(req.params.platformId)
  const formulas = platform?.fields?.filter(f => f.formula) || []

  const records = req.body
    .map(row => {
      let extra = sanitizeExtraData({ ...(row.extraData || {}) })
      const mappedExtra = {}
      for (const [k, v] of Object.entries(extra)) {
        const field = platform.fields?.find(
          f => f.id === k || f.slug === k || f.name === k
        )
        mappedExtra[field ? field.id : k] = v
      }
      extra = mappedExtra
      const colors = { ...(row.colors || {}) }
      for (const k of Object.keys(row)) {
        if (!known.includes(k)) {
          if (k.startsWith('color_')) {
            const name = k.replace(/^color_/, '')
            const field = platform.fields?.find(
              f => f.name === name || f.slug === name || f.id === name
            )
            if (field) colors[field.id] = row[k]
          } else {
            const field = platform.fields?.find(
              f => f.name === k || f.slug === k || f.id === k
            )
            const key = field ? field.id : k
            extra[key] = numericPattern.test(String(row[k]))
              ? sanitizeNumber(row[k])
              : row[k]
          }
        }
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
        colors: Object.keys(colors).length ? colors : undefined
      }
    })
    .filter(r => r.date)
    .map(r => ({ ...r, date: new Date(r.date) }))

  if (formulas.length) {
    for (const r of records) {
      r.extraData = r.extraData || {}
      const vars = {
        spent: r.spent,
        enquiries: r.enquiries,
        reach: r.reach,
        impressions: r.impressions,
        clicks: r.clicks
      }
      for (const f of platform.fields || []) {
        const v = r.extraData[f.id]
        if (v !== undefined) vars[f.slug] = v
      }
      for (const f of formulas) {
        const val = evalFormula(f.formula, vars)
        r.extraData[f.id] = val
        vars[f.slug] = val
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
      let extra = sanitizeExtraData({ ...(row.extraData || {}) })
      const mappedExtra = {}
      for (const [k, v] of Object.entries(extra)) {
        const field = platform.fields?.find(
          f => f.id === k || f.slug === k || f.name === k
        )
        mappedExtra[field ? field.id : k] = v
      }
      extra = mappedExtra
      const colors = {}
      for (const k of Object.keys(row)) {
        if (!known.includes(k)) {
          if (k.startsWith('color_')) {
            const name = k.replace(/^color_/, '')
            const field = platform.fields?.find(
              f => f.name === name || f.slug === name || f.id === name
            )
            if (field) colors[field.id] = row[k]
          } else {
            const field = platform.fields?.find(
              f => f.name === k || f.slug === k || f.id === k
            )
            const key = field ? field.id : k
            extra[key] = numericPattern.test(String(row[k]))
              ? sanitizeNumber(row[k])
              : row[k]
          }
        }
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
        colors: Object.keys(colors).length ? colors : undefined
      }
    })
    .filter(r => r.date)
    .map(r => ({ ...r, date: new Date(r.date) }))

  if (formulas.length) {
    for (const r of records) {
      r.extraData = r.extraData || {}
      const vars = {
        spent: r.spent,
        enquiries: r.enquiries,
        reach: r.reach,
        impressions: r.impressions,
        clicks: r.clicks
      }
      for (const f of platform.fields || []) {
        const v = r.extraData[f.id]
        if (v !== undefined) vars[f.slug] = v
      }
      for (const f of formulas) {
        const val = evalFormula(f.formula, vars)
        r.extraData[f.id] = val
        vars[f.slug] = val
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
  const idMap = {}
  platform?.fields?.forEach(f => {
    idMap[f.id] = f.id
    idMap[f.slug] = f.id
    idMap[f.name] = f.id
  })
  const mapped = {}
  for (const [k, v] of Object.entries(payload.extraData || {})) {
    mapped[idMap[k] || k] = v
  }
  payload.extraData = mapped
  const formulas = platform?.fields?.filter(f => f.formula) || []
  if (formulas.length) {
    payload.extraData = payload.extraData || {}
    const vars = {
      spent: payload.spent,
      enquiries: payload.enquiries,
      reach: payload.reach,
      impressions: payload.impressions,
      clicks: payload.clicks
    }
    for (const f of platform.fields || []) {
      const v = payload.extraData[f.id]
      if (v !== undefined) vars[f.slug] = v
    }
    for (const f of formulas) {
      const val = evalFormula(f.formula, vars)
      payload.extraData[f.id] = val
      vars[f.slug] = val
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
