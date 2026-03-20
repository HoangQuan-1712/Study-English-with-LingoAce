'use client'
import { useState, useMemo } from 'react'
import Topbar from '@/components/Topbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSets } from '@/hooks/useSets'
import { api } from '@/lib/api'

const COLORS = ['#4255ff', '#ff4b4b', '#23b26d', '#ff9500', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6']
type Sort = 'recent' | 'az' | 'za' | 'size'

export default function LibraryPage() {
    const { sets, loading, error, reload, removeSet } = useSets(1)
    const router = useRouter()
    const [q, setQ] = useState('')
    const [sort, setSort] = useState<Sort>('recent')
    const [deleting, setDeleting] = useState<number | null>(null)

    const filtered = useMemo(() => {
        let result = [...sets]
        if (q.trim()) {
            const lq = q.toLowerCase()
            result = result.filter(s =>
                s.title.toLowerCase().includes(lq) ||
                s.description?.toLowerCase().includes(lq) ||
                s.cards.some(c => c.term.toLowerCase().includes(lq))
            )
        }
        if (sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title))
        if (sort === 'za') result.sort((a, b) => b.title.localeCompare(a.title))
        if (sort === 'size') result.sort((a, b) => b.cards.length - a.cards.length)
        return result
    }, [sets, q, sort])

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        if (!confirm('Xoá bộ thẻ này?')) return
        setDeleting(id)
        try { await api.deleteSet(id); removeSet(id) }
        catch { alert('Xoá thất bại!') }
        finally { setDeleting(null) }
    }

    return (
        <>
            <Topbar />
            <div className="page-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 2 }}>Thư viện</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>
                            {loading ? 'Đang tải...' : `${sets.length} bộ thẻ của bạn`}
                        </p>
                    </div>
                    <Link href="/create">
                        <button className="btn btn-primary">+ Tạo mới</button>
                    </Link>
                </div>

                {/* Filter */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        </span>
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm bộ thẻ..."
                            style={{
                                width: '100%', height: 38, paddingLeft: 36, paddingRight: 12, background: 'var(--bg-card)',
                                border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', fontSize: 14,
                                outline: 'none', color: 'var(--text-primary)'
                            }} />
                    </div>
                    <select value={sort} onChange={e => setSort(e.target.value as Sort)}
                        style={{
                            height: 38, padding: '0 32px 0 14px', background: 'var(--bg-card)',
                            border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', fontSize: 13,
                            fontWeight: 600, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
                            appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23939bb4' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
                        }}>
                        <option value="recent">Mới nhất</option>
                        <option value="az">A → Z</option>
                        <option value="za">Z → A</option>
                        <option value="size">Nhiều thẻ nhất</option>
                    </select>
                </div>

                {error && (
                    <div style={{
                        background: '#fff8f0', border: '1.5px solid #fed7aa', borderRadius: 'var(--radius-lg)',
                        padding: '14px 18px', marginBottom: 20, fontSize: 14, color: '#c2410c', display: 'flex', gap: 10, alignItems: 'center'
                    }}>
                        ⚠️ {error}
                        <button className="btn btn-ghost" style={{ height: 28, fontSize: 12, marginLeft: 'auto' }} onClick={reload}>Thử lại</button>
                    </div>
                )}

                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                                background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                                borderRadius: 'var(--radius-xl)', padding: 20, height: 120
                            }}>
                                <div style={{ height: 3, background: '#eef0f8', borderRadius: 99, marginBottom: 14 }} />
                                <div style={{ height: 16, width: '60%', background: '#eef0f8', borderRadius: 6, marginBottom: 8 }} />
                                <div style={{ height: 12, width: '35%', background: '#eef0f8', borderRadius: 6 }} />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filtered.length === 0 && !error && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>{q ? '🔍' : '📭'}</div>
                        <p style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 16, marginBottom: 6 }}>
                            {q ? `Không tìm thấy "${q}"` : 'Chưa có bộ thẻ nào'}
                        </p>
                        {!q && <Link href="/create"><button className="btn btn-primary" style={{ marginTop: 16 }}>Tạo bộ thẻ đầu tiên</button></Link>}
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
                        {filtered.map((set, i) => {
                            const color = set.color || COLORS[i % COLORS.length]
                            return (
                                // Dùng div + onClick thay vì Link để tránh <a> lồng <a>
                                <div key={set.id}
                                    onClick={() => router.push(`/sets/${set.id}`)}
                                    style={{
                                        background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                                        borderRadius: 'var(--radius-xl)', padding: 20, cursor: 'pointer',
                                        opacity: deleting === set.id ? .5 : 1,
                                        pointerEvents: deleting === set.id ? 'none' : 'auto',
                                        transition: 'transform var(--ease), box-shadow var(--ease)'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                                >
                                    <div style={{ height: 3, background: color, borderRadius: 99, marginBottom: 14 }} />
                                    <div style={{
                                        fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                                        marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        {set.title}
                                    </div>
                                    {set.description && (
                                        <div style={{
                                            fontSize: 12, color: 'var(--text-muted)', marginBottom: 8,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>
                                            {set.description}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 14 }}>
                                        🃏 {set.cards.length} thuật ngữ
                                    </div>
                                    {/* Buttons - dùng button + onClick, không dùng Link để tránh nested <a> */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={e => { e.stopPropagation(); router.push(`/sets/${set.id}/flashcards`) }}
                                            style={{
                                                flex: 1, padding: '6px 0', background: 'var(--accent-light)', color: 'var(--accent)',
                                                borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer'
                                            }}>
                                            Thẻ ghi nhớ
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); router.push(`/sets/${set.id}/quiz`) }}
                                            style={{
                                                flex: 1, padding: '6px 0', background: 'var(--bg-page)', color: 'var(--text-secondary)',
                                                borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer'
                                            }}>
                                            Kiểm tra
                                        </button>
                                        <button onClick={e => handleDelete(e, set.id)}
                                            style={{
                                                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer', fontSize: 14, transition: 'all var(--ease)'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.borderColor = '#fca5a5' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}