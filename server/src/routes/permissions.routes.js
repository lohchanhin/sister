import { Router } from 'express'
import { PERMISSIONS } from '../config/permissions.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(Object.values(PERMISSIONS))
})

export default router
