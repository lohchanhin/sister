import ReviewStage from '../models/reviewStage.model.js'
import FolderReviewRecord from '../models/folderReviewRecord.model.js'
import Folder from '../models/folder.model.js'

export const getFolderStages = async (req, res) => {
  const stages = await ReviewStage.find().populate('responsible').sort('order')
  const records = await FolderReviewRecord.find({ folderId: req.params.id })
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

export const updateFolderStageStatus = async (req, res) => {
  const folderId = req.params.id
  const stageId = req.params.stageId
  const completed = !!req.body.completed

  const stage = await ReviewStage.findById(stageId).populate('responsible')
  if (!stage) return res.status(404).json({ message: '階段不存在' })

  if (String(stage.responsible._id) !== String(req.user._id)) {
    return res.status(403).json({ message: '無權審核此階段' })
  }

  if (completed) {
    const prevStages = await ReviewStage.find({ order: { $lt: stage.order } }, '_id')
    if (prevStages.length) {
      const prevIds = prevStages.map(s => s._id)
      const doneCount = await FolderReviewRecord.countDocuments({
        folderId,
        stageId: { $in: prevIds },
        completed: true
      })
      if (doneCount < prevStages.length) {
        return res.status(400).json({ message: '前置審核未完成' })
      }
    }
  }

  let record = await FolderReviewRecord.findOne({ folderId, stageId })
  if (!record) {
    record = await FolderReviewRecord.create({ folderId, stageId, completed, updatedBy: req.user._id })
  } else {
    record.completed = completed
    record.updatedBy = req.user._id
    await record.save()
  }

  const total = await ReviewStage.countDocuments()
  const done = await FolderReviewRecord.countDocuments({ folderId, completed: true })
  const folder = await Folder.findById(folderId)
  if (folder) {
    if (total && done === total) {
      folder.reviewStatus = 'approved'
    } else if (done < total && folder.reviewStatus === 'approved') {
      folder.reviewStatus = 'pending'
    }
    await folder.save()
  }

  res.json(record)
}
