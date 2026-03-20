// PATH: backend/src/routes/sessionRoutes.ts
import { Router } from 'express'
import { createSession, getSessions, getSessionStats } from '../controllers/sessionController.js'

const router = Router()
router.get('/stats', getSessionStats)  // GET  /api/sessions/stats — phải trước /:id
router.get('/', getSessions)      // GET  /api/sessions
router.post('/', createSession)    // POST /api/sessions

export default router