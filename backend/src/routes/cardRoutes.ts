// src/routes/cardRoutes.ts
import { Router } from 'express'
import { updateCard, deleteCard } from '../controllers/cardController.js'

const r = Router()
r.put('/:id', updateCard)   // PUT    /api/cards/:id
r.delete('/:id', deleteCard)   // DELETE /api/cards/:id
export default r