import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  getProducts,
  getProduct,
  batchDownload,
  getBatchDownloadProgress,
  getProductSignedUrl
} from '../controllers/product.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.post('/batch-download', protect, asyncHandler(batchDownload))
router.get('/batch-download/:id', protect, asyncHandler(getBatchDownloadProgress))
router.get('/', protect, requirePerm(PERMISSIONS.ASSET_READ), asyncHandler(getProducts))
router.get('/:id', protect, requirePerm(PERMISSIONS.ASSET_READ), asyncHandler(getProduct))
router.get('/:id/url', protect, requirePerm(PERMISSIONS.ASSET_READ), asyncHandler(getProductSignedUrl))

export default router

