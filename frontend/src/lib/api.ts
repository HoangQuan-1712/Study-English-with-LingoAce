const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || `HTTP ${res.status}`)
    }
    return res.json() as Promise<T>
}

export type Card = { id: number; term: string; definition: string; pronunciation: string | null; setId: number }
export type StudySet = { id: number; title: string; description: string | null; color: string; userId: number; cards: Card[] }
export type CardDraft = { term: string; definition: string; pronunciation?: string }
export type StudySession = {
    id: number; setId: number; mode: string; score: number; total: number
    duration: number; studiedAt: string
    set?: { title: string; color: string }
}
export type SessionStats = {
    streak: number; totalTime: number; totalStudied: number
    avgScore: number; calendar: Record<string, number>; totalSessions: number
}

export const api = {
    getSets: (userId = 1) => req<StudySet[]>(`/api/sets?userId=${userId}`),
    getSet: (id: string | number) => req<StudySet>(`/api/sets/${id}`),
    createSet: (data: { title: string; description?: string; color?: string; cards: CardDraft[] }) =>
        req<StudySet>('/api/sets', { method: 'POST', body: JSON.stringify({ ...data, userId: 1 }) }),
    updateSet: (id: string | number, data: { title: string; description?: string; color?: string; cards: CardDraft[] }) =>
        req<StudySet>(`/api/sets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSet: (id: string | number) =>
        req<{ success: boolean }>(`/api/sets/${id}`, { method: 'DELETE' }),
    search: (q: string, userId = 1) =>
        req<StudySet[]>(`/api/sets/search?q=${encodeURIComponent(q)}&userId=${userId}`),
    updateMe: (data: { name?: string; email?: string }) =>
        req<{ id: number; name: string; email: string }>('/api/me', { method: 'PUT', body: JSON.stringify(data) }),
    getStats: () =>
        req<{ totalSets: number; totalCards: number; streak: number }>('/api/me/stats'),
    // Sessions
    saveSession: (data: { setId: number; mode: string; score: number; total: number; duration: number }) =>
        req<StudySession>('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),
    getSessions: () => req<StudySession[]>('/api/sessions'),
    getSessionStats: () => req<SessionStats>('/api/sessions/stats'),
}