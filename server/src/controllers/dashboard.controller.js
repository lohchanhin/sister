import Asset from '../models/asset.model.js'
import ReviewRecord from '../models/reviewRecord.model.js'
import AdDaily from '../models/adDaily.model.js'

export const getSummary = async (req, res) => {
  const assetLimit = 7
  const reviewLimit = 7

  const assetDocs = await Asset.find()
    .sort({ createdAt: -1 })
    .limit(assetLimit)
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

  const reviewDocs = await ReviewRecord.find()
    .sort({ updatedAt: -1 })
    .limit(reviewLimit)
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

  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)
  const adAgg = await AdDaily.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        spent: { $sum: '$spent' },
        enquiries: { $sum: '$enquiries' },
        reach: { $sum: '$reach' },
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' }
      }
    }
  ])

  const adSummary = adAgg[0] || { spent: 0, enquiries: 0, reach: 0, impressions: 0, clicks: 0 }

  res.json({ recentAssets, recentReviews, adSummary })
}

export const getDaily = async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 7, 30)

  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days + 1)

  const list = await AdDaily.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
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
