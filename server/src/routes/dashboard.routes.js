import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getSummary, getDaily } from '../controllers/dashboard.controller.js'

const router = Router()
router.use(protect)
router.get('/summary', getSummary)
router.get('/daily', getDaily)

export default router
