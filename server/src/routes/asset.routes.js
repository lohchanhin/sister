import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { uploadFile, getAssets, addComment } from '../controllers/asset.controller.js'

const router = Router()
router.post('/upload', protect, upload.single('file'), uploadFile)
router.get('/', protect, getAssets)
router.post('/:id/comment', protect, addComment)
export default router
