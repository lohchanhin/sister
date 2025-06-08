import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  createTemplate,  getTemplates,
  updateTemplate,  deleteTemplate,   // ← 新增
  createRecord,    getRecords,
  getRecentRecords , updateRecord
} from '../controllers/progress.controller.js'

const router = Router()

router.get(
  '/templates',
  protect,
  requirePerm(PERMISSIONS.PROGRESS_MANAGE),
  getTemplates
)
router.post(
  '/templates',
  protect,
  requirePerm(PERMISSIONS.PROGRESS_MANAGE),
  createTemplate
)
router.put(
  '/templates/:id',
  protect,
  requirePerm(PERMISSIONS.PROGRESS_MANAGE),
  updateTemplate
)   // ★
router.delete(
  '/templates/:id',
  protect,
  requirePerm(PERMISSIONS.PROGRESS_MANAGE),
  deleteTemplate
) // ★

<<<<<<< HEAD
router.get ('/records/:tplId', protect, getRecords)
router.post('/records',       protect, createRecord)
router.get ('/recent', protect, getRecentRecords)
router.put('/records/:id', protect, updateRecord)   // ★ 新增
=======
router.get(
  '/records/:tplId',
  protect,
  requirePerm(PERMISSIONS.PROGRESS_MANAGE),
  getRecords
)
router.post(
  '/records',
  protect,
  requirePerm(PERMISSIONS.PROGRESS_MANAGE),
  createRecord
)
router.get(
  '/recent',
  protect,
  requirePerm(PERMISSIONS.PROGRESS_MANAGE),
  getRecentRecords
)

>>>>>>> 87a3e855fe613b710d1b2aa470615797b3a4051c
export default router

