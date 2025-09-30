import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'
import { listNotifications, markAsRead } from '../controllers/notification.controller.js'

const router = Router()

router.use(protect)

router.get('/', asyncHandler(listNotifications))
router.patch('/read', asyncHandler(markAsRead))

export default router
