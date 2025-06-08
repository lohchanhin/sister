import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import {
    uploadFile,
    getAssets,
    addComment,
    updateAsset,
    deleteAsset,
    getRecentAssets,
    reviewAsset
} from '../controllers/asset.controller.js'

const router = Router()

router.post('/upload', protect, upload.single('file'), uploadFile)
router.get('/', protect, getAssets)
router.post('/:id/comment', protect, addComment)
router.get('/recent', protect, getRecentAssets)

/* ★ 新增：更新檔名／描述 */
router.put('/:id', protect, updateAsset)
router.put('/:id/review', protect, reviewAsset)
router.delete('/:id', protect, deleteAsset)    // assets
export default router
