// PATH: backend/src/controllers/userController.ts
import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { wrap } from '../middleware/errorHandler.js'

const UID = 1

export const getMe = wrap(async (_req: Request, res: Response) => {
    const user = await prisma.user.upsert({
        where: { id: UID },
        update: {},
        create: { id: UID, email: 'demo@lingoace.app', name: 'Bạn' },
    })
    res.json(user)
})

export const updateMe = wrap(async (req: Request, res: Response) => {
    const { name, email } = req.body
    const user = await prisma.user.upsert({
        where: { id: UID },
        update: {
            ...(name?.trim() && { name: name.trim() }),
            ...(email?.trim() && { email: email.trim() }),
        },
        create: { id: UID, email: email?.trim() || 'demo@lingoace.app', name: name?.trim() || 'Bạn' },
    })
    res.json(user)
})

export const getStats = wrap(async (_req: Request, res: Response) => {
    await prisma.user.upsert({
        where: { id: UID },
        update: {},
        create: { id: UID, email: 'demo@lingoace.app', name: 'Bạn' },
    })

    const [totalSets, totalCards] = await Promise.all([
        prisma.studySet.count({ where: { userId: UID } }),
        prisma.card.count({ where: { studySet: { userId: UID } } }),
    ])

    // Tính streak từ sessions — graceful nếu bảng chưa có
    let streak = 0
    try {
        const sessions = await (prisma as any).studySession.findMany({
            where: { userId: UID },
            orderBy: { studiedAt: 'desc' },
            select: { studiedAt: true },
        })
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const dates = [...new Set(sessions.map((s: any) => {
            const d = new Date(s.studiedAt); d.setHours(0, 0, 0, 0); return d.getTime()
        }))].sort((a: any, b: any) => b - a)
        let check = today.getTime()
        for (const d of dates) {
            if (d === check) { streak++; check -= 86400000 } else if ((d as number) < check) break
        }
    } catch { /* bảng chưa tồn tại */ }

    res.json({ totalSets, totalCards, streak })
})