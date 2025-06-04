import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getProfile } from '../controllers/user.controller.js'

const router = Router()
router.get('/profile', protect, getProfile)
export default router
