/**
 * Asset Controller  (完整)
 */
import Asset from '../models/asset.model.js'
import Folder from '../models/folder.model.js'
import ReviewStage from '../models/reviewStage.model.js'
import ReviewRecord from '../models/reviewRecord.model.js'
import { getDescendantFolderIds } from '../utils/folderTree.js'
import { ROLES } from '../config/roles.js'
import path from 'node:path'

const parseTags = (t) => {
  if (!t) return []
  if (Array.isArray(t)) return t
  try {
    const parsed = JSON.parse(t)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return t.split(',').map((s) => s.trim()).filter(Boolean)
  }
}


/* ---------- POST /api/assets/upload ---------- */
export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上傳檔案' })
  }

  const asset = await Asset.create({
    title: req.file.originalname,     // 顯示用標題
    filename: req.file.filename,         // 實際檔名
    path: req.body.folderId
      ? path.join(process.env.UPLOAD_DIR || 'uploads', req.body.folderId, req.file.filename)
      : path.join(process.env.UPLOAD_DIR || 'uploads', req.file.filename),
    url: req.body.folderId
      ? `/static/${req.body.folderId}/${req.file.filename}`
      : `/static/${req.file.filename}`,
    type: req.body.type || 'raw',
    reviewStatus: req.body.type === 'edited' ? 'pending' : undefined,
    uploadedBy: req.user._id,
    folderId: req.body.folderId || null,
    description: req.body.description || '',
    tags: parseTags(req.body.tags),
    allowedUsers: Array.isArray(req.body.allowedUsers)
      ? Array.from(new Set([...req.body.allowedUsers, req.user._id]))
      : [req.user._id]
  })

  if (asset.folderId) {
    await Folder.findByIdAndUpdate(asset.folderId, {
      $addToSet: { allowedUsers: req.user._id }
    })
  }

  res.status(201).json(asset)
}

/* ---------- GET /api/assets ---------- */
export const getAssets = async (req, res) => {
  const deep = req.query.deep === 'true'
  const query = { allowRoles: req.user.roleId?.name }
  let folderId = req.query.folderId ? req.query.folderId : null

  if (deep) {
    const childIds = await getDescendantFolderIds(folderId)
    query.folderId = { $in: [folderId, ...childIds] }
  } else {
    query.folderId = folderId
  }

  if (req.query.type) query.type = req.query.type

  if (req.query.reviewStatus) query.reviewStatus = req.query.reviewStatus

  if (req.query.tags) {
    const tags = Array.isArray(req.query.tags)
      ? req.query.tags
      : req.query.tags.split(',')
    query.tags = { $all: tags }
  }

  const assets = await Asset.find(query)
    .populate('uploadedBy', 'username name')

  const filtered = assets.filter(a =>
    !a.allowedUsers?.length || a.allowedUsers.some(id => id.equals(req.user._id))
  )

  if (req.query.progress === 'true') {
    const total = await ReviewStage.countDocuments()
    const ids = filtered.map(a => a._id)
    const records = await ReviewRecord.aggregate([
      { $match: { assetId: { $in: ids }, completed: true } },
      { $group: { _id: '$assetId', done: { $sum: 1 } } }
    ])
    const map = {}
    records.forEach(r => { map[r._id.toString()] = r.done })
    return res.json(
      filtered.map(a => ({
        ...a.toObject(),
        fileName: a.filename,
        fileType: a.type,
        uploaderName: a.uploadedBy?.name || a.uploadedBy?.username,
        progress: { done: map[a._id.toString()] || 0, total }
      }))
    )
  }

  res.json(
    filtered.map(a => ({
      ...a.toObject(),
      fileName: a.filename,
      fileType: a.type,
      uploaderName: a.uploadedBy?.name || a.uploadedBy?.username
    }))
  )
}

/* ---------- POST /api/assets/:id/comment ---------- */
export const addComment = async (req, res) => {
  const asset = await Asset.findById(req.params.id)
  if (!asset) return res.status(404).json({ message: '找不到素材' })

  asset.comments.push({ userId: req.user._id, message: req.body.message })
  await asset.save()
  res.json(asset)
}

/* ---------- PUT /api/assets/:id ---------- */
/* 允許更新：title、description */
export const updateAsset = async (req, res) => {
  const { title, description, allowRoles, allowedUsers } = req.body

  const asset = await Asset.findById(req.params.id)
  if (!asset) return res.status(404).json({ message: '找不到素材' })

  if (title) asset.title = title
  if (description) asset.description = description
  if (req.body.tags) asset.tags = parseTags(req.body.tags)
  if (Array.isArray(allowRoles)) {
    asset.allowRoles = allowRoles.filter(r => Object.values(ROLES).includes(r))
  }
  if (Array.isArray(allowedUsers)) {
    asset.allowedUsers = allowedUsers
  }
  // filename 不可修改，故不處理

  await asset.save()
  res.json(asset)
}

export const reviewAsset = async (req, res) => {
  const { reviewStatus } = req.body
  if (!['pending', 'approved', 'rejected'].includes(reviewStatus)) {
    return res.status(400).json({ message: '狀態錯誤' })
  }
  const asset = await Asset.findById(req.params.id)
  if (!asset) return res.status(404).json({ message: '找不到素材' })
  asset.reviewStatus = reviewStatus
  await asset.save()
  res.json(asset)
}

export const deleteAsset = async (req, res) => {
  await Asset.findByIdAndDelete(req.params.id)
  res.json({ message: '素材已刪除' })
}

/* ---------- 依 limit 取得最新素材 ---------- */
export const getRecentAssets = async (req, res) => {
  const limit = Number(req.query.limit) || 5
  const query = { allowRoles: req.user.roleId?.name }
  const assets = await Asset.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('uploadedBy', 'username name')

  const filtered = assets.filter(a =>
    !a.allowedUsers?.length || a.allowedUsers.some(id => id.equals(req.user._id))
  )

  res.json(
    filtered.map(a => ({
      ...a.toObject(),
      fileName: a.filename,
      fileType: a.type,
      uploaderName: a.uploadedBy?.name || a.uploadedBy?.username
    }))
  )
}