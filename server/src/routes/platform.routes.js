import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createPlatform,
  getPlatforms,
  getPlatform,
  updatePlatform,
  deletePlatform
} from '../controllers/platform.controller.js'

const router = Router({ mergeParams: true })

router.use(protect)

router.route('/')
  .post(createPlatform)
  .get(getPlatforms)

router.route('/:id')
  .get(getPlatform)
  .put(updatePlatform)
  .delete(deletePlatform)

export default router
