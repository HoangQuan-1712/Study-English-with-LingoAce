// PATH: src/lib/settings.ts
// Global settings - lưu/đọc từ localStorage

export interface AppSettings {
    cardsPerSession: number | 'all'
    shuffle: boolean
    autoPlay: boolean
    showShortcuts: boolean
    defLang: 'vi' | 'en' | 'ja'
    darkMode: boolean
}

const DEFAULTS: AppSettings = {
    cardsPerSession: 20,
    shuffle: false,
    autoPlay: true,
    showShortcuts: true,
    defLang: 'vi',
    darkMode: false,
}

const KEY = 'lingoace_settings'

export const appSettings = {
    get(): AppSettings {
        if (typeof window === 'undefined') return DEFAULTS
        try {
            const raw = localStorage.getItem(KEY)
            return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
        } catch { return DEFAULTS }
    },
    set(patch: Partial<AppSettings>) {
        const current = appSettings.get()
        const next = { ...current, ...patch }
        localStorage.setItem(KEY, JSON.stringify(next))
        // Phát event để các component biết settings thay đổi
        window.dispatchEvent(new CustomEvent('lingoace-settings', { detail: next }))
        return next
    },
}