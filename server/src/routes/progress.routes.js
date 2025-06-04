import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createTemplate,
  getTemplates,
  createRecord,
  getRecords
} from '../controllers/progress.controller.js'

const router = Router()

router.get('/templates', protect, getTemplates)
router.post('/templates', protect, createTemplate)
router.get('/records/:tplId', protect, getRecords)
router.post('/records', protect, createRecord)

export default router
