import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import { getProducts } from '../controllers/product.controller.js'

const router = Router()

router.get('/', protect, requirePerm(PERMISSIONS.ASSET_READ), getProducts)

export default router
