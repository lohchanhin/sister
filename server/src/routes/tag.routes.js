import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  createTag,
  getTags,
  getTag,
  updateTag,
  deleteTag
} from '../controllers/tag.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.use(protect)

router.route('/')
  .post(requirePerm(PERMISSIONS.TAG_MANAGE), asyncHandler(createTag))
  .get(asyncHandler(getTags))

router.route('/:id')
  .get(asyncHandler(getTag))
  .put(requirePerm(PERMISSIONS.TAG_MANAGE), asyncHandler(updateTag))
  .delete(requirePerm(PERMISSIONS.TAG_MANAGE), asyncHandler(deleteTag))

export default router
