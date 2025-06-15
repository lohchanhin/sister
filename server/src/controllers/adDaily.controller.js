import mongoose from 'mongoose'
import fs from 'node:fs'
import AdDaily from '../models/adDaily.model.js'

const sanitizeNumber = val =>
  parseFloat(String(val).replace(/[^\d.]/g, '')) || 0

export const createAdDaily = async (req, res) => {
  const rec = await AdDaily.create({
    ...req.body,
    spent: sanitizeNumber(req.body.spent),
    enquiries: sanitizeNumber(req.body.enquiries),
    reach: sanitizeNumber(req.body.reach),
    impressions: sanitizeNumber(req.body.impressions),
    clicks: sanitizeNumber(req.body.clicks),
    clientId: req.params.clientId,
    platformId: req.params.platformId
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

export const importAdDaily = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上傳檔案' })
  }

  const xlsx = await import('xlsx')
  const wb = xlsx.readFile(req.file.path)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json(sheet)

  const records = rows
    .map(row => ({
      date: row.date || row.Date || row['日期'],
      spent: sanitizeNumber(row.spent || row.Spent || row['花費']),
      enquiries: sanitizeNumber(row.enquiries || row.Enquiries || row['詢問']),
      reach: sanitizeNumber(row.reach || row.Reach || row['觸及']),
      impressions: sanitizeNumber(row.impressions || row.Impressions || row['曝光']),
      clicks: sanitizeNumber(row.clicks || row.Clicks || row['點擊']),
      clientId: req.params.clientId,
      platformId: req.params.platformId
    }))
    .filter(r => r.date)
    .map(r => ({ ...r, date: new Date(r.date) }))

  const docs = await AdDaily.insertMany(records)
  fs.unlink(req.file.path, () => {})
  res.status(201).json({ count: docs.length })
}
