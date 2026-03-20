// PATH: src/components/ConditionalLayout/index.tsx
'use client'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

// Full-screen: không có sidebar
const FULLSCREEN_PATTERNS = [
    /^\/sets\/\d+\/(flashcards|quiz|match|learn)$/,
    /^\/login$/,
    /^\/register$/,
]

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isFullscreen = FULLSCREEN_PATTERNS.some(p => p.test(pathname))

    if (isFullscreen) return <div className="study-shell">{children}</div>

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">{children}</main>
        </div>
    )
}