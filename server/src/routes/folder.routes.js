import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { requirePerm } from '../middleware/permission.js'
import { PERMISSIONS } from '../config/permissions.js'
import {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
  updateFoldersViewers,
  moveFolders,
  reviewFolder,
  downloadFolder,
  getDownloadProgress
} from '../controllers/folder.controller.js'
import {
  getFolderStages,
  updateFolderStageStatus
} from '../controllers/folderReviewRecord.controller.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.post('/', protect, requirePerm(PERMISSIONS.FOLDER_MANAGE), asyncHandler(createFolder))
router.get('/', protect, requirePerm(PERMISSIONS.FOLDER_READ), asyncHandler(getFolders)) // GET  /api/folders?progress=true 可取得進度
router.get('/:id', protect, requirePerm(PERMISSIONS.FOLDER_READ), asyncHandler(getFolder))
router.get(
  '/:id/download',
  protect,
  requirePerm(PERMISSIONS.FOLDER_READ),
  asyncHandler(downloadFolder)
)
router.get(
  '/:id/download/progress',
  protect,
  requirePerm(PERMISSIONS.FOLDER_READ),
  asyncHandler(getDownloadProgress)
)
router.put(
  '/viewers',
  protect,
  requirePerm(PERMISSIONS.FOLDER_MANAGE),
  asyncHandler(updateFoldersViewers)
)
router.put(
  '/move',
  protect,
  requirePerm(PERMISSIONS.FOLDER_MANAGE),
  asyncHandler(moveFolders)
)
router.put(
  '/:id/review',
  protect,
  requirePerm(PERMISSIONS.REVIEW_MANAGE),
  asyncHandler(reviewFolder)
)
router.get('/:id/stages', protect, asyncHandler(getFolderStages))
router.put('/:id/stages/:stageId', protect, asyncHandler(updateFolderStageStatus))
router.put('/:id', protect, requirePerm(PERMISSIONS.FOLDER_MANAGE), asyncHandler(updateFolder))
router.delete(
  '/:id',
  protect,
  requirePerm(PERMISSIONS.FOLDER_MANAGE),
  asyncHandler(deleteFolder)
)   // folders

export default router
