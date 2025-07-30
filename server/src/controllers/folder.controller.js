import Folder from '../models/folder.model.js'
import Asset from '../models/asset.model.js'
import ReviewStage from '../models/reviewStage.model.js'
import FolderReviewRecord from '../models/folderReviewRecord.model.js'
import { getDescendantFolderIds, getRootFolder, getAncestorFolderIds } from '../utils/folderTree.js'
import { includeManagers } from '../utils/includeManagers.js'
import { getCache, setCache, clearCacheByPrefix, delCache } from '../utils/cache.js'
import path from 'node:path'
import bucket, { uploadFile as gcsUploadFile, getSignedUrl } from '../utils/gcs.js'
import fs from 'node:fs/promises'
import archiver from 'archiver'
import { createWriteStream } from 'node:fs'

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
  let baseUsers = []
  if (req.body.parentId) {
    const exists = await Folder.findById(req.body.parentId)
    if (!exists) {
      return res.status(400).json({ message: '父層資料夾不存在' })
    }
    const root = await getRootFolder(req.body.parentId)
    baseUsers = root?.allowedUsers || []
  } else {
    baseUsers = Array.isArray(req.body.allowedUsers)
      ? Array.from(new Set([...req.body.allowedUsers, req.user._id]))
      : [req.user._id]
  }
  const folder = await Folder.create({
    name: req.body.name,
    parentId: req.body.parentId || null,
    description: req.body.description,
    script: req.body.script,
    type: req.body.type || 'raw',
    createdBy: req.user._id,
    tags: parseTags(req.body.tags),
    allowedUsers: await includeManagers(baseUsers)
  })
  await clearCacheByPrefix('folders:')
  await clearCacheByPrefix('folderTree:')
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
  const folders = await Folder.find(query).populate('createdBy', 'username name')
  let result = folders
  if (req.user.roleId?.name !== 'manager') {
    result = folders.filter(f =>
      !f.allowedUsers?.length || f.allowedUsers.some(id => id.equals(req.user._id))
    )
  }

  if (req.query.progress === 'true') {
    const total = await ReviewStage.countDocuments()
    const ids = result.map(f => f._id)
    const records = await FolderReviewRecord.aggregate([
      { $match: { folderId: { $in: ids }, completed: true } },
      { $group: { _id: '$folderId', done: { $sum: 1 } } }
    ])
    const map = {}
    records.forEach(r => {
      map[r._id.toString()] = r.done
    })
    const data = result.map(f => ({
      ...f.toObject(),
      progress: { done: map[f._id.toString()] || 0, total },
      creatorName: f.createdBy?.name || f.createdBy?.username
    }))
    await setCache(cacheKey, data)
    return res.json(data)
  }

  const data = result.map(f => ({
    ...f.toObject(),
    creatorName: f.createdBy?.name || f.createdBy?.username
  }))
  await setCache(cacheKey, data)
  res.json(data)
}

export const getFolder = async (req, res) => {
  let folder = await Folder.findById(req.params.id).populate('createdBy', 'username name')
  if (!folder) return res.status(404).json({ message: '找不到資料夾' })

  // Recursively populate parent folders
  let current = folder;
  const parentChain = [];
  while (current && current.parentId) {
    current = await Folder.findById(current.parentId);
    if (current) {
      parentChain.push(current);
    }
  }
  
  // Reconstruct the folder object with the parent chain for breadcrumbs
  let result = folder.toObject();
  if (parentChain.length > 0) {
    let nested = result;
    for (let i = 0; i < parentChain.length; i++) {
      nested.parent = parentChain[i].toObject();
      nested = nested.parent;
    }
  }

  res.json({
    ...result,
    creatorName: folder.createdBy?.name || folder.createdBy?.username
  })
}

export const reviewFolder = async (req, res) => {
  const { reviewStatus } = req.body
  if (!['pending', 'approved', 'rejected'].includes(reviewStatus)) {
    return res.status(400).json({ message: '狀態錯誤' })
  }
  const folder = await Folder.findById(req.params.id)
  if (!folder) return res.status(404).json({ message: '資料夾不存在' })
  folder.reviewStatus = reviewStatus

  const total = await ReviewStage.countDocuments()
  if (total) {
    const done = await FolderReviewRecord.countDocuments({ folderId: folder._id, completed: true })
    if (done === total) {
      folder.reviewStatus = 'approved'
    }
  }
  await folder.save()
  await clearCacheByPrefix('folders:')
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
  if (!folder.parentId && req.body.allowedUsers) {
    const descendants = await getDescendantFolderIds(folder._id)
    if (descendants.length) {
      await Folder.updateMany(
        { _id: { $in: descendants } },
        { allowedUsers: folder.allowedUsers }
      )
    }
    await Asset.updateMany(
      { folderId: { $in: [folder._id, ...descendants] } },
      { allowedUsers: folder.allowedUsers }
    )
  }
  await clearCacheByPrefix('folders:')
  await clearCacheByPrefix('assets:')
  await clearCacheByPrefix('folderTree:')
  res.json(folder)
}

