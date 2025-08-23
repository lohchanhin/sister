import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import { getProducts, getProduct, batchDownload, getBatchDownloadProgress } from '../controllers/product.controller.js'

const router = Router()

router.post('/batch-download', protect, batchDownload)
router.get('/batch-download/:id', protect, getBatchDownloadProgress)
router.get('/', protect, requirePerm(PERMISSIONS.ASSET_READ), getProducts)
router.get('/:id', protect, requirePerm(PERMISSIONS.ASSET_READ), getProduct)

export default router
