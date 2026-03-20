// PATH: backend/src/routes/authRoutes.ts
import { Router } from 'express'
import { register, login, guestLogin, getAuthUser } from '../controllers/authController.js'

const router = Router()
router.post('/register', register)
router.post('/login', login)
router.post('/guest', guestLogin)
router.get('/me', getAuthUser)
export default router