'use client'
import { useState, useEffect } from 'react'
import Topbar from '@/components/Topbar'
import { api, type StudySession, type SessionStats } from '@/lib/api'

function fmt(sec: number) {
    if (sec < 60) return `${sec}s`
    if (sec < 3600) return `${Math.floor(sec / 60)}p ${sec % 60}s`
    return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}p`
}

function modeLabel(m: string) {
    return m === 'flashcard' ? '🃏 Thẻ' : m === 'quiz' ? '📝 Quiz' : '🧩 Ghép'
}
function modeColor(m: string) {
    return m === 'flashcard' ? '#4255ff' : m === 'quiz' ? '#23b26d' : '#ff9500'
}

const COLORS = ['#4255ff', '#ff4b4b', '#23b26d', '#ff9500', '#8b5cf6', '#0ea5e9']

export default function ProgressPage() {
    const [stats, setStats] = useState<SessionStats | null>(null)
    const [sessions, setSessions] = useState<StudySession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([api.getSessionStats(), api.getSessions()])
            .then(([s, ss]) => { setStats(s); setSessions(ss) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const calDays = stats ? Object.entries(stats.calendar) : []

    return (
        <>
            <Topbar />
            <div className="page-body">
                <h1 className="page-title" style={{ marginBottom: 4 }}>Tiến độ học tập</h1>
                <p className="page-subtitle" style={{ marginBottom: 28 }}>Theo dõi hành trình của bạn</p>

                {/* Stats row */}
                {!loading && stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 32 }}>
                        {[
                            { icon: '🔥', label: 'Streak', value: `${stats.streak} ngày`, color: '#ff9500' },
                            { icon: '📚', label: 'Phiên học', value: `${stats.totalSessions}`, color: '#4255ff' },
                            { icon: '🃏', label: 'Thẻ đã học', value: `${stats.totalStudied}`, color: '#23b26d' },
                            { icon: '⏱️', label: 'Thời gian', value: fmt(stats.totalTime), color: '#8b5cf6' },
                            { icon: '🎯', label: 'Điểm TB', value: `${stats.avgScore}%`, color: '#0ea5e9' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                                borderRadius: 'var(--radius-xl)', padding: '18px 20px'
                            }}>
                                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Streak Calendar */}
                {!loading && stats && (
                    <div style={{
                        background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: 24
                    }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            🗓️ Lịch học — 30 ngày qua
                        </h2>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                            Mỗi ô = 1 ngày. Màu đậm hơn = học nhiều hơn.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {calDays.map(([date, count]) => {
                                const intensity = count === 0 ? 0 : count === 1 ? 0.3 : count <= 3 ? 0.6 : 1
                                return (
                                    <div key={date} title={`${date}: ${count} phiên`}
                                        style={{
                                            width: 28, height: 28, borderRadius: 6, cursor: 'default',
                                            background: count === 0
                                                ? 'var(--border)'
                                                : `rgba(66,85,255,${intensity})`,
                                            transition: 'transform .1s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                )
                            })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ít</span>
                            {[0.15, 0.3, 0.6, 1].map(o => (
                                <div key={o} style={{ width: 16, height: 16, borderRadius: 4, background: `rgba(66,85,255,${o})` }} />
                            ))}
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nhiều</span>
                        </div>
                    </div>
                )}

                {/* Session history */}
                <div style={{
                    background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-xl)', overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '18px 24px', borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                            📋 Lịch sử phiên học
                        </h2>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sessions.length} phiên</span>
                    </div>

                    {loading && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
                    )}

                    {!loading && sessions.length === 0 && (
                        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                                Chưa có phiên học nào. Bắt đầu học để xem lịch sử!
                            </p>
                        </div>
                    )}

                    {!loading && sessions.map((s, i) => {
                        const pct = s.total > 0 ? Math.round(s.score / s.total * 100) : 0
                        const color = s.set?.color || COLORS[i % COLORS.length]
                        return (
                            <div key={s.id} style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 24px', borderBottom: '1px solid var(--border)',
                                transition: 'background var(--ease)'
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-page)'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                <div style={{ width: 4, height: 40, borderRadius: 99, background: color, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        {s.set?.title || 'Bộ thẻ không xác định'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {new Date(s.studiedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, padding: '3px 10px',
                                    background: modeColor(s.mode) + '18', color: modeColor(s.mode),
                                    borderRadius: 99
                                }}>
                                    {modeLabel(s.mode)}
                                </span>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{
                                        fontSize: 15, fontWeight: 800,
                                        color: pct >= 80 ? '#23b26d' : pct >= 50 ? '#ff9500' : '#ff4b4b'
                                    }}>
                                        {pct}%
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.score}/{s.total}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                                    {fmt(s.duration)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}