import { Router } from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { upload } from '../middleware/upload.js'
import { validate } from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  listScriptIdeas,
  createScriptIdea,
  getScriptIdea,
  updateScriptIdea,
  deleteScriptIdea
} from '../controllers/scriptIdea.controller.js'

const router = Router({ mergeParams: true })

router.use(protect)

router.get('/', requirePerm(PERMISSIONS.SCRIPT_IDEA_READ), asyncHandler(listScriptIdeas))

router.post(
  '/',
  requirePerm(PERMISSIONS.SCRIPT_IDEA_MANAGE),
  upload.single('video'),
  body('date').notEmpty().withMessage('腳本日期為必填').isISO8601().withMessage('腳本日期格式錯誤'),
  body('scriptCount').optional().isNumeric().withMessage('腳本數量需為數字'),
  body('status').optional().isIn(['pending', 'approved', 'revision']).withMessage('審核狀態不正確'),
  validate,
  asyncHandler(createScriptIdea)
)

router.get(
  '/:ideaId',
  requirePerm(PERMISSIONS.SCRIPT_IDEA_READ),
  asyncHandler(getScriptIdea)
)

router.put(
  '/:ideaId',
  requirePerm(PERMISSIONS.SCRIPT_IDEA_MANAGE),
  upload.single('video'),
  body('date').optional().isISO8601().withMessage('腳本日期格式錯誤'),
  body('scriptCount').optional().isNumeric().withMessage('腳本數量需為數字'),
  body('status').optional().isIn(['pending', 'approved', 'revision']).withMessage('審核狀態不正確'),
  validate,
  asyncHandler(updateScriptIdea)
)

router.delete(
  '/:ideaId',
  requirePerm(PERMISSIONS.SCRIPT_IDEA_MANAGE),
  asyncHandler(deleteScriptIdea)
)

export default router
