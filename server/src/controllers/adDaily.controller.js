import mongoose from 'mongoose'
import fs from 'node:fs'
import AdDaily from '../models/adDaily.model.js'

const sanitizeNumber = val =>
  parseInt(String(val).replace(/[^\d-]/g, ''), 10) || 0

const sanitizeExtraData = obj => {
  const result = {}
  if (!obj) return result
  for (const [k, v] of Object.entries(obj)) {
    result[k] = sanitizeNumber(v)
  }
  return result
}

export const createAdDaily = async (req, res) => {
  const rec = await AdDaily.create({
    date: req.body.date,
    spent: sanitizeNumber(req.body.spent),
    enquiries: sanitizeNumber(req.body.enquiries),
    reach: sanitizeNumber(req.body.reach),
    impressions: sanitizeNumber(req.body.impressions),
    clicks: sanitizeNumber(req.body.clicks),
    clientId: req.params.clientId,
    platformId: req.params.platformId,
    extraData: sanitizeExtraData(req.body.extraData)
  })
  res.status(201).json(rec)
}

export const getAdDaily = async (req, res) => {
  const query = { clientId: req.params.clientId, platformId: req.params.platformId }
  if (req.query.start && req.query.end) {
    query.date = { $gte: new Date(req.query.start), $lte: new Date(req.query.end) }
  }
  const list = await AdDaily.find(query).sort({ date: 1 })
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
  res.json(result)
}

export const bulkCreateAdDaily = async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: '資料格式錯誤' })
  }

  const known = ['date', 'spent', 'enquiries', 'reach', 'impressions', 'clicks', 'extraData']

  const records = req.body
    .map(row => {
      const extra = sanitizeExtraData({ ...(row.extraData || {}) })
      for (const k of Object.keys(row)) {
        if (!known.includes(k)) extra[k] = sanitizeNumber(row[k])
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
        extraData: Object.keys(extra).length ? extra : undefined
      }
    })
    .filter(r => r.date)
    .map(r => ({ ...r, date: new Date(r.date) }))

  const docs = await AdDaily.insertMany(records)
  res.status(201).json(docs)
}

export const importAdDaily = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上傳檔案' })
  }

  const xlsx = await import('xlsx')
  const wb = xlsx.readFile(req.file.path)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json(sheet)

  const known = [
    'date', 'Date', '日期',
    'spent', 'Spent', '花費',
    'enquiries', 'Enquiries', '詢問',
    'reach', 'Reach', '觸及',
    'impressions', 'Impressions', '曝光',
    'clicks', 'Clicks', '點擊',
    'extraData'
  ]

  const records = rows
    .map(row => {
      const extra = sanitizeExtraData({ ...(row.extraData || {}) })
      for (const k of Object.keys(row)) {
        if (!known.includes(k)) extra[k] = sanitizeNumber(row[k])
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
        extraData: Object.keys(extra).length ? extra : undefined
      }
    })
    .filter(r => r.date)
    .map(r => ({ ...r, date: new Date(r.date) }))

  const docs = await AdDaily.insertMany(records)
  fs.unlink(req.file.path, () => {})
  res.status(201).json(docs)
}
