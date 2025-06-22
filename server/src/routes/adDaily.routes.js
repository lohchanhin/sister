import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import {
  createAdDaily,
  getAdDaily,
  getWeeklyData,
  importAdDaily,
  bulkCreateAdDaily,
  updateAdDaily,
  deleteAdDaily
} from '../controllers/adDaily.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router({ mergeParams: true })

router.use(protect)

router.route('/')
  .post(asyncHandler(createAdDaily))
  .get(asyncHandler(getAdDaily))

router.get('/weekly', asyncHandler(getWeeklyData))
router.post('/import', upload.single('file'), asyncHandler(importAdDaily))
router.post('/bulk', asyncHandler(bulkCreateAdDaily))

router.route('/:id')
  .put(asyncHandler(updateAdDaily))
  .delete(asyncHandler(deleteAdDaily))

export default router
