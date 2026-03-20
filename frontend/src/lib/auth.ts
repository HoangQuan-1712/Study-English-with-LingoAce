// PATH: src/lib/auth.ts
'use client'

export type AuthUser = { id: number; name: string | null; email: string }

export const auth = {
    getUser: (): AuthUser | null => {
        if (typeof window === 'undefined') return null
        try { return JSON.parse(localStorage.getItem('lingoace_user') || 'null') } catch { return null }
    },
    getToken: (): string | null => {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('lingoace_token')
    },
    save: (token: string, user: AuthUser) => {
        localStorage.setItem('lingoace_token', token)
        localStorage.setItem('lingoace_user', JSON.stringify(user))
    },
    clear: () => {
        localStorage.removeItem('lingoace_token')
        localStorage.removeItem('lingoace_user')
    },
    isLoggedIn: (): boolean => !!localStorage.getItem('lingoace_token'),
}