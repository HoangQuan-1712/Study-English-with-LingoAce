// PATH: src/components/Sidebar/index.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './Sidebar.css'

const NAV = [
    { href: '/', label: 'Trang chủ', icon: 'home' },
    { href: '/library', label: 'Thư viện', icon: 'library' },
    { href: '/sets', label: 'Thẻ ghi nhớ', icon: 'cards' },
    { href: '/progress', label: 'Tiến độ', icon: 'chart' },
]
const BOTTOM = [
    { href: '/notifications', label: 'Thông báo', icon: 'bell', badge: '5' },
]

const ICONS: Record<string, React.ReactNode> = {
    home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    library: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>,
    cards: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>,
}

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="sidebar">
            <Link href="/" className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <span className="sidebar-logo-text">Lingo<span>Ace</span></span>
            </Link>

            <nav className="sidebar-nav">
                <p className="sidebar-section">CHÍNH</p>
                {NAV.map(item => {
                    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    return (
                        <Link key={item.href} href={item.href} className={`sidebar-item ${active ? 'active' : ''}`}>
                            <span className="sidebar-icon">{ICONS[item.icon]}</span>
                            <span className="sidebar-label">{item.label}</span>
                        </Link>
                    )
                })}
                <p className="sidebar-section" style={{ marginTop: 20 }}>KHÁC</p>
                {BOTTOM.map(item => (
                    <Link key={item.href} href={item.href} className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}>
                        <span className="sidebar-icon">{ICONS[item.icon]}</span>
                        <span className="sidebar-label">{item.label}</span>
                        {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                    </Link>
                ))}
            </nav>
        </aside>
    )
}