import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { authorize } from '../middleware/roleGuard.js'
import { createTask, getTasks, updateTask } from '../controllers/task.controller.js'
import { ROLES } from '../config/roles.js'

const router = Router()

router.get('/', protect, getTasks)
router.post('/', protect, authorize(ROLES.MANAGER, ROLES.EMPLOYEE), createTask)
router.put('/:id', protect, authorize(ROLES.MANAGER, ROLES.EMPLOYEE), updateTask)

export default router
