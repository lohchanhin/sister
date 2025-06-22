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
  reviewFolder
} from '../controllers/folder.controller.js'
import {
  getFolderStages,
  updateFolderStageStatus
} from '../controllers/folderReviewRecord.controller.js'

const router = Router()

router.post('/', protect, requirePerm(PERMISSIONS.FOLDER_MANAGE), createFolder)
router.get('/', protect, requirePerm(PERMISSIONS.FOLDER_READ), getFolders) // GET  /api/folders?progress=true 可取得進度
router.get('/:id', protect, requirePerm(PERMISSIONS.FOLDER_READ), getFolder)
router.put(
  '/viewers',
  protect,
  requirePerm(PERMISSIONS.FOLDER_MANAGE),
  updateFoldersViewers
)
router.put(
  '/:id/review',
  protect,
  requirePerm(PERMISSIONS.REVIEW_MANAGE),
  reviewFolder
)
router.get('/:id/stages', protect, getFolderStages)
router.put('/:id/stages/:stageId', protect, updateFolderStageStatus)
router.put('/:id', protect, requirePerm(PERMISSIONS.FOLDER_MANAGE), updateFolder)
router.delete(
  '/:id',
  protect,
  requirePerm(PERMISSIONS.FOLDER_MANAGE),
  deleteFolder
)   // folders

export default router
