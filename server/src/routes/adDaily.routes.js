import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createAdDaily,
  getAdDaily,
  getWeeklyData
} from '../controllers/adDaily.controller.js'

const router = Router({ mergeParams: true })

router.use(protect)

router.route('/')
  .post(createAdDaily)
  .get(getAdDaily)

router.get('/weekly', getWeeklyData)

export default router
