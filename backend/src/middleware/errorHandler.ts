// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message)
        this.name = 'AppError'
    }
}

export const wrap =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
        (req: Request, res: Response, next: NextFunction) =>
            Promise.resolve(fn(req, res, next)).catch(next)

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message })
    }
    console.error('[ERROR]', err.message)
    res.status(500).json({ error: 'Lỗi server nội bộ' })
}