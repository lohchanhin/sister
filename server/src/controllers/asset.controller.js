/**
 * Asset Controller  (完整)
 */
import Asset from '../models/asset.model.js'

const managerOnly = (req, res) => {
  if (req.user.roleId?.name !== 'manager') {
    res.status(403).json({ message: '僅限 Manager 操作' })
    return true
  }
  return false
}

/* ---------- POST /api/assets/upload ---------- */
export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上傳檔案' })
  }

  const asset = await Asset.create({
    title: req.file.originalname,     // 顯示用標題
    filename: req.file.filename,         // 實際檔名
    path: req.file.path,
    url: `/static/${req.file.filename}`,
    type: req.body.type || 'raw',
    reviewStatus: req.body.type === 'edited' ? 'pending' : undefined,
    uploadedBy: req.user._id,
    folderId: req.body.folderId || null,
    description: req.body.description || ''
  })

  res.status(201).json(asset)
}

/* ---------- GET /api/assets ---------- */
export const getAssets = async (req, res) => {
  const query = { allowRoles: req.user.roleId?.name }
  query.folderId = req.query.folderId ? req.query.folderId : null
  if (req.query.type) query.type = req.query.type

  if (req.query.reviewStatus) query.reviewStatus = req.query.reviewStatus


  const assets = await Asset.find(query)
  res.json(assets)
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
  const { title, description } = req.body

  const asset = await Asset.findById(req.params.id)
  if (!asset) return res.status(404).json({ message: '找不到素材' })

  if (title) asset.title = title
  if (description) asset.description = description
  // filename 不可修改，故不處理

  await asset.save()
  res.json(asset)
}

export const reviewAsset = async (req, res) => {
  if (managerOnly(req, res)) return
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
  res.json(assets)
}