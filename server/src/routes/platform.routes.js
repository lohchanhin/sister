// platform.routes.js
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createPlatform,
  getPlatforms,
  getPlatform,
  updatePlatform,
  deletePlatform,
  renamePlatformField,
  getPlatformAliases,
  updatePlatformAliases
} from '../controllers/platform.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

// 注意：此路由应挂载在 /clients/:clientId/platforms
// 例如：app.use('/clients/:clientId/platforms', platformRoutes)
const router = Router({ mergeParams: true })

router.use(protect)

// /clients/:clientId/platforms
router
  .route('/')
  .post(asyncHandler(createPlatform))
  .get(asyncHandler(getPlatforms))

// /clients/:clientId/platforms/:id
router
  .route('/:id')
  .get(asyncHandler(getPlatform))
  .put(asyncHandler(updatePlatform))
  .delete(asyncHandler(deletePlatform))

router
  .route('/:id/aliases')
  .get(asyncHandler(getPlatformAliases))
  .put(asyncHandler(updatePlatformAliases))

// /clients/:clientId/platforms/:id/rename-field
router.put('/:id/rename-field', asyncHandler(renamePlatformField))

export default router
