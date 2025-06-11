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
    tags: parseTags(req.body.tags),
    allowedUsers: Array.isArray(req.body.allowedUsers)
      ? req.body.allowedUsers
      : [],
    createdBy: req.user._id
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
  const folders = await Folder.find(query)
  let result = folders
  if (req.user.roleId?.name !== 'manager') {
    result = folders.filter(f => !f.allowedUsers?.length || f.allowedUsers.some(id => id.equals(req.user._id)))
  }
  res.json(result)
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
  if (req.body.allowedUsers && !Array.isArray(req.body.allowedUsers)) {
    delete req.body.allowedUsers
  }
  const folder = await Folder.findById(req.params.id)
  if (!folder) return res.status(404).json({ message: '資料夾不存在' })

  const isCreator = folder.createdBy?.equals(req.user._id)
  const isManager = req.user.roleId?.name === 'manager'
  if (!isCreator && !isManager) delete req.body.allowedUsers

  Object.assign(folder, req.body)
  await folder.save()
  res.json(folder)
}

export const deleteFolder = async (req, res) => {
  await Folder.findByIdAndDelete(req.params.id)
  res.json({ message: '資料夾已刪除' })
}
