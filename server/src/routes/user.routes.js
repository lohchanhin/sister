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

const router = Router()

router.use(protect)               // 登入保護
router.get('/profile', getProfile)
router.put('/profile', updateProfile)

router
  .route('/')
  .get(requirePerm(PERMISSIONS.USER_MANAGE), getAllUsers)               // GET  /api/user
  .post(requirePerm(PERMISSIONS.USER_MANAGE), createUser)               // POST /api/user

router
  .route('/:id')
  .put(requirePerm(PERMISSIONS.USER_MANAGE), updateUser)                // PUT    /api/user/:id
  .delete(requirePerm(PERMISSIONS.USER_MANAGE), deleteUser)             // DELETE /api/user/:id

export default router
