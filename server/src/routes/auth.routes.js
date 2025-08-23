import { Router } from 'express'
import { body } from 'express-validator'
import { login, register } from '../controllers/auth.controller.js'
import asyncHandler from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.post(
  '/login',
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  asyncHandler(login)
)
// \u82e5\u4e0d\u958b\u653e\u8a3b\u518a\u53ef\u79fb\u9664\u6b64\u884c
router.post(
  '/register',
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').isEmail().withMessage('Email is invalid'),
  body('role').notEmpty().withMessage('Role is required'),
  validate,
  asyncHandler(register)
)

export default router
