import express from 'express'
import asyncHandler from 'express-async-handler'
import { protect } from '../middleware/auth.js'
import { getNotifications, readNotification } from '../controllers/notification.controller.js'

const router = express.Router()

router.use(protect)

router.route('/').get(asyncHandler(getNotifications))
router.route('/:id/read').patch(asyncHandler(readNotification))

export default router
