import Platform from '../models/platform.model.js'

export const createPlatform = async (req, res) => {
  try {
    const platform = await Platform.create({
      ...req.body,
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
    const p = await Platform.findOneAndUpdate(
      { _id: req.params.id, clientId: req.params.clientId },
      req.body,
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
