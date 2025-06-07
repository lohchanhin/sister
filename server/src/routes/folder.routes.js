import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder
} from '../controllers/folder.controller.js'

const router = Router()

router.post('/', protect, createFolder)
router.get('/', protect, getFolders)
router.get('/:id', protect, getFolder)
router.put('/:id', protect, updateFolder)
router.delete('/:id', protect, deleteFolder)   // folders

export default router
