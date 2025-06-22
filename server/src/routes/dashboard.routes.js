import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getSummary } from '../controllers/dashboard.controller.js'

const router = Router()
router.use(protect)
router.get('/summary', getSummary)

export default router
