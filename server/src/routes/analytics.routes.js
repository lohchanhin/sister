// 此路由尚未啟用
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { authorize } from '../middleware/roleGuard.js'
import { ROLES } from '../config/roles.js'
import { getSummary } from '../controllers/analytics.controller.js'

const router = Router()
// router.get('/', protect, authorize(ROLES.MANAGER), getSummary)
export default router
