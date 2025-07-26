/**
 * Asset Controller  (完整)
 */
import Asset from '../models/asset.model.js'
import Folder from '../models/folder.model.js'
import ReviewStage from '../models/reviewStage.model.js'
import ReviewRecord from '../models/reviewRecord.model.js'
import path from 'node:path'
import { decodeFilename } from '../utils/decodeFilename.js'
import bucket, { uploadFile as gcsUploadFile, getSignedUrl } from '../utils/gcs.js'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import archiver from 'archiver'
import { getDescendantFolderIds, getAncestorFolderIds, getRootFolder } from '../utils/folderTree.js'
import { includeManagers } from '../utils/includeManagers.js'
import { getCache, setCache, clearCacheByPrefix, delCache } from '../utils/cache.js'
import { clearDashboardCache } from './dashboard.controller.js'

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

  // 產生唯一檔名
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const originalName = decodeFilename(req.file.originalname)
  const ext = path.extname(originalName)
  const filename = unique + ext

  // 將暫存檔案串流上傳至 GCS
  const gcsPath = await gcsUploadFile(req.file.path, filename, req.file.mimetype)
  await fs.unlink(req.file.path)

  // ➤ 檔案權限與 folder 設定
  let baseUsers = []
  if (req.body.folderId) {
    const root = await getRootFolder(req.body.folderId)
    baseUsers = root?.allowedUsers || []
  } else {
    baseUsers = Array.isArray(req.body.allowedUsers)
      ? Array.from(new Set([...req.body.allowedUsers, req.user._id]))
      : [req.user._id]
  }

  // ➤ 建立 Asset 資料
  const asset = await Asset.create({
    title: originalName,
    filename,
    path: gcsPath,
    type: req.body.type || 'raw',
    reviewStatus: req.body.type === 'edited' ? 'pending' : undefined,
    uploadedBy: req.user._id,
    folderId: req.body.folderId || null,
    description: req.body.description || '',
    tags: parseTags(req.body.tags),
    allowedUsers: await includeManagers(baseUsers)
  })

  // ➤ 更新對應資料夾
  if (asset.folderId) {
    await Folder.findByIdAndUpdate(asset.folderId, {
      $addToSet: { allowedUsers: req.user._id },
      $set: { updatedAt: new Date() }
    })
    const parents = await getAncestorFolderIds(asset.folderId)
  if (parents.length) {
      await Folder.updateMany({ _id: { $in: parents } }, { $set: { updatedAt: new Date() } })
    }
  }

  await clearCacheByPrefix('assets:')
  await clearDashboardCache()
  res.status(201).json(asset)
}


/* ---------- GET /api/assets ---------- */
export const getAssets = async (req, res) => {
  const cacheKey = `assets:${req.user._id}:${JSON.stringify(req.query)}`
  const cached = await getCache(cacheKey)
  if (cached) {
    return res.json(cached)
  }
  const deep = req.query.deep === 'true'
  const query = {}
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
    const data = filtered.map(a => ({
      ...a.toObject(),
      fileName: a.filename,
      fileType: a.type,
      uploaderName: a.uploadedBy?.name || a.uploadedBy?.username,
      progress: { done: map[a._id.toString()] || 0, total }
    }))
    await setCache(cacheKey, data)
    return res.json(data)
  }

  const data = filtered.map(a => ({
    ...a.toObject(),
    fileName: a.filename,
    fileType: a.type,
    uploaderName: a.uploadedBy?.name || a.uploadedBy?.username
  }))
  await setCache(cacheKey, data)
  res.json(data)
}

/* ---------- POST /api/assets/:id/comment ---------- */
export const addComment = async (req, res) => {
  const asset = await Asset.findById(req.params.id)
  if (!asset) return res.status(404).json({ message: '找不到素材' })

  asset.comments.push({ userId: req.user._id, message: req.body.message })
  await asset.save()
  if (asset.folderId) {
    await Folder.updateOne({ _id: asset.folderId }, { $set: { updatedAt: new Date() } })
    const parents = await getAncestorFolderIds(asset.folderId)
  if (parents.length) {
      await Folder.updateMany({ _id: { $in: parents } }, { $set: { updatedAt: new Date() } })
    }
  }
  await clearCacheByPrefix('assets:')
  res.json(asset)
}

