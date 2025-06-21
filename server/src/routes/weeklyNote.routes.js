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

const router = Router({ mergeParams: true })

router.use(protect)

router.get('/', getWeeklyNotes)
router.post('/', upload.array('images'), createWeeklyNote)
router.get('/image-url', getWeeklyImageUrl)
router.route('/:week')
  .get(getWeeklyNote)
  .put(upload.array('images'), updateWeeklyNote)

export default router
