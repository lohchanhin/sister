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
    getAssetSignedUrl,
    presign,
    createAsset,
    batchDownload,
    deleteAssets
} from '../controllers/asset.controller.js'
import {
  getAssetStages,
  updateStageStatus
} from '../controllers/reviewRecord.controller.js'

const router = Router()

router.post(
  '/upload',
  protect,
  requirePerm(PERMISSIONS.ASSET_CREATE),
  upload.single('file'),
  uploadFile
)
router.post(
  '/presign',
  protect,
  requirePerm(PERMISSIONS.ASSET_CREATE),
  presign
)
router.post('/', protect, requirePerm(PERMISSIONS.ASSET_CREATE), createAsset)
router.post('/batch-download', protect, batchDownload)
router.get('/', protect, requirePerm(PERMISSIONS.ASSET_READ), getAssets)
router.post(
  '/:id/comment',
  protect,
  requirePerm(PERMISSIONS.ASSET_UPDATE),
  addComment
)
router.get('/recent', protect, requirePerm(PERMISSIONS.ASSET_READ), getRecentAssets)
router.get('/:id/url', protect, requirePerm(PERMISSIONS.ASSET_READ), getAssetSignedUrl)

/* ★ 新增：更新檔名／描述 */

router.put(
  '/viewers',
  protect,
  requirePerm(PERMISSIONS.ASSET_UPDATE),
  updateAssetsViewers
)
router.put(
  '/:id',
  protect,
  requirePerm(PERMISSIONS.ASSET_UPDATE),
  updateAsset
)
router.put(
  '/:id/review',
  protect,
  requirePerm(PERMISSIONS.REVIEW_MANAGE),
  reviewAsset
)
router.get('/:id/stages', protect, getAssetStages)
router.put('/:id/stages/:stageId', protect, updateStageStatus)
router.delete('/', protect, deleteAssets)
router.delete('/:id', protect, deleteAsset)    // assets


export default router
