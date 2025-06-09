import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import { createStage, getStages, updateStage, deleteStage } from '../controllers/reviewStage.controller.js'

const router = Router()

router.use(protect)

router.get('/', requirePerm(PERMISSIONS.REVIEW_MANAGE), getStages)
router.post('/', requirePerm(PERMISSIONS.REVIEW_MANAGE), createStage)
router.put('/:id', requirePerm(PERMISSIONS.REVIEW_MANAGE), updateStage)
router.delete('/:id', requirePerm(PERMISSIONS.REVIEW_MANAGE), deleteStage)

export default router
