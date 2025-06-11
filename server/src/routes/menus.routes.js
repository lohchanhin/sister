import { Router } from 'express'
import { MENUS } from '../config/menus.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(Object.values(MENUS))
})

export default router
