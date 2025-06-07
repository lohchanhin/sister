import Asset from '../models/asset.model.js'

/* ---------- POST /api/assets/upload ---------- */
export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: '\u672a\u4e0a\u50b3\u6a94\u6848' })
  const asset = await Asset.create({
    filename: req.file.filename,
    path: req.file.path,
    type: req.body.type || 'raw',
    uploadedBy: req.user._id,
    folderId: req.body.folderId || null
  })
  res.status(201).json(asset)
}

/* ---------- GET /api/assets ---------- */
export const getAssets = async (req, res) => {
  const query = { allowRoles: req.user.role }
  if (req.query.folderId) query.folderId = req.query.folderId
  else query.folderId = null
  const assets = await Asset.find(query)
  res.json(assets)
}

/* ---------- POST /api/assets/:id/comment ---------- */
export const addComment = async (req, res) => {
  const asset = await Asset.findById(req.params.id)
  if (!asset) return res.status(404).json({ message: '\u627e\u4e0d\u5230\u7d20\u6750' })
  asset.comments.push({ userId: req.user._id, message: req.body.message })
  await asset.save()
  res.json(asset)
}

/* ---------- PUT /api/assets/:id ---------- */
export const updateAsset = async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  })
  if (!asset) return res.status(404).json({ message: '素材不存在' })
  res.json(asset)
}

/* ---------- DELETE /api/assets/:id ---------- */
export const deleteAsset = async (req, res) => {
  const asset = await Asset.findByIdAndDelete(req.params.id)
  if (!asset) return res.status(404).json({ message: '素材不存在' })
  res.json({ message: '已刪除' })
}

/* ---------- GET /api/assets/recent ---------- */
export const getRecentAssets = async (req, res) => {
  const limit = parseInt(req.query.limit) || 5
  const query = { allowRoles: req.user.role }
  const assets = await Asset.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
  res.json(assets)
}
