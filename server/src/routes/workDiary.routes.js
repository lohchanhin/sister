import express from 'express'
import asyncHandler from 'express-async-handler'
import { protect } from '../middleware/auth.js'
import {
  listWorkDiaries,
  getWorkDiary,
  updateWorkDiary,
  createWorkDiary
} from '../controllers/workDiary.controller.js'

const router = express.Router()

router.use(protect)

router
  .route('/')
  .get(asyncHandler(listWorkDiaries))
  .post(asyncHandler(createWorkDiary))

router
  .route('/:id')
  .get(asyncHandler(getWorkDiary))
  .put(asyncHandler(updateWorkDiary))

export default router
