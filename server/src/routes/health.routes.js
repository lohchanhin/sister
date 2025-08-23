import { Router } from 'express'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json({ status: 'ok' })
}))

export default router
