import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    reviewProduct,
    getProductStages,
    updateProductStageStatus,
    updateProductsViewers,
    getProductSignedUrl,
    batchDownloadProducts,
    deleteProducts
} from '../controllers/product.controller.js'

const router = Router()

router.use(protect)

router.get('/', requirePerm(PERMISSIONS.ASSET_READ), getProducts)
router.get('/:id', requirePerm(PERMISSIONS.ASSET_READ), getProduct)
router.get('/:id/url', requirePerm(PERMISSIONS.ASSET_READ), getProductSignedUrl)
router.get('/:id/stages', requirePerm(PERMISSIONS.ASSET_READ), getProductStages)

router.post('/batch-download', requirePerm(PERMISSIONS.ASSET_READ), batchDownloadProducts)

router.put('/viewers', requirePerm(PERMISSIONS.ASSET_UPDATE), updateProductsViewers)
router.put('/:id', requirePerm(PERMISSIONS.ASSET_UPDATE), updateProduct)
router.put('/:id/review', requirePerm(PERMISSIONS.REVIEW_MANAGE), reviewProduct)
router.put('/:id/stages/:stageId', requirePerm(PERMISSIONS.ASSET_UPDATE), updateProductStageStatus)

router.delete('/', requirePerm(PERMISSIONS.ASSET_DELETE), deleteProducts)
router.delete('/:id', requirePerm(PERMISSIONS.ASSET_DELETE), deleteProduct)

export default router