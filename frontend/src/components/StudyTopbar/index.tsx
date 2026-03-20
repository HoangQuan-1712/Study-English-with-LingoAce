// PATH: src/components/StudyTopbar/index.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './StudyTopbar.css'

export type StudyMode = 'flashcards' | 'learn' | 'quiz' | 'match'

interface Props {
    mode: StudyMode
    setId: string
    setTitle: string
    onSettingsClick?: () => void
    settingsPanel?: React.ReactNode
    extra?: React.ReactNode
}

const MODE_LABELS: Record<StudyMode, string> = {
    flashcards: '🃏 Thẻ ghi nhớ',
    learn: '🎓 Học',
    quiz: '📝 Kiểm tra',
    match: '🧩 Ghép thẻ',
}
const MODE_ORDER: StudyMode[] = ['flashcards', 'learn', 'quiz', 'match']

export default function StudyTopbar({ mode, setId, setTitle, onSettingsClick, settingsPanel, extra }: Props) {
    const router = useRouter()
    const [modeOpen, setModeOpen] = useState(false)
    const dropRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setModeOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    return (
        <div className="study-topbar">
            {/* Left: mode switcher */}
            <div className="study-topbar-left" ref={dropRef}>
                <button className="study-mode-btn" onClick={() => setModeOpen(o => !o)}>
                    <span className="study-mode-label">{MODE_LABELS[mode]}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={modeOpen ? 'rotated' : ''}>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {modeOpen && (
                    <div className="study-mode-dropdown">
                        <div className="study-mode-drop-title">Học phần: {setTitle}</div>
                        <div className="study-mode-drop-divider" />
                        {MODE_ORDER.map(m => (
                            <button key={m} className={`study-mode-drop-item ${m === mode ? 'active' : ''}`}
                                onClick={() => { router.push(`/sets/${setId}/${m}`); setModeOpen(false) }}>
                                {MODE_LABELS[m]}
                                {m === mode && <span className="study-mode-drop-check">✓</span>}
                            </button>
                        ))}
                        <div className="study-mode-drop-divider" />
                        <Link href={`/sets/${setId}`} className="study-mode-drop-item home-item" onClick={() => setModeOpen(false)}>
                            🏠 Trang bộ thẻ
                        </Link>
                        <Link href="/" className="study-mode-drop-item home-item" onClick={() => setModeOpen(false)}>
                            🔍 Về trang chủ
                        </Link>
                    </div>
                )}
            </div>

            {/* Center: set title */}
            <div className="study-topbar-center">
                <span className="study-topbar-title">{setTitle}</span>
            </div>

            {/* Right: actions */}
            <div className="study-topbar-right">
                {extra}
                {onSettingsClick && (
                    <button className="study-topbar-icon-btn" onClick={onSettingsClick} title="Tùy chọn">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                    </button>
                )}
                <Link href={`/sets/${setId}`} className="study-topbar-icon-btn close-btn" title="Đóng">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </Link>
            </div>
        </div>
    )
}