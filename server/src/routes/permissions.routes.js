import { Router } from 'express'
import { PERMISSIONS } from '../config/permissions.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json(Object.values(PERMISSIONS))
}))

export default router
