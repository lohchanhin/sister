import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient
} from '../controllers/client.controller.js'

import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.use(protect)

router.route('/')
  .post(asyncHandler(createClient))
  .get(asyncHandler(getClients))

router.route('/:id')
  .get(asyncHandler(getClient))
  .put(asyncHandler(updateClient))
  .delete(asyncHandler(deleteClient))

export default router
