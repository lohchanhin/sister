import mongoose from 'mongoose'
import Asset from '../models/asset.model.js'
import ReviewRecord from '../models/reviewRecord.model.js'
import AdDaily from '../models/adDaily.model.js'
import { getCache, setCache } from '../utils/cache.js'

export const getSummary = async (req, res) => {
  const { clientId, platformId } = req.query
  const cacheKey = `dashboard:${req.user._id}:${clientId || 'all'}:${platformId || 'all'}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

  /* -------- 最近素材 -------- */
  const assetDocs = await Asset.find()
    .sort({ createdAt: -1 })
    .limit(7)
    .populate('uploadedBy', 'username name')
    .lean()

  const recentAssets = assetDocs
    .filter(a => !a.allowedUsers?.length || a.allowedUsers.some(id => id.equals(req.user._id)))
    .map(a => ({
      _id: a._id,
      fileName: a.filename,
      fileType: a.type,
      uploaderName: a.uploadedBy?.name || a.uploadedBy?.username,
      createdAt: a.createdAt
    }))

  /* -------- 最近審查紀錄 -------- */
  const reviewDocs = await ReviewRecord.find()
    .sort({ updatedAt: -1 })
    .limit(7)
    .populate('assetId', 'filename allowedUsers')
    .populate('stageId', 'name')
    .populate('updatedBy', 'username name')
    .lean()

  const recentReviews = reviewDocs
    .filter(r => !r.assetId?.allowedUsers?.length || r.assetId.allowedUsers.some(id => id.equals(req.user._id)))
    .map(r => ({
      _id: r._id,
      assetFile: r.assetId?.filename,
      stage: r.stageId?.name,
      completed: r.completed,
      updatedAt: r.updatedAt,
      updatedBy: r.updatedBy?.name || r.updatedBy?.username
    }))

  /* -------- 廣告 7 日匯總 -------- */
  const end   = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - 6)

  const match = { date: { $gte: start, $lte: end } }
  if (clientId) match.clientId = new mongoose.Types.ObjectId(clientId)
  if (platformId) match.platformId = new mongoose.Types.ObjectId(platformId)

  const [adAgg] = await AdDaily.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        spent:       { $sum: '$spent' },
        enquiries:   { $sum: '$enquiries' },
        reach:       { $sum: '$reach' },
        impressions: { $sum: '$impressions' },
        clicks:      { $sum: '$clicks' }
      }
    }
  ])

  const adSummary = adAgg || { spent:0, enquiries:0, reach:0, impressions:0, clicks:0 }

  /* -------- 素材統計 -------- */
  const [
    rawTotal,
    editedTotal,
    pending,
    approved,
    rejected
  ] = await Promise.all([
    Asset.countDocuments({ type: 'raw' }),
    Asset.countDocuments({ type: 'edited' }),
    Asset.countDocuments({ type: 'edited', reviewStatus: 'pending' }),
    Asset.countDocuments({ type: 'edited', reviewStatus: 'approved' }),
    Asset.countDocuments({ type: 'edited', reviewStatus: 'rejected' })
  ])

  const assetStats = { rawTotal, editedTotal, pending, approved, rejected }

  /* -------- 統整 & 快取 -------- */
  const result = { recentAssets, recentReviews, adSummary, assetStats }
  await setCache(cacheKey, result, 60)   // 快取 60 秒
  res.json(result)
}

export const getDaily = async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 7, 30)
  const { clientId, platformId } = req.query

  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days + 1)

  const match = { date: { $gte: start, $lte: end } }
  if (clientId) match.clientId = new mongoose.Types.ObjectId(clientId)
  if (platformId) match.platformId = new mongoose.Types.ObjectId(platformId)

  const list = await AdDaily.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        spent: { $sum: '$spent' },
        enquiries: { $sum: '$enquiries' },
        reach: { $sum: '$reach' },
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  res.json(
    list.map(d => ({
      date: d._id,
      spent: d.spent,
      enquiries: d.enquiries,
      reach: d.reach,
      impressions: d.impressions,
      clicks: d.clicks
    }))
  )
}
