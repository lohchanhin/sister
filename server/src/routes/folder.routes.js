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
  updateFoldersViewers
} from '../controllers/folder.controller.js'

const router = Router()

router.post('/', protect, requirePerm(PERMISSIONS.FOLDER_MANAGE), createFolder)
router.get('/', protect, requirePerm(PERMISSIONS.FOLDER_READ), getFolders)
router.get('/:id', protect, requirePerm(PERMISSIONS.FOLDER_READ), getFolder)
router.put(
  '/viewers',
  protect,
  requirePerm(PERMISSIONS.FOLDER_MANAGE),
  updateFoldersViewers
)
router.put('/:id', protect, requirePerm(PERMISSIONS.FOLDER_MANAGE), updateFolder)
router.delete(
  '/:id',
  protect,
  requirePerm(PERMISSIONS.FOLDER_MANAGE),
  deleteFolder
)   // folders

export default router
