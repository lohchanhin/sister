import ReviewStage from '../models/reviewStage.model.js'
import ReviewRecord from '../models/reviewRecord.model.js'
import Asset from '../models/asset.model.js'

export const getAssetStages = async (req, res) => {
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
  res.json(list)
}

export const updateStageStatus = async (req, res) => {
  const assetId = req.params.id
  const stageId = req.params.stageId
  const completed = !!req.body.completed

  const stage = await ReviewStage.findById(stageId).populate('responsible')
  if (!stage) return res.status(404).json({ message: '階段不存在' })

  const isManager = req.user.roleId?.name === 'manager'
  if (!isManager && String(stage.responsible._id) !== String(req.user._id)) {
    return res.status(403).json({ message: '無權審核此階段' })
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
  if (total && done === total) {
    const asset = await Asset.findById(assetId)
    if (asset) {
      asset.reviewStatus = 'approved'
      await asset.save()
    }
  }

  res.json(record)
}
