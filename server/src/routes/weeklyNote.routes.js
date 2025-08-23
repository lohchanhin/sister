import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import {
  createWeeklyNote,
  getWeeklyNote,
  getWeeklyNotes,
  updateWeeklyNote,
  getWeeklyImageUrl
} from '../controllers/weeklyNote.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router({ mergeParams: true })

router.use(protect)

router.get('/', asyncHandler(getWeeklyNotes))
router.post('/', upload.array('images'), asyncHandler(createWeeklyNote))
router.get('/image-url', asyncHandler(getWeeklyImageUrl))
router.route('/:week')
  .get(asyncHandler(getWeeklyNote))
  .put(upload.array('images'), asyncHandler(updateWeeklyNote))

export default router
