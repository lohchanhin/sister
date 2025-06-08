import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole
} from '../controllers/role.controller.js'

const router = Router()

router.use(protect)

router.route('/')
  .post(createRole)
  .get(getRoles)

router.route('/:id')
  .get(getRole)
  .put(updateRole)
  .delete(deleteRole)

export default router
