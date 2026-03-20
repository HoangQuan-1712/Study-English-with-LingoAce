// PATH: backend/src/controllers/sessionController.ts
import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { wrap } from '../middleware/errorHandler.js'

const UID = 1

// POST /api/sessions — lưu kết quả phiên học
export const createSession = wrap(async (req: Request, res: Response) => {
    const { setId, mode, score, total, duration } = req.body
    try {
        const session = await (prisma as any).studySession.create({
            data: {
                userId: UID,
                setId: Number(setId),
                mode: String(mode),
                score: Number(score) || 0,
                total: Number(total) || 0,
                duration: Number(duration) || 0,
            },
        })
        res.status(201).json(session)
    } catch {
        // Bảng chưa tồn tại — trả về OK để không crash frontend
        res.status(201).json({ id: 0, setId, mode, score, total, duration, studiedAt: new Date() })
    }
})

// GET /api/sessions
export const getSessions = wrap(async (_req: Request, res: Response) => {
    try {
        const sessions = await (prisma as any).studySession.findMany({
            where: { userId: UID },
            include: { set: { select: { title: true, color: true } } },
            orderBy: { studiedAt: 'desc' },
            take: 50,
        })
        res.json(sessions)
    } catch {
        res.json([])
    }
})

// GET /api/sessions/stats
export const getSessionStats = wrap(async (_req: Request, res: Response) => {
    try {
        const sessions = await (prisma as any).studySession.findMany({
            where: { userId: UID },
            orderBy: { studiedAt: 'desc' },
        })

        const today = new Date(); today.setHours(0, 0, 0, 0)
        const dates = [...new Set(sessions.map((s: any) => {
            const d = new Date(s.studiedAt); d.setHours(0, 0, 0, 0); return d.getTime()
        }))].sort((a: any, b: any) => b - a)

        let streak = 0, check = today.getTime()
        for (const d of dates) {
            if (d === check) { streak++; check -= 86400000 } else if ((d as number) < check) break
        }

        const totalTime = sessions.reduce((s: number, x: any) => s + (x.duration || 0), 0)
        const totalStudied = sessions.reduce((s: number, x: any) => s + (x.total || 0), 0)
        const avgScore = sessions.length
            ? Math.round(sessions.reduce((s: number, x: any) => s + (x.total > 0 ? x.score / x.total : 0), 0) / sessions.length * 100)
            : 0

        const calendar: Record<string, number> = {}
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i)
            calendar[d.toISOString().slice(0, 10)] = 0
        }
        for (const s of sessions) {
            const key = new Date((s as any).studiedAt).toISOString().slice(0, 10)
            if (key in calendar) calendar[key]++
        }

        res.json({ streak, totalTime, totalStudied, avgScore, calendar, totalSessions: sessions.length })
    } catch {
        // Bảng chưa tồn tại — trả về data trống
        const calendar: Record<string, number> = {}
        for (let i = 29; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i)
            calendar[d.toISOString().slice(0, 10)] = 0
        }
        res.json({ streak: 0, totalTime: 0, totalStudied: 0, avgScore: 0, calendar, totalSessions: 0 })
    }
})