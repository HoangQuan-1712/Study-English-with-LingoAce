// src/routes/userRoutes.ts
import { Router } from 'express'
import { getMe, updateMe, getStats } from '../controllers/userController.js'

const r = Router()
r.get('/', getMe)     // GET  /api/me
r.put('/', updateMe)  // PUT  /api/me
r.get('/stats', getStats)  // GET  /api/me/stats
export default r