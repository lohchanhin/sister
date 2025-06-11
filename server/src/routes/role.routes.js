import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole
} from '../controllers/role.controller.js'

const router = Router()

router.use(protect)
router.use(requirePerm(PERMISSIONS.ROLE_MANAGE))

router.route('/')
  .post(createRole)
  .get(getRoles)

router.route('/:id')
  .get(getRole)
  .put(updateRole)
  .delete(deleteRole)

export default router
