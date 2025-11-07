import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getSummary, getDaily } from '../controllers/dashboard.controller.js'
import asyncHandler from '../utils/asyncHandler.js'
import { query } from 'express-validator'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(protect)
router.get(
  '/summary',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page 必須為正整數'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('pageSize 必須介於 1 與 50 之間')
  ],
  validate,
  asyncHandler(getSummary)
)
router.get('/daily', asyncHandler(getDaily))

export default router
