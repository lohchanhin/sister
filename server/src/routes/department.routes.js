import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import { getDepartments, getSubDepartments } from '../controllers/department.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.use(protect)
router.use(requirePerm(PERMISSIONS.USER_MANAGE))

router.get('/', asyncHandler(getDepartments))
router.get('/sub-departments', asyncHandler(getSubDepartments))

export default router
