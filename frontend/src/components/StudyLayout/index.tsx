// PATH: src/components/StudyLayout/index.tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'
import './StudyLayout.css'

interface Props {
    children: React.ReactNode
    title: string
    setId: string
    mode: string
    current?: number
    total?: number
    onExit?: () => void
}

export default function StudyLayout({ children, title, setId, mode, current, total, onExit }: Props) {
    const [showExit, setShowExit] = useState(false)
    const pct = total && current != null ? Math.round((current / total) * 100) : 0

    const modeIcon: Record<string, string> = {
        flashcard: '🃏', quiz: '📝', match: '🧩', learn: '🎓'
    }
    const modeLabel: Record<string, string> = {
        flashcard: 'Thẻ ghi nhớ', quiz: 'Kiểm tra', match: 'Ghép thẻ', learn: 'Học'
    }

    return (
        <div className="study-shell">
            {/* Top bar */}
            <header className="study-header">
                <button className="study-exit-btn" onClick={() => setShowExit(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="study-header-center">
                    {total != null && current != null && (
                        <>
                            <div className="study-prog-bar">
                                <div className="study-prog-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="study-prog-label">{current}/{total}</span>
                        </>
                    )}
                </div>

                <div className="study-header-right">
                    <span className="study-mode-badge">{modeIcon[mode]} {modeLabel[mode]}</span>
                    <span className="study-set-name">{title}</span>
                </div>
            </header>

            {/* Main content */}
            <main className="study-main">{children}</main>

            {/* Exit confirm modal */}
            {showExit && (
                <div className="study-modal-overlay" onClick={() => setShowExit(false)}>
                    <div className="study-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>🚪</div>
                        <h2 className="study-modal-title">Thoát phiên học?</h2>
                        <p className="study-modal-sub">Tiến trình của bạn sẽ được lưu lại</p>
                        <div className="study-modal-actions">
                            <Link href={`/sets/${setId}`} onClick={onExit}>
                                <button className="btn btn-primary" style={{ minWidth: 120 }}>Thoát</button>
                            </Link>
                            <button className="btn btn-ghost" style={{ minWidth: 120 }} onClick={() => setShowExit(false)}>
                                Tiếp tục học
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}