// PATH: src/components/Topbar/index.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth, type AuthUser } from '@/lib/auth'
import './Topbar.css'

export default function Topbar() {
    const router = useRouter()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const dropRef = useRef<HTMLDivElement>(null)

    useEffect(() => { setUser(auth.getUser()) }, [])
    useEffect(() => {
        const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
    }, [])

    const initial = (user?.name || user?.email || 'U')[0].toUpperCase()
    const logout = () => { auth.clear(); router.push('/login') }

    return (
        <header className="topbar">
            {/* Logo */}
            <Link href="/" className="topbar-logo">
                <div className="topbar-logo-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <span>Lingo<strong>Ace</strong></span>
            </Link>

            {/* Search */}
            <div className="topbar-search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && query.trim() && router.push(`/library?q=${encodeURIComponent(query)}`)}
                    placeholder="Tìm kiếm bộ thẻ, thuật ngữ..." />
            </div>

            {/* Right actions */}
            <div className="topbar-right">
                <button className="topbar-upgrade">⚡ Nâng cấp</button>
                <Link href="/create" className="topbar-create">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Tạo mới
                </Link>
                <div className="topbar-avatar-wrap" ref={dropRef}>
                    <button className="topbar-avatar" onClick={() => setOpen(o => !o)}>{initial}</button>
                    {open && (
                        <div className="topbar-dropdown">
                            <div className="topbar-drop-user">
                                <div className="topbar-drop-avatar">{initial}</div>
                                <div>
                                    <div className="topbar-drop-name">{user?.name || 'Người dùng'}</div>
                                    <div className="topbar-drop-email">{user?.email}</div>
                                </div>
                            </div>
                            <div className="topbar-drop-divider" />
                            <Link href="/achievements" className="topbar-drop-item" onClick={() => setOpen(false)}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg>
                                Thành tựu
                            </Link>
                            <Link href="/settings" className="topbar-drop-item" onClick={() => setOpen(false)}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                                Cài đặt
                            </Link>
                            <div className="topbar-drop-divider" />
                            <button className="topbar-drop-item danger" onClick={logout}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}