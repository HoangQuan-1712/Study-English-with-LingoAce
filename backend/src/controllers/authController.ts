// PATH: backend/src/controllers/authController.ts
import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError, wrap } from '../middleware/errorHandler.js'
import { createHash } from 'crypto'

function hashPwd(pwd: string): string {
    return createHash('sha256').update(pwd + 'lingoace2024').digest('hex')
}
function makeToken(id: number): string {
    return createHash('sha256').update(`${id}_${Date.now()}`).digest('hex')
}

// POST /api/auth/register
export const register = wrap(async (req: Request, res: Response) => {
    const { name, email, password } = req.body
    if (!email?.trim()) throw new AppError(400, 'Email không được để trống')
    if (!password?.trim()) throw new AppError(400, 'Mật khẩu không được để trống')
    if (password.length < 6) throw new AppError(400, 'Mật khẩu phải ít nhất 6 ký tự')

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) throw new AppError(409, 'Email đã được sử dụng')

    const user = await prisma.user.create({
        data: {
            email: email.toLowerCase().trim(),
            name: name?.trim() || email.split('@')[0],
            password: hashPwd(password),
        }
    })
    res.status(201).json({ token: makeToken(user.id), user: { id: user.id, name: user.name, email: user.email } })
})

// POST /api/auth/login
export const login = wrap(async (req: Request, res: Response) => {
    const { email, password } = req.body
    if (!email?.trim() || !password?.trim()) throw new AppError(400, 'Email và mật khẩu không được để trống')

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user || user.password !== hashPwd(password)) throw new AppError(401, 'Email hoặc mật khẩu không đúng')

    res.json({ token: makeToken(user.id), user: { id: user.id, name: user.name, email: user.email } })
})

// POST /api/auth/guest
export const guestLogin = wrap(async (_req: Request, res: Response) => {
    const user = await prisma.user.upsert({
        where: { email: 'demo@lingoace.app' },
        update: {},
        create: { email: 'demo@lingoace.app', name: 'Khách', password: '' }
    })
    res.json({ token: makeToken(user.id), user: { id: user.id, name: user.name, email: user.email } })
})

// GET /api/auth/me
export const getAuthUser = wrap(async (req: Request, res: Response) => {
    const userId = (req as Record<string, unknown>).userId as number
    if (!userId) throw new AppError(401, 'Chưa đăng nhập')
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })
    if (!user) throw new AppError(404, 'User không tồn tại')
    res.json(user)
})