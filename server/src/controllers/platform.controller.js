import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'
import WeeklyNote from '../models/weeklyNote.model.js'

export const createPlatform = async (req, res) => {
  try {
    const { name, platformType, fields, mode } = req.body
    const platform = await Platform.create({
      name,
      platformType,
      fields,
      mode,
      clientId: req.params.clientId
    })
    res.status(201).json(platform)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: '平台名稱重複' })
    }
    throw err
  }
}

export const getPlatforms = async (req, res) => {
  const list = await Platform.find({ clientId: req.params.clientId })
  res.json(list)
}

export const getPlatform = async (req, res) => {
  const p = await Platform.findOne({ _id: req.params.id, clientId: req.params.clientId })
  if (!p) return res.status(404).json({ message: '平台不存在' })
  res.json(p)
}

export const updatePlatform = async (req, res) => {
  try {
    const { name, platformType, fields, mode } = req.body
    const p = await Platform.findOneAndUpdate(
      { _id: req.params.id, clientId: req.params.clientId },
      { name, platformType, fields, mode },
      { new: true }
    )
    if (!p) return res.status(404).json({ message: '平台不存在' })
    res.json(p)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: '平台名稱重複' })
    }
    throw err
  }
}

export const deletePlatform = async (req, res) => {
  await Platform.findOneAndDelete({ _id: req.params.id, clientId: req.params.clientId })
  res.json({ message: '平台已刪除' })
}

export const transferPlatform = async (req, res) => {
  const { clientId } = req.body
  if (!clientId) {
    return res.status(400).json({ message: '缺少 clientId' })
  }
  const platform = await Platform.findById(req.params.id)
  if (!platform) return res.status(404).json({ message: '平台不存在' })
  platform.clientId = clientId
  await platform.save()
  await AdDaily.updateMany({ platformId: req.params.id }, { clientId })
  await WeeklyNote.updateMany({ platformId: req.params.id }, { clientId })
  res.json(platform)
}
