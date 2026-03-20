// src/controllers/setController.ts
import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError, wrap } from '../middleware/errorHandler.js'

const UID = 1

async function ensureUser() {
    const u = await prisma.user.upsert({
        where: { id: UID },
        update: {},
        create: { id: UID, email: 'demo@lingoace.app', name: 'Bạn' },
    })
    return u
}

// GET /api/sets
export const getSets = wrap(async (req: Request, res: Response) => {
    const userId = Number(req.query.userId) || UID
    await ensureUser()
    const sets = await prisma.studySet.findMany({
        where: { userId },
        include: { cards: { orderBy: { id: 'asc' } } },
        orderBy: { id: 'desc' },
    })
    res.json(sets)
})

// GET /api/sets/search?q=
export const searchSets = wrap(async (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim()
    const userId = Number(req.query.userId) || UID
    if (!q) return res.json([])

    const sets = await prisma.studySet.findMany({
        where: {
            userId,
            OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { cards: { some: { term: { contains: q } } } },
            ],
        },
        include: { cards: true },
        take: 10,
        orderBy: { id: 'desc' },
    })
    res.json(sets)
})

// GET /api/sets/:id
export const getSet = wrap(async (req: Request, res: Response) => {
    const set = await prisma.studySet.findUnique({
        where: { id: Number(req.params.id) },
        include: { cards: { orderBy: { id: 'asc' } } },
    })
    if (!set) throw new AppError(404, 'Không tìm thấy bộ thẻ')
    res.json(set)
})

// POST /api/sets
export const createSet = wrap(async (req: Request, res: Response) => {
    const { title, description = '', color = '#4255ff', userId = UID, cards = [] } = req.body
    if (!title?.trim()) throw new AppError(400, 'Tiêu đề không được để trống')

    await ensureUser()

    const validCards = (cards as Array<{ term?: string; definition?: string; pronunciation?: string }>)
        .filter(c => c?.term?.trim() && c?.definition?.trim())

    const set = await prisma.studySet.create({
        data: {
            title: title.trim(),
            description: description.trim() || null,
            color: color || '#4255ff',
            userId: Number(userId),
            cards: {
                create: validCards.map(c => ({
                    term: c.term!.trim(),
                    definition: c.definition!.trim(),
                    pronunciation: c.pronunciation?.trim() || null,
                })),
            },
        },
        include: { cards: true },
    })
    res.status(201).json(set)
})

// PUT /api/sets/:id
export const updateSet = wrap(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const { title, description = '', color, cards = [] } = req.body
    if (!title?.trim()) throw new AppError(400, 'Tiêu đề không được để trống')

    const existing = await prisma.studySet.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Không tìm thấy bộ thẻ')

    const validCards = (cards as Array<{ term?: string; definition?: string; pronunciation?: string }>)
        .filter(c => c?.term?.trim() && c?.definition?.trim())

    await prisma.card.deleteMany({ where: { setId: id } })

    const set = await prisma.studySet.update({
        where: { id },
        data: {
            title: title.trim(),
            description: description.trim() || null,
            ...(color && { color }),
            cards: {
                create: validCards.map(c => ({
                    term: c.term!.trim(),
                    definition: c.definition!.trim(),
                    pronunciation: c.pronunciation?.trim() || null,
                })),
            },
        },
        include: { cards: true },
    })
    res.json(set)
})

// DELETE /api/sets/:id
export const deleteSet = wrap(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const existing = await prisma.studySet.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Không tìm thấy bộ thẻ')
    await prisma.card.deleteMany({ where: { setId: id } })
    await prisma.studySet.delete({ where: { id } })
    res.json({ success: true })
})

// GET /api/sets/:id/stats
export const getSetStats = wrap(async (req: Request, res: Response) => {
    const set = await prisma.studySet.findUnique({
        where: { id: Number(req.params.id) },
        include: { cards: true },
    })
    if (!set) throw new AppError(404, 'Không tìm thấy bộ thẻ')
    res.json({ id: set.id, title: set.title, totalCards: set.cards.length })
})