import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createPlatform,
  getPlatforms,
  getPlatform,
  updatePlatform,
  deletePlatform
} from '../controllers/platform.controller.js'

import asyncHandler from '../utils/asyncHandler.js'

const router = Router({ mergeParams: true })

router.use(protect)

router.route('/')
  .post(asyncHandler(createPlatform))
  .get(asyncHandler(getPlatforms))

router.route('/:id')
  .get(asyncHandler(getPlatform))
  .put(asyncHandler(updatePlatform))
  .delete(asyncHandler(deletePlatform))

export default router
