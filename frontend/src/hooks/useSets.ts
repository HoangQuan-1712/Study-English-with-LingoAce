'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type StudySet } from '@/lib/api'

export function useSets(userId = 1) {
    const [sets, setSets] = useState<StudySet[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getSets(userId)
            setSets(data)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => { load() }, [load])

    const removeSet = (id: number) => setSets(p => p.filter(s => s.id !== id))

    return { sets, loading, error, reload: load, removeSet }
}

export function useSet(id: string | number) {
    const [set, setSet] = useState<StudySet | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const strId = String(id)
    const prevId = useRef(strId)

    useEffect(() => {
        prevId.current = strId
        setLoading(true)
        setError(null)
        api.getSet(strId)
            .then(data => { if (prevId.current === strId) setSet(data) })
            .catch((e: unknown) => {
                if (prevId.current === strId)
                    setError(e instanceof Error ? e.message : 'Lỗi kết nối')
            })
            .finally(() => { if (prevId.current === strId) setLoading(false) })
    }, [strId])

    return { set, loading, error }
}