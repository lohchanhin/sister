import Asset from '../models/asset.model.js'
import AssetDeletionLog from '../models/assetDeletionLog.model.js'
import Folder from '../models/folder.model.js'
import { getAncestorFolderIds } from '../utils/folderTree.js'
import { clearCacheByPrefix } from '../utils/cache.js'
import { clearDashboardCache } from '../controllers/dashboard.controller.js'
import logger from '../config/logger.js'

const MANUAL_SINGLE = 'manual-single'
const MANUAL_BULK = 'manual-bulk'
const SCHEDULED = 'scheduled'

const touchFolderHierarchy = async (folderId) => {
  if (!folderId) return
  await Folder.updateOne({ _id: folderId }, { $set: { updatedAt: new Date() } })
  const parents = await getAncestorFolderIds(folderId)
  if (parents.length) {
    await Folder.updateMany({ _id: { $in: parents } }, { $set: { updatedAt: new Date() } })
  }
}

const persistDeletionLogs = async (assets, method, deletedBy = null) => {
  if (!assets.length) return
  const now = new Date()
  const docs = assets.map(asset => ({
    assetId: asset._id,
    originalFilename: asset.filename,
    method,
    deletedBy,
    deletedAt: now
  }))
  await AssetDeletionLog.insertMany(docs, { ordered: false })
}

const deleteAssetDocuments = async (assets, { method, deletedBy } = {}) => {
  if (!assets.length) return { deletedCount: 0, deletedIds: [] }

  const deletedIds = []
  for (const asset of assets) {
    await Asset.deleteOne({ _id: asset._id })
    await touchFolderHierarchy(asset.folderId)
    deletedIds.push(asset._id.toString())
  }

  await persistDeletionLogs(assets, method, deletedBy)
  await clearCacheByPrefix('assets:')
  await clearDashboardCache()
  logger.info(`Asset deletion completed by ${method}: ${deletedIds.length} item(s) removed.`)
  return { deletedCount: deletedIds.length, deletedIds }
}

export const deleteAssetsByIds = async (ids, { method = MANUAL_SINGLE, deletedBy = null } = {}) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { deletedCount: 0, deletedIds: [] }
  }
  const assets = await Asset.find({ _id: { $in: ids } })
  if (!assets.length) {
    return { deletedCount: 0, deletedIds: [] }
  }
  return deleteAssetDocuments(assets, { method, deletedBy })
}

export const deleteExpiredAssets = async ({ days = 90, method = SCHEDULED } = {}) => {
  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const assets = await Asset.find({ createdAt: { $lt: threshold } })
  if (!assets.length) {
    logger.info('Asset cleanup job executed: no expired assets found.')
    return { deletedCount: 0, deletedIds: [] }
  }
  const result = await deleteAssetDocuments(assets, { method, deletedBy: null })
  logger.info(`Asset cleanup job removed ${result.deletedCount} asset(s) older than ${days} days.`)
  return result
}

export const DeletionMethod = {
  MANUAL_SINGLE,
  MANUAL_BULK,
  SCHEDULED
}

export default {
  deleteAssetsByIds,
  deleteExpiredAssets,
  DeletionMethod
}
