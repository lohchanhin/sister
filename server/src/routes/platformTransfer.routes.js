import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { transferPlatform } from '../controllers/platform.controller.js'

const router = Router()

router.use(protect)
router.put('/:id/transfer', transferPlatform)

export default router
