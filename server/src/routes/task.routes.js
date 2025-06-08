import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { createTask, getTasks, updateTask } from '../controllers/task.controller.js'
import { PERMISSIONS } from '../config/permissions.js'

const router = Router()

router.get('/', protect, requirePerm(PERMISSIONS.TASK_MANAGE), getTasks)
router.post(
  '/',
  protect,
  requirePerm(PERMISSIONS.TASK_MANAGE),
  createTask
)
router.put(
  '/:id',
  protect,
  requirePerm(PERMISSIONS.TASK_MANAGE),
  updateTask
)

export default router
