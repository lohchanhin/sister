import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient
} from '../controllers/client.controller.js'

const router = Router()

router.use(protect)

router.route('/')
  .post(createClient)
  .get(getClients)

router.route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient)

export default router
