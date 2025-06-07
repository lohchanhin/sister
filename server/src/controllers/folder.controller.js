import Folder from '../models/folder.model.js'

export const createFolder = async (req, res) => {
  const folder = await Folder.create({
    name: req.body.name,
    parentId: req.body.parentId || null,
    description: req.body.description,
    script: req.body.script
  })
  res.status(201).json(folder)
}

export const getFolders = async (req, res) => {
  const parentId = req.query.parentId || null
  const folders = await Folder.find({ parentId })
  res.json(folders)
}

export const getFolder = async (req, res) => {
  const folder = await Folder.findById(req.params.id)
  if (!folder) return res.status(404).json({ message: '找不到資料夾' })
  res.json(folder)
}

export const updateFolder = async (req, res) => {
  const folder = await Folder.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!folder) return res.status(404).json({ message: '資料夾不存在' })
  res.json(folder)
}

export const deleteFolder = async (req, res) => {
  const folder = await Folder.findByIdAndDelete(req.params.id)
  if (!folder) return res.status(404).json({ message: '資料夾不存在' })
  res.json({ message: '已刪除' })
}
