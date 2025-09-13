import { Router } from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  getUserClients,
  updateUserClients
} from '../controllers/user.controller.js'
import asyncHandler from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.use(protect)               // 登入保護
router.get('/profile', asyncHandler(getProfile))
router.put('/profile', asyncHandler(updateProfile))

router
  .route('/')
  .get(requirePerm(PERMISSIONS.USER_MANAGE), asyncHandler(getAllUsers))               // GET  /api/user
  .post(
    requirePerm(PERMISSIONS.USER_MANAGE),
    body('username').notEmpty().withMessage('Username is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email is invalid'),
    body('role').notEmpty().withMessage('Role is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('allowedClients').optional().isArray(),
    body('allowedClients.*').optional().isMongoId(),
    validate,
    asyncHandler(createUser)
  )               // POST /api/user

router
  .route('/:id')
  .put(
    requirePerm(PERMISSIONS.USER_MANAGE),
    body('email').optional().isEmail().withMessage('Email is invalid'),
    body('allowedClients').optional().isArray(),
    body('allowedClients.*').optional().isMongoId(),
    validate,
    asyncHandler(updateUser)
  )                // PUT    /api/user/:id
  .delete(requirePerm(PERMISSIONS.USER_MANAGE), asyncHandler(deleteUser))             // DELETE /api/user/:id

router
  .route('/:id/clients')
  .get(requirePerm(PERMISSIONS.USER_MANAGE), asyncHandler(getUserClients))
  .put(
    requirePerm(PERMISSIONS.USER_MANAGE),
    body('clients').isArray(),
    body('clients.*').isMongoId(),
    validate,
    asyncHandler(updateUserClients)
  )

export default router
