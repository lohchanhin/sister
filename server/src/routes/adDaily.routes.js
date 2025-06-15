import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import {
  createAdDaily,
  getAdDaily,
  getWeeklyData,
  importAdDaily,
  bulkCreateAdDaily
} from '../controllers/adDaily.controller.js'

const router = Router({ mergeParams: true })

router.use(protect)

router.route('/')
  .post(createAdDaily)
  .get(getAdDaily)

router.get('/weekly', getWeeklyData)
router.post('/import', upload.single('file'), importAdDaily)
router.post('/bulk', bulkCreateAdDaily)

export default router
