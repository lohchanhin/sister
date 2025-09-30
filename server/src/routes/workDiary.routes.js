import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { authorize } from '../middleware/roleGuard.js'
import { upload } from '../middleware/upload.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ROLES } from '../config/roles.js'
import {
  listWorkDiaries,
  getWorkDiary,
  createWorkDiary,
  updateWorkDiary,
  reviewWorkDiary
} from '../controllers/workDiary.controller.js'

const router = Router()

router.use(protect)

router
  .route('/')
  .get(asyncHandler(listWorkDiaries))
  .post(upload.array('images'), asyncHandler(createWorkDiary))

router
  .route('/:diaryId')
  .get(asyncHandler(getWorkDiary))
  .put(upload.array('images'), asyncHandler(updateWorkDiary))

router.patch(
  '/:diaryId/review',
  authorize(ROLES.MANAGER),
  asyncHandler(reviewWorkDiary)
)

export default router
