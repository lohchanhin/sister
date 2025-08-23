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
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.use(protect)
router.use(requirePerm(PERMISSIONS.ROLE_MANAGE))

router.route('/')
  .post(asyncHandler(createRole))
  .get(asyncHandler(getRoles))

router.route('/:id')
  .get(asyncHandler(getRole))
  .put(asyncHandler(updateRole))
  .delete(asyncHandler(deleteRole))

export default router
