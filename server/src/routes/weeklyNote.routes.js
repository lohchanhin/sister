import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import {
  createWeeklyNote,
  getWeeklyNote,
  updateWeeklyNote
} from '../controllers/weeklyNote.controller.js'

const router = Router({ mergeParams: true })

router.use(protect)

router.post('/', upload.array('images'), createWeeklyNote)
router.route('/:week')
  .get(getWeeklyNote)
  .put(upload.array('images'), updateWeeklyNote)

export default router
