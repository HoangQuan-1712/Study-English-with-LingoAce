// src/routes/setRoutes.ts
import { Router } from 'express'
import {
    getSets, getSet, createSet, updateSet, deleteSet,
    searchSets, getSetStats
} from '../controllers/setController.js'
import { addCard, getCards } from '../controllers/cardController.js'

const r = Router()
r.get('/search', searchSets)   // GET    /api/sets/search?q=
r.get('/', getSets)      // GET    /api/sets
r.post('/', createSet)    // POST   /api/sets
r.get('/:id', getSet)       // GET    /api/sets/:id
r.put('/:id', updateSet)    // PUT    /api/sets/:id
r.delete('/:id', deleteSet)    // DELETE /api/sets/:id
r.get('/:id/stats', getSetStats)  // GET    /api/sets/:id/stats
r.get('/:id/cards', getCards)     // GET    /api/sets/:id/cards
r.post('/:id/cards', addCard)      // POST   /api/sets/:id/cards
export default r