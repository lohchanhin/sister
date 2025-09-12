// platformTransfer.routes.js
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { transferPlatform } from '../controllers/platform.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

// 注意：此路由应挂载在 /platforms
// 例如：app.use('/platforms', platformTransferRoutes)
const router = Router()

router.use(protect)

// /platforms/:id/transfer
router.put('/:id/transfer', asyncHandler(transferPlatform))

export default router
