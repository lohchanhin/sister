import { Router } from 'express'
import { MENUS } from '../config/menus.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json(Object.values(MENUS))
}))

export default router
