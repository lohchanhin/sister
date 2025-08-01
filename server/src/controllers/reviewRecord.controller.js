import { t } from '../i18n/messages.js'
import ReviewStage from '../models/reviewStage.model.js'
import ReviewRecord from '../models/reviewRecord.model.js'
import Asset from '../models/asset.model.js'
import { clearDashboardCache } from './dashboard.controller.js'
import { getCache, setCache, clearCacheByPrefix } from '../utils/cache.js'

export const getAssetStages = async (req, res) => {
  const cacheKey = `assetStages:${req.params.id}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

  const stages = await ReviewStage.find().populate('responsible').sort('order')
  const records = await ReviewRecord.find({ assetId: req.params.id })
  const map = {}
  for (const r of records) map[r.stageId.toString()] = r
  const list = stages.map(s => ({
    _id: s._id,
    name: s.name,
    order: s.order,
    responsible: s.responsible,
    completed: map[s._id.toString()]?.completed || false
  }))
  await setCache(cacheKey, list)
  res.json(list)
}

export const updateStageStatus = async (req, res) => {
  const assetId = req.params.id
  const stageId = req.params.stageId
  const completed = !!req.body.completed
  const fromDashboard =
    req.query.dashboard === '1' ||
    req.query.dashboard === 'true' ||
    req.body.fromDashboard
  const skipPrevCheck = req.body.skipPrevCheck === true || req.query.skipPrevCheck === '1'

  const stage = await ReviewStage.findById(stageId).populate('responsible')
  if (!stage) return res.status(404).json({ message: t('REVIEW_STAGE_NOT_FOUND') })

  if (!fromDashboard && String(stage.responsible._id) !== String(req.user._id)) {
    return res.status(403).json({ message: t('REVIEW_STAGE_NOT_ALLOWED') })
  }

  // 檢查前置審核是否完成
  if (completed && !skipPrevCheck && !fromDashboard) {
    const prevStages = await ReviewStage.find({ order: { $lt: stage.order } }, '_id')
    if (prevStages.length) {
      const prevIds = prevStages.map((s) => s._id)
      const doneCount = await ReviewRecord.countDocuments({
        assetId,
        stageId: { $in: prevIds },
        completed: true
      })
      if (doneCount < prevStages.length) {
        return res.status(400).json({ message: t('PRE_REVIEW_UNFINISHED') })
      }
    }
  }

  let record = await ReviewRecord.findOne({ assetId, stageId })
  if (!record) {
    record = await ReviewRecord.create({ assetId, stageId, completed, updatedBy: req.user._id })
  } else {
    record.completed = completed
    record.updatedBy = req.user._id
    await record.save()
  }

  const total = await ReviewStage.countDocuments()
  const done = await ReviewRecord.countDocuments({ assetId, completed: true })
  const asset = await Asset.findById(assetId)
  if (asset) {
    if (total && done === total) {
      asset.reviewStatus = 'approved'
    } else if (done < total && asset.reviewStatus === 'approved') {
      asset.reviewStatus = 'pending'
    }
    await asset.save()
  }

  await clearCacheByPrefix('assetStages:')
  await clearDashboardCache()

  res.json(record)
}
