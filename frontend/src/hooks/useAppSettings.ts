// PATH: src/hooks/useAppSettings.ts
'use client'
import { useState, useEffect } from 'react'
import { appSettings, type AppSettings } from '@/lib/settings'

export function useAppSettings() {
    const [settings, setSettings] = useState<AppSettings>(() => appSettings.get())

    useEffect(() => {
        const handler = (e: Event) => setSettings((e as CustomEvent).detail)
        window.addEventListener('lingoace-settings', handler)
        // Sync khi focus lại tab
        const syncHandler = () => setSettings(appSettings.get())
        window.addEventListener('focus', syncHandler)
        return () => {
            window.removeEventListener('lingoace-settings', handler)
            window.removeEventListener('focus', syncHandler)
        }
    }, [])

    const update = (patch: Partial<AppSettings>) => setSettings(appSettings.set(patch))
    return { settings, update }
}