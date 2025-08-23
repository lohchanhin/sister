import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
    uploadFile,
    getAssets,
    addComment,
  updateAsset,
  deleteAsset,
  getRecentAssets,
  reviewAsset,
  updateAssetsViewers,
  moveAssets,
  getAssetSignedUrl,
  presign,
  createAsset,
    batchDownload,
    getBatchDownloadProgress,
    deleteAssets
} from '../controllers/asset.controller.js'
import {
  getAssetStages,
  updateStageStatus
} from '../controllers/reviewRecord.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.post(
  '/upload',
  protect,
  requirePerm(PERMISSIONS.ASSET_CREATE),
  upload.single('file'),
  asyncHandler(uploadFile)
)
router.post(
  '/presign',
  protect,
  requirePerm(PERMISSIONS.ASSET_CREATE),
  asyncHandler(presign)
)
router.post('/', protect, requirePerm(PERMISSIONS.ASSET_CREATE), asyncHandler(createAsset))
router.post('/batch-download', protect, asyncHandler(batchDownload))
router.get('/batch-download/:id', protect, asyncHandler(getBatchDownloadProgress))
router.get('/', protect, requirePerm(PERMISSIONS.ASSET_READ), asyncHandler(getAssets))
router.post(
  '/:id/comment',
  protect,
  requirePerm(PERMISSIONS.ASSET_UPDATE),
  asyncHandler(addComment)
)
router.get('/recent', protect, requirePerm(PERMISSIONS.ASSET_READ), asyncHandler(getRecentAssets))
router.get('/:id/url', protect, requirePerm(PERMISSIONS.ASSET_READ), asyncHandler(getAssetSignedUrl))

/* ★ 新增：更新檔名／描述 */

router.put(
  '/viewers',
  protect,
  requirePerm(PERMISSIONS.ASSET_UPDATE),
  asyncHandler(updateAssetsViewers)
)
router.put(
  '/move',
  protect,
  requirePerm(PERMISSIONS.ASSET_UPDATE),
  asyncHandler(moveAssets)
)
router.put(
  '/:id',
  protect,
  requirePerm(PERMISSIONS.ASSET_UPDATE),
  asyncHandler(updateAsset)
)
router.put(
  '/:id/review',
  protect,
  requirePerm(PERMISSIONS.REVIEW_MANAGE),
  asyncHandler(reviewAsset)
)
router.get('/:id/stages', protect, asyncHandler(getAssetStages))
router.put('/:id/stages/:stageId', protect, asyncHandler(updateStageStatus))
router.delete('/', protect, asyncHandler(deleteAssets))
router.delete('/:id', protect, asyncHandler(deleteAsset))    // assets


export default router