/* ---------- PUT /api/assets/:id ---------- */
/* 允許更新：title、description */
export const updateAsset = async (req, res) => {
  const {
    title,
    description,
    allowedUsers,
    editor,
    editCompletedAt,
    xhsStatus,
    scheduledPublishAt,
    finalChecked,
    fbSynced,
    fbResponsible
  } = req.body

  const asset = await Asset.findById(req.params.id)
  if (!asset) return res.status(404).json({ message: '找不到素材' })

  if (title) asset.title = title
  if (description) asset.description = description
  if (req.body.tags) asset.tags = parseTags(req.body.tags)
  if (Array.isArray(allowedUsers)) {
    asset.allowedUsers = await includeManagers(allowedUsers)
  }
  if (editor !== undefined) asset.editor = editor
  if (editCompletedAt !== undefined) asset.editCompletedAt = editCompletedAt ? new Date(editCompletedAt) : null
  if (xhsStatus !== undefined) asset.xhsStatus = xhsStatus
  if (scheduledPublishAt !== undefined) asset.scheduledPublishAt = scheduledPublishAt ? new Date(scheduledPublishAt) : null
  if (finalChecked !== undefined) asset.finalChecked = finalChecked
  if (fbSynced !== undefined) asset.fbSynced = fbSynced
  if (fbResponsible !== undefined) asset.fbResponsible = fbResponsible
  // filename 不可修改，故不處理

  await asset.save()
  if (asset.folderId) {
    await Folder.updateOne({ _id: asset.folderId }, { $set: { updatedAt: new Date() } })
    const parents = await getAncestorFolderIds(asset.folderId)
    if (parents.length) {
      await Folder.updateMany({ _id: { $in: parents } }, { $set: { updatedAt: new Date() } })
    }
  }
  await clearCacheByPrefix('assets:')
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
  await clearCacheByPrefix('assets:')
  await clearDashboardCache()
  res.json(asset)
}

export const deleteAsset = async (req, res) => {
  const asset = await Asset.findByIdAndDelete(req.params.id)
  if (asset?.folderId) {
    await Folder.updateOne({ _id: asset.folderId }, { $set: { updatedAt: new Date() } })
    const parents = await getAncestorFolderIds(asset.folderId)
  if (parents.length) {
      await Folder.updateMany({ _id: { $in: parents } }, { $set: { updatedAt: new Date() } })
    }
  }
  await clearCacheByPrefix('assets:')
  await clearDashboardCache()
  res.json({ message: '素材已刪除' })
}

