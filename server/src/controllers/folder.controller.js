import Folder from '../models/folder.model.js'
import { getDescendantFolderIds } from '../utils/folderTree.js'
import { includeManagers } from '../utils/includeManagers.js'
import { getCache, setCache } from '../utils/cache.js'

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
  const baseUsers = Array.isArray(req.body.allowedUsers)
    ? Array.from(new Set([...req.body.allowedUsers, req.user._id]))
    : [req.user._id]
  const folder = await Folder.create({
    name: req.body.name,
    parentId: req.body.parentId || null,
    description: req.body.description,
    script: req.body.script,
    type: req.body.type || 'raw',
    tags: parseTags(req.body.tags),
    allowedUsers: await includeManagers(baseUsers)
  })
  res.status(201).json(folder)
}

export const getFolders = async (req, res) => {
  const cacheKey = `folders:${req.user._id}:${JSON.stringify(req.query)}`
  const cached = await getCache(cacheKey)
  if (cached) {
    return res.json(cached)
  }
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
  await setCache(cacheKey, result)
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
  } else if (Array.isArray(req.body.allowedUsers)) {
    req.body.allowedUsers = await includeManagers(req.body.allowedUsers)
  }
  const folder = await Folder.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!folder) return res.status(404).json({ message: '資料夾不存在' })
  res.json(folder)
}

export const deleteFolder = async (req, res) => {
  await Folder.findByIdAndDelete(req.params.id)
  res.json({ message: '資料夾已刪除' })
}

export const updateFoldersViewers = async (req, res) => {
  const { ids, allowedUsers } = req.body
  if (!Array.isArray(ids) || !Array.isArray(allowedUsers)) {
    return res.status(400).json({ message: '參數錯誤' })
  }
  const users = await includeManagers(allowedUsers)
  await Folder.updateMany({ _id: { $in: ids } }, { allowedUsers: users })
  res.json({ message: '已更新' })
}

