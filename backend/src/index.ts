import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRoutes from './routes/userRoutes.js'
import setRoutes from './routes/setRoutes.js'
import cardRoutes from './routes/cardRoutes.js'
import sessionRoutes from './routes/sessionRoutes.js'
import authRoutes from './routes/authRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()
const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}))
app.use(express.json())

if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`)
        next()
    })
}

app.get('/', (_req, res) => res.json({ status: 'ok', app: 'LingoAce API v1' }))
app.use('/api/me', userRoutes)
app.use('/api/sets', setRoutes)
app.use('/api/cards', cardRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/auth', authRoutes)
app.use(errorHandler)

const PORT = Number(process.env.PORT) || 5000
app.listen(PORT, () => {
    console.log(`✅  LingoAce API → http://localhost:${PORT}`)
    console.log(`📦  DB           → ${process.env.DATABASE_URL?.split('@')[1] ?? '???'}`)
})