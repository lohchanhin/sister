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

const router = Router()

router.use(protect)

router.route('/')
  .post(requirePerm(PERMISSIONS.TAG_MANAGE), createTag)
  .get(getTags)

router.route('/:id')
  .get(getTag)
  .put(requirePerm(PERMISSIONS.TAG_MANAGE), updateTag)
  .delete(requirePerm(PERMISSIONS.TAG_MANAGE), deleteTag)

export default router
