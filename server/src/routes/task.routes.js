import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permissionGuard.js'
import { createTask, getTasks, updateTask } from '../controllers/task.controller.js'

const router = Router()

router.get('/', protect, getTasks)
router.post('/', protect, requirePerm('task:create'), createTask)
router.put('/:id', protect, requirePerm('task:update'), updateTask)

export default router
