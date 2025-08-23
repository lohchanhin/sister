import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { transferPlatform } from '../controllers/platform.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.use(protect)
router.put('/:id/transfer', asyncHandler(transferPlatform))

export default router
