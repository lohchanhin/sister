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
    reviewAsset
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
router.get('/', protect, requirePerm(PERMISSIONS.ASSET_READ), getAssets)
router.post(
  '/:id/comment',
  protect,
  requirePerm(PERMISSIONS.ASSET_UPDATE),
  addComment
)
router.get('/recent', protect, requirePerm(PERMISSIONS.ASSET_READ), getRecentAssets)

/* ★ 新增：更新檔名／描述 */

router.put('/:id', protect, updateAsset)
router.put('/:id/review', protect, reviewAsset)
router.get('/:id/stages', protect, getAssetStages)
router.put('/:id/stages/:stageId', protect, updateStageStatus)
router.delete('/:id', protect, deleteAsset)    // assets


export default router