export const deleteFolder = async (req, res) => {
  const folderIds = await getDescendantFolderIds(req.params.id)
  folderIds.push(req.params.id)

  await Asset.deleteMany({ folderId: { $in: folderIds } })
  await Folder.deleteMany({ _id: { $in: folderIds } })

  await clearCacheByPrefix('folders:')
  await clearCacheByPrefix('assets:')
  await clearCacheByPrefix('folderTree:')
  res.json({ message: '資料夾已刪除' })
}

export const moveFolders = async (req, res) => {
  const { ids, parentId } = req.body
  if (!Array.isArray(ids)) {
    return res.status(400).json({ message: '參數錯誤' })
  }
  if (parentId) {
    const exists = await Folder.findById(parentId)
    if (!exists) return res.status(404).json({ message: '目標資料夾不存在' })
  }

  await Folder.updateMany(
    { _id: { $in: ids } },
    { parentId: parentId || null, updatedAt: new Date() }
  )

  if (parentId) {
    const parents = await getAncestorFolderIds(parentId)
    if (parents.length) {
      await Folder.updateMany({ _id: { $in: parents } }, { $set: { updatedAt: new Date() } })
    }
  }

  await clearCacheByPrefix('folders:')
  await clearCacheByPrefix('folderTree:')
  res.json({ message: '已移動' })
}

export const updateFoldersViewers = async (req, res) => {
  const { ids, allowedUsers } = req.body
  if (!Array.isArray(ids) || !Array.isArray(allowedUsers)) {
    return res.status(400).json({ message: '參數錯誤' })
  }
  const users = await includeManagers(allowedUsers)
  await Folder.updateMany({ _id: { $in: ids } }, { allowedUsers: users })
  for (const id of ids) {
    const folder = await Folder.findById(id)
    if (folder && !folder.parentId) {
      const descendants = await getDescendantFolderIds(folder._id)
      if (descendants.length) {
        await Folder.updateMany(
          { _id: { $in: descendants } },
          { allowedUsers: users }
        )
      }
      await Asset.updateMany(
        { folderId: { $in: [folder._id, ...descendants] } },
        { allowedUsers: users }
      )
    }
  }
  await clearCacheByPrefix('folders:')
  await clearCacheByPrefix('folderTree:')
  res.json({ message: '已更新' })
}

export const downloadFolder = async (req, res) => {
  const folderId = req.params.id
  const deep = req.query.deep === 'true'

  const progressId = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const cacheKey = `zip_progress:${progressId}`
  await setCache(cacheKey, { percent: 0, url: null, error: null }, 600)
  res.json({ progressId })

  ;(async () => {
    let tmpDir = ''
    try {
      let ids = [folderId]
      if (deep) {
        const childIds = await getDescendantFolderIds(folderId)
        ids = ids.concat(childIds)
      }

      const assets = await Asset.find({ folderId: { $in: ids } })
      const filtered = assets.filter(a =>
        !a.allowedUsers?.length || a.allowedUsers.some(id => id.equals(req.user._id))
      )

      if (!filtered.length) {
        await setCache(cacheKey, { percent: 100, url: null, error: '找不到可下載的素材' }, 600)
        return
      }

      tmpDir = await fs.mkdtemp('/tmp/folder-dl-')
      const zipName = `folder-${Date.now()}.zip`
      const zipPath = path.join(tmpDir, zipName)
      
      await new Promise(async (resolve, reject) => {
        const output = createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', resolve)
        archive.on('error', reject)
        
        archive.pipe(output)

        let processed = 0
        const total = filtered.length

        for (const asset of filtered) {
          const localPath = path.join(tmpDir, asset.filename)
          try {
            await bucket.file(asset.path).download({ destination: localPath });
            archive.file(localPath, { name: asset.title || asset.filename });
            
            processed++
            const percent = Math.round((processed / total) * 100)
            await setCache(cacheKey, { percent, url: null, error: null }, 600)

          } catch (err) {
            console.error(`Failed to download or archive ${asset.path}:`, err)
            const currentProgress = await getCache(cacheKey) || {}
            const newError = (currentProgress.error || '') + `無法處理 ${asset.title || asset.filename}. `
            await setCache(cacheKey, { ...currentProgress, error: newError }, 600)
          }
        }

        archive.finalize()
      })

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

export const getDownloadProgress = async (req, res) => {
  const cacheKey = `zip_progress:${req.params.id}`
  const data = await getCache(cacheKey)
  if (!data) return res.status(404).json({ message: 'not found' })
  if (data.url || data.error) {
    await delCache(cacheKey)
  }
  res.json(data)
}
