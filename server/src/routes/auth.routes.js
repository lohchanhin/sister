import { Router } from 'express'
import { login, register } from '../controllers/auth.controller.js'
const router = Router()

router.post('/login', login)
// \u82e5\u4e0d\u958b\u653e\u8a3b\u518a\u53ef\u79fb\u9664\u6b64\u884c
router.post('/register', register)

export default router
