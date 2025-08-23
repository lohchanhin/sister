import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getSummary, getDaily } from '../controllers/dashboard.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()
router.use(protect)
router.get('/summary', asyncHandler(getSummary))
router.get('/daily', asyncHandler(getDaily))

export default router
