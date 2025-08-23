import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile
} from '../controllers/user.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.use(protect)               // 登入保護
router.get('/profile', asyncHandler(getProfile))
router.put('/profile', asyncHandler(updateProfile))

router
  .route('/')
  .get(requirePerm(PERMISSIONS.USER_MANAGE), asyncHandler(getAllUsers))               // GET  /api/user
  .post(requirePerm(PERMISSIONS.USER_MANAGE), asyncHandler(createUser))               // POST /api/user

router
  .route('/:id')
  .put(requirePerm(PERMISSIONS.USER_MANAGE), asyncHandler(updateUser))                // PUT    /api/user/:id
  .delete(requirePerm(PERMISSIONS.USER_MANAGE), asyncHandler(deleteUser))             // DELETE /api/user/:id

export default router
