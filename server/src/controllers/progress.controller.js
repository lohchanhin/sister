import ProgressTemplate from '../models/progressTemplate.model.js'
import ProgressRecord from '../models/progressRecord.model.js'

/* ---------- \u6a21\u677f ---------- */
export const createTemplate = async (req, res) => {
  const tpl = await ProgressTemplate.create({ ...req.body, createdBy: req.user._id })
  res.status(201).json(tpl)
}
export const getTemplates = async (_, res) => {
  const list = await ProgressTemplate.find()
  res.json(list)
}

/* ---------- \u7d00\u9304 ---------- */
export const createRecord = async (req, res) => {
  const rec = await ProgressRecord.create({ ...req.body, createdBy: req.user._id })
  res.status(201).json(rec)
}
export const getRecords = async (req, res) => {
  const recs = await ProgressRecord.find({ templateId: req.params.tplId })
  res.json(recs)
}
