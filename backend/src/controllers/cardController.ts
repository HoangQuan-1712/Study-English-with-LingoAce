// src/controllers/cardController.ts
import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError, wrap } from '../middleware/errorHandler.js'

// GET /api/sets/:id/cards
export const getCards = wrap(async (req: Request, res: Response) => {
    const setId = Number(req.params.id)
    const set = await prisma.studySet.findUnique({ where: { id: setId } })
    if (!set) throw new AppError(404, 'Không tìm thấy bộ thẻ')

    const cards = await prisma.card.findMany({
        where: { setId },
        orderBy: { id: 'asc' },
    })
    res.json(cards)
})

// POST /api/sets/:id/cards — thêm 1 thẻ
export const addCard = wrap(async (req: Request, res: Response) => {
    const setId = Number(req.params.id)
    const { term, definition, pronunciation } = req.body

    if (!term?.trim() || !definition?.trim())
        throw new AppError(400, 'term và definition không được để trống')

    const set = await prisma.studySet.findUnique({ where: { id: setId } })
    if (!set) throw new AppError(404, 'Không tìm thấy bộ thẻ')

    const card = await prisma.card.create({
        data: {
            term: term.trim(),
            definition: definition.trim(),
            pronunciation: pronunciation?.trim() || null,
            setId,
        },
    })
    res.status(201).json(card)
})

// PUT /api/cards/:id
export const updateCard = wrap(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const { term, definition, pronunciation } = req.body

    const existing = await prisma.card.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Không tìm thấy thẻ')

    const card = await prisma.card.update({
        where: { id },
        data: {
            ...(term?.trim() && { term: term.trim() }),
            ...(definition?.trim() && { definition: definition.trim() }),
            ...(pronunciation !== undefined && { pronunciation: pronunciation?.trim() || null }),
        },
    })
    res.json(card)
})

// DELETE /api/cards/:id
export const deleteCard = wrap(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const existing = await prisma.card.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Không tìm thấy thẻ')

    await prisma.card.delete({ where: { id } })
    res.json({ success: true })
})