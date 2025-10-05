import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requireAnyPerm, requirePerm } from '../middleware/permission.js'
import { upload } from '../middleware/upload.js'
import asyncHandler from '../utils/asyncHandler.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  listWorkDiaries,
  getWorkDiary,
  createWorkDiary,
  updateWorkDiary,
  addWorkDiaryImages,
  removeWorkDiaryImage,
  reviewWorkDiary
} from '../controllers/workDiary.controller.js'

const router = Router()

router.use(protect)

router
  .route('/')
  .get(
    requireAnyPerm(
      PERMISSIONS.WORK_DIARY_READ_ALL,
      PERMISSIONS.WORK_DIARY_READ_SELF
    ),
    asyncHandler(listWorkDiaries)
  )
  .post(
    requirePerm(PERMISSIONS.WORK_DIARY_MANAGE_SELF),
    upload.array('images'),
    asyncHandler(createWorkDiary)
  )

router
  .route('/:diaryId')
  .get(
    requireAnyPerm(
      PERMISSIONS.WORK_DIARY_READ_ALL,
      PERMISSIONS.WORK_DIARY_READ_SELF
    ),
    asyncHandler(getWorkDiary)
  )
  .put(
    requirePerm(PERMISSIONS.WORK_DIARY_MANAGE_SELF),
    upload.array('images'),
    asyncHandler(updateWorkDiary)
  )

router.post(
  '/:diaryId/images',
  requirePerm(PERMISSIONS.WORK_DIARY_MANAGE_SELF),
  upload.array('images'),
  asyncHandler(addWorkDiaryImages)
)

router.delete(
  '/:diaryId/images/:imageId',
  requirePerm(PERMISSIONS.WORK_DIARY_MANAGE_SELF),
  asyncHandler(removeWorkDiaryImage)
)

router.patch(
  '/:diaryId/review',
  requirePerm(PERMISSIONS.WORK_DIARY_REVIEW),
  asyncHandler(reviewWorkDiary)
)

export default router
