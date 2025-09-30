import { Router } from 'express'
import { body, param } from 'express-validator'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  listPopularContents,
  createPopularContent,
  getPopularContent,
  updatePopularContent,
  deletePopularContent,
  uploadPopularContentCover
} from '../controllers/popularContent.controller.js'

const router = Router({ mergeParams: true })

router.use(protect)

router
  .route('/')
  .get(asyncHandler(listPopularContents))
  .post(
    [
      body('title').notEmpty(),
      body('platformKey').notEmpty(),
      body('publishDate').notEmpty(),
      body('exposure').optional().isNumeric(),
      body('viewCount').optional().isNumeric(),
      body('coverCtr').optional().isNumeric(),
      body('avgWatchSeconds').optional().isNumeric(),
      body('completionRate').optional().isNumeric(),
      body('twoSecondDropRate').optional().isNumeric()
    ],
    asyncHandler(createPopularContent)
  )

router
  .route('/:contentId')
  .get([param('contentId').isMongoId()], asyncHandler(getPopularContent))
  .put(
    [
      param('contentId').isMongoId(),
      body('dueDate').optional().isISO8601(),
      body('publishDate').optional().isISO8601(),
      body('exposure').optional().isNumeric(),
      body('viewCount').optional().isNumeric(),
      body('coverCtr').optional().isNumeric(),
      body('avgWatchSeconds').optional().isNumeric(),
      body('completionRate').optional().isNumeric(),
      body('twoSecondDropRate').optional().isNumeric()
    ],
    asyncHandler(updatePopularContent)
  )
  .delete([param('contentId').isMongoId()], asyncHandler(deletePopularContent))

router.post(
  '/:contentId/cover',
  [param('contentId').isMongoId()],
  upload.single('cover'),
  asyncHandler(uploadPopularContentCover)
)

export default router