/* ---------- 依 limit 取得最新素材 ---------- */
export const getRecentAssets = async (req, res) => {
  const limit = Number(req.query.limit) || 5
  const query = {}
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

export const getAssetSignedUrl = async (req, res) => {
  const asset = await Asset.findById(req.params.id)
  if (!asset) return res.status(404).json({ message: '找不到素材' })

  const options = {}
  if (req.query.download === '1') {
    const name = encodeURIComponent(asset.title || asset.filename)
    options.responseDisposition = `attachment; filename="${name}"`
  }

  const url = await getSignedUrl(asset.path, options)
  res.json({ url })
}

/* ---------- PUT /api/assets/viewers ---------- */
export const updateAssetsViewers = async (req, res) => {
  const { ids, allowedUsers } = req.body
  if (!Array.isArray(ids) || !Array.isArray(allowedUsers)) {
    return res.status(400).json({ message: '參數錯誤' })
  }

  const users = await includeManagers(allowedUsers)
  const assets = await Asset.find({ _id: { $in: ids } })
  for (const asset of assets) {
    if (!asset.folderId) {
      asset.allowedUsers = users
    } else {
      const root = await getRootFolder(asset.folderId)
      asset.allowedUsers = root?.allowedUsers || []
    }
    await asset.save()
  }
  await clearCacheByPrefix('assets:')
  await clearDashboardCache()
  res.json({ message: '已更新' })
}

/* ---------- POST /api/assets ---------- */
export const createAsset = async (req, res) => {
  const { filename, path: filePath } = req.body
  if (!filename || !filePath) {
    return res.status(400).json({ message: '缺少檔名或路徑' })
  }

  let baseUsers = []
  if (req.body.folderId) {
    const root = await getRootFolder(req.body.folderId)
    baseUsers = root?.allowedUsers || []
  } else {
    baseUsers = Array.isArray(req.body.allowedUsers)
      ? Array.from(new Set([...req.body.allowedUsers, req.user._id]))
      : [req.user._id]
  }

  const asset = await Asset.create({
    title: filename,
    filename,
    path: filePath,
    type: req.body.type || 'raw',
    reviewStatus: req.body.type === 'edited' ? 'pending' : undefined,
    uploadedBy: req.user._id,
    folderId: req.body.folderId || null,
    description: req.body.description || '',
    tags: parseTags(req.body.tags),
    allowedUsers: await includeManagers(baseUsers)
  })

  if (asset.folderId) {
    await Folder.findByIdAndUpdate(asset.folderId, {
      $addToSet: { allowedUsers: req.user._id },
      $set: { updatedAt: new Date() }
    })
    const parents = await getAncestorFolderIds(asset.folderId)
  if (parents.length) {
      await Folder.updateMany({ _id: { $in: parents } }, { $set: { updatedAt: new Date() } })
    }
  }

  await clearCacheByPrefix('assets:')
  await clearDashboardCache()
  res.status(201).json(asset)
}

/* ---------- POST /api/assets/presign ---------- */
export const presign = async (req, res) => {
  const { filename, contentType } = req.body
  if (!filename) {
    return res.status(400).json({ message: '缺少檔名' })
  }

  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const ext = path.extname(filename)
  const gcsFilename = unique + ext

  const file = bucket.file(gcsFilename)

  const [sessionUri] = await file.createResumableUpload({
    origin: req.headers.origin,
    metadata: { contentType }
  })

  res.json({ sessionUri, path: gcsFilename })
}

export const batchDownload = async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ message: '參數錯誤' })
  }

  const progressId = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const cacheKey = `zip_progress:${progressId}`
  await setCache(cacheKey, { percent: 0, url: null, error: null }, 600) // 10 min expiry
  res.json({ progressId })

  ;(async () => {
    let tmpDir = ''
    try {
      const assets = await Asset.find({ _id: { $in: ids } })
      if (!assets.length) {
        await setCache(cacheKey, { percent: 100, url: null, error: '找不到素材' }, 600)
        return
      }

      tmpDir = await fs.mkdtemp('/tmp/asset-batch-')
      const zipName = `assets-${Date.now()}.zip`
      const zipPath = path.join(tmpDir, zipName)

      await new Promise(async (resolve, reject) => {
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);
        
        archive.pipe(output);

        let processed = 0;
        const total = assets.length;

        for (const asset of assets) {
          const localPath = path.join(tmpDir, asset.filename);
          try {
            await bucket.file(asset.path).download({ destination: localPath });
            archive.file(localPath, { name: asset.title || asset.filename });
            
            processed++;
            const percent = Math.round((processed / total) * 100);
            await setCache(cacheKey, { percent, url: null, error: null }, 600);

          } catch (err) {
            console.error(`Failed to download or archive ${asset.path}:`, err);
            const currentProgress = await getCache(cacheKey) || {};
            const newError = (currentProgress.error || '') + `無法處理 ${asset.title || asset.filename}. `;
            await setCache(cacheKey, { ...currentProgress, error: newError }, 600);
          }
        }

        archive.finalize();
      });

      const gcsPath = await gcsUploadFile(zipPath, zipName, 'application/zip')
      const url = await getSignedUrl(gcsPath, {
        responseDisposition: `attachment; filename="${zipName}"`
      })
      
      const finalProgress = await getCache(cacheKey) || {}
      await setCache(cacheKey, { ...finalProgress, percent: 100, url }, 600)

    } catch (e) {
      console.error('zip error', e)
      await setCache(cacheKey, { percent: 100, url: null, error: e.message }, 600)
    } finally {
      if (tmpDir) {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(err => console.error(`Failed to remove temp dir ${tmpDir}:`, err))
      }
    }
  })()
}

export const getBatchDownloadProgress = async (req, res) => {
  const cacheKey = `zip_progress:${req.params.id}`
  const data = await getCache(cacheKey)
  if (!data) return res.status(404).json({ message: 'not found' })
  if (data.url || data.error) {
    await delCache(cacheKey)
  }
  res.json(data)
}

export const deleteAssets = async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ message: '參數錯誤' })
  }

  const assets = await Asset.find({ _id: { $in: ids } })
  await Asset.deleteMany({ _id: { $in: ids } })

  const folderIds = [...new Set(assets.map(a => a.folderId).filter(Boolean).map(id => id.toString()))]
  for (const id of folderIds) {
    await Folder.updateOne({ _id: id }, { $set: { updatedAt: new Date() } })
    const parents = await getAncestorFolderIds(id)
    if (parents.length) {
      await Folder.updateMany({ _id: { $in: parents } }, { $set: { updatedAt: new Date() } })
    }
  }

  await clearCacheByPrefix('assets:')
  await clearDashboardCache()
  res.json({ message: '已刪除' })
}