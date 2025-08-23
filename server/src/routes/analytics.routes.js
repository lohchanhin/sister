// 此路由尚未啟用
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { authorize } from '../middleware/roleGuard.js'
import { ROLES } from '../config/roles.js'
import { getSummary } from '../controllers/analytics.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()
// router.get('/', protect, authorize(ROLES.MANAGER), asyncHandler(getSummary))
export default router
