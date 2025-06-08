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

/* ★ 新增 ↓ */
export const updateTemplate = async (req, res) => {
  const tpl = await ProgressTemplate.findById(req.params.id)
  if (!tpl) return res.status(404).json({ message: '模板不存在' })
  tpl.name   = req.body.name   ?? tpl.name
  tpl.fields = req.body.fields ?? tpl.fields
  await tpl.save()
  res.json(tpl)
}
export const deleteTemplate = async (req, res) => {
  const tpl = await ProgressTemplate.findById(req.params.id)
  if (!tpl) return res.status(404).json({ message: '模板不存在' })
  await tpl.deleteOne()
  res.json({ message: '已刪除' })
}

/* ---------- 依 limit 取得最新紀錄 ---------- */
export const getRecentRecords = async (req, res) => {
  const limit = Number(req.query.limit) || 5
  const recs = await ProgressRecord.find()
    .sort({ createdAt: -1 })
    .limit(limit)
  res.json(recs)
}

export const updateRecord = async (req, res) => {
  const rec = await ProgressRecord.findById(req.params.id)
  if (!rec) return res.status(404).json({ message:'紀錄不存在' })
  rec.fieldValues = req.body.fieldValues
  await rec.save()
  res.json(rec)
}