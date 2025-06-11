import Folder from '../models/folder.model.js'
import { getDescendantFolderIds } from '../utils/folderTree.js'

const parseTags = (t) => {
  if (!t) return []
  if (Array.isArray(t)) return t
  try {
    const parsed = JSON.parse(t)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return t.split(',').map(s => s.trim()).filter(Boolean)
  }
}

export const createFolder = async (req, res) => {
  const folder = await Folder.create({
    name: req.body.name,
    parentId: req.body.parentId || null,
    description: req.body.description,
    script: req.body.script,
    type: req.body.type || 'raw',
    tags: parseTags(req.body.tags)
  })
  res.status(201).json(folder)
}

export const getFolders = async (req, res) => {
  const parentId = req.query.parentId || null
  const deep = req.query.deep === 'true'
  const type = req.query.type || 'raw'

  let parentIds = [parentId]
  if (deep) {
    const childIds = await getDescendantFolderIds(parentId)
    parentIds = parentIds.concat(childIds)
  }

  const query = { parentId: { $in: parentIds }, type }
  if (req.query.tags) {
    const tags = Array.isArray(req.query.tags)
      ? req.query.tags
      : req.query.tags.split(',')
    query.tags = { $all: tags }
  }
  let queryBuilder = Folder.find(query)
  if (parentId === null && type === 'edited') {
    queryBuilder = queryBuilder.sort({ createdAt: -1 })
  }
  const folders = await queryBuilder
  res.json(folders)
}

export const getFolder = async (req, res) => {
  const folder = await Folder.findById(req.params.id)
  if (!folder) return res.status(404).json({ message: '找不到資料夾' })
  res.json(folder)
}

export const updateFolder = async (req, res) => {
  if (req.body.tags) req.body.tags = parseTags(req.body.tags)
  if (req.body.type && !['raw', 'edited'].includes(req.body.type)) {
    delete req.body.type
  }
  const folder = await Folder.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!folder) return res.status(404).json({ message: '資料夾不存在' })
  res.json(folder)
}

export const deleteFolder = async (req, res) => {
  await Folder.findByIdAndDelete(req.params.id)
  res.json({ message: '資料夾已刪除' })
}
