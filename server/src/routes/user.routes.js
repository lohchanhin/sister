import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  getAllUsers, createUser, updateUser, deleteUser
} from '../controllers/user.controller.js'

const router = Router()

router.use(protect)               // 登入保護

router
  .route('/')
  .get(getAllUsers)               // GET  /api/user
  .post(createUser)               // POST /api/user

router
  .route('/:id')
  .put(updateUser)                // PUT    /api/user/:id
  .delete(deleteUser)             // DELETE /api/user/:id

export default router
