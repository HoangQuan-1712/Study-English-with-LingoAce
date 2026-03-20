// PATH: src/app/notifications/page.tsx
'use client'
import { useState } from 'react'
import Topbar from '@/components/Topbar'

type Notif = {
    id: number; icon: string; title: string; desc: string
    time: string; unread: boolean; type: 'reminder' | 'system' | 'tip'
}

const INIT: Notif[] = [
    { id: 1, icon: '🔥', title: 'Streak 3 ngày!', desc: 'Bạn đã học 3 ngày liên tiếp. Tiếp tục duy trì nhé!', time: 'Vừa xong', unread: true, type: 'reminder' },
    { id: 2, icon: '📅', title: 'Nhắc nhở học hôm nay', desc: 'Bạn chưa học hôm nay. Chỉ cần 10 phút là đủ!', time: '2 giờ trước', unread: true, type: 'reminder' },
    { id: 3, icon: '🏆', title: 'Hoàn thành Quiz 100%!', desc: 'Xuất sắc! Bạn đã trả lời đúng tất cả trong bộ "Business English"', time: 'Hôm qua', unread: true, type: 'system' },
    { id: 4, icon: '💡', title: 'Mẹo học hiệu quả', desc: 'Thử dùng kỹ thuật Spaced Repetition để nhớ từ lâu hơn.', time: '2 ngày trước', unread: false, type: 'tip' },
    { id: 5, icon: '📚', title: 'Bộ thẻ gợi ý cho bạn', desc: '"IELTS Academic Vocabulary" — 570 từ vựng học thuật phổ biến.', time: '3 ngày trước', unread: false, type: 'tip' },
    { id: 6, icon: '✅', title: 'Bộ thẻ mới được tạo', desc: '"Phrasal Verbs Thông Dụng" đã được tạo thành công.', time: '5 ngày trước', unread: false, type: 'system' },
]

type Tab = 'all' | 'unread'

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState(INIT)
    const [tab, setTab] = useState<Tab>('all')

    const unreadCount = notifs.filter(n => n.unread).length
    const shown = tab === 'unread' ? notifs.filter(n => n.unread) : notifs

    const markRead = (id: number) =>
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
    const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))
    const dismiss = (id: number) => setNotifs(prev => prev.filter(n => n.id !== id))

    const typeColor: Record<Notif['type'], string> = {
        reminder: '#ffcd1f', system: '#23b26d', tip: '#8b5cf6'
    }

    return (
        <>
            <Topbar />
            <div className="page-body">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 2 }}>Thông báo</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>
                            {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button className="btn btn-ghost" style={{ height: 34, fontSize: 13 }} onClick={markAllRead}>
                            ✓ Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>

                {/* Tab bar */}
                <div style={{
                    display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: 4, width: 'fit-content', marginBottom: 20
                }}>
                    {(['all', 'unread'] as Tab[]).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            style={{
                                padding: '6px 18px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700,
                                background: tab === t ? 'var(--accent)' : 'none',
                                color: tab === t ? 'white' : 'var(--text-muted)',
                                border: 'none', cursor: 'pointer', transition: 'all var(--ease)'
                            }}>
                            {t === 'all' ? 'Tất cả' : `Chưa đọc${unreadCount ? ` (${unreadCount})` : ''}`}
                        </button>
                    ))}
                </div>

                {/* Empty */}
                {shown.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                        <p style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 15 }}>
                            {tab === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
                        </p>
                    </div>
                )}

                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680 }}>
                    {shown.map(n => (
                        <div key={n.id} onClick={() => markRead(n.id)}
                            style={{
                                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
                                background: n.unread ? '#fafbff' : 'var(--bg-card)',
                                border: `1.5px solid ${n.unread ? 'var(--accent-light)' : 'var(--border)'}`,
                                borderLeft: n.unread ? '3px solid var(--accent)' : '1.5px solid var(--border)',
                                borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                                transition: 'border-color var(--ease), background var(--ease)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = n.unread ? 'var(--accent)' : 'var(--border-strong)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = n.unread ? 'var(--accent-light)' : 'var(--border)'}
                        >
                            {/* Icon */}
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 18, flexShrink: 0,
                                background: typeColor[n.type] + '18', border: `1.5px solid ${typeColor[n.type]}30`
                            }}>
                                {n.icon}
                            </div>

                            {/* Body */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                                    {n.title}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 4 }}>
                                    {n.desc}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{n.time}</div>
                            </div>

                            {/* Right side */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                {n.unread && (
                                    <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%' }} />
                                )}
                                <button onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: '0 2px',
                                        borderRadius: 4, transition: 'color var(--ease)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}