import mongoose from 'mongoose'
import Asset from '../models/asset.model.js'
import ReviewRecord from '../models/reviewRecord.model.js'
import ReviewStage from '../models/reviewStage.model.js'
import AdDaily from '../models/adDaily.model.js'
import { getCache, setCache } from '../utils/cache.js'

export const getSummary = async (req, res) => {
  const cacheKey = `dashboard:${req.user._id}`
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

  /* -------- 最近成品及進度 -------- */
  const productDocs = await Asset.find({ type: 'edited' })
    .sort({ createdAt: -1 })
    .limit(7)
    .populate('uploadedBy', 'username name')
    .lean()

  const filteredProducts = productDocs.filter(p =>
    !p.allowedUsers?.length || p.allowedUsers.some(id => id.equals(req.user._id))
  )

  const totalStages = await ReviewStage.countDocuments()
  const ids = filteredProducts.map(p => p._id)
  const progressRecords = await ReviewRecord.aggregate([
    { $match: { assetId: { $in: ids }, completed: true } },
    { $group: { _id: '$assetId', done: { $sum: 1 } } }
  ])
  const progressMap = {}
  progressRecords.forEach(r => { progressMap[r._id.toString()] = r.done })

  const recentProducts = filteredProducts.map(p => ({
    _id: p._id,
    fileName: p.filename,
    fileType: p.type,
    uploaderName: p.uploadedBy?.name || p.uploadedBy?.username,
    createdAt: p.createdAt,
    progress: { done: progressMap[p._id.toString()] || 0, total: totalStages }
  }))

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
  const result = { recentAssets, recentReviews, recentProducts, assetStats }
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
