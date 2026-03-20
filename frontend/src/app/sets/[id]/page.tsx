'use client'
// PATH: src/app/sets/[id]/page.tsx
import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, type StudySet } from '@/lib/api'
import { auth } from '@/lib/auth'
import Topbar from '@/components/Topbar'
import './page.css'

const STUDY_MODES = [
    { key: 'flashcards', label: 'Thẻ ghi nhớ', icon: '🃏', desc: 'Lật thẻ, theo dõi tiến độ' },
    { key: 'learn', label: 'Học', icon: '🎓', desc: 'Trắc nghiệm + tự gõ' },
    { key: 'quiz', label: 'Kiểm tra', icon: '📝', desc: 'Bài kiểm tra đa dạng' },
    { key: 'match', label: 'Ghép thẻ', icon: '🧩', desc: 'Ghép từ với định nghĩa' },
]

function speak(text: string) {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9
    window.speechSynthesis.speak(u)
}

function MiniFlashcard({ set }: { set: StudySet }) {
    const cards = set.cards || []
    const [idx, setIdx] = useState(0)
    const [flipped, setFlip] = useState(false)
    const [shuffled, setShuffled] = useState(false)
    const [queue, setQueue] = useState(cards)
    const [known, setKnown] = useState<Set<number>>(new Set())
    const [track, setTrack] = useState(false)

    const cur = queue[idx]

    const shuffle = () => {
        setShuffled(s => !s)
        if (!shuffled) setQueue([...cards].sort(() => Math.random() - .5))
        else setQueue([...cards])
        setIdx(0); setFlip(false)
    }

    useEffect(() => { if (cur) speak(cur.term) }, [idx])

    if (!cur) return null
    return (
        <div className="mini-fc">
            <div className={`mini-fc-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlip(f => !f)}>
                <div className="mini-fc-inner">
                    <div className="mini-fc-front">
                        <p className="mini-fc-term">{cur.term}</p>
                        {cur.pronunciation && <p className="mini-fc-pron">{cur.pronunciation}</p>}
                        <span className="mini-fc-hint">Nhấn để lật</span>
                    </div>
                    <div className="mini-fc-back">
                        <p className="mini-fc-def">{cur.definition}</p>
                        <span className="mini-fc-hint">Nhấn để xem thuật ngữ</span>
                    </div>
                </div>
            </div>

            {/* Bottom controls */}
            <div className="mini-fc-bottom">
                <div className="mini-fc-left">
                    <button
                        className={`mini-track-btn ${track ? 'on' : ''}`}
                        onClick={() => { setTrack(t => !t); setKnown(new Set()); setIdx(0); setFlip(false) }}>
                        📊 {track ? 'Tắt theo dõi' : 'Theo dõi tiến độ'}
                    </button>
                </div>

                <div className="mini-fc-center">
                    {track ? (
                        <div className="mini-fc-track-info">
                            <span className="mini-red">✗ {queue.length - idx} chưa học</span>
                            <span className="mini-counter">{idx + 1}/{queue.length}</span>
                            <span className="mini-green">✓ {known.size} đã biết</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button className="mini-nav" onClick={() => { setFlip(false); setTimeout(() => setIdx(i => Math.max(i - 1, 0)), 100) }} disabled={idx === 0}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            <span className="mini-counter">{idx + 1}/{queue.length}</span>
                            <button className="mini-nav" onClick={() => { setFlip(false); setTimeout(() => setIdx(i => Math.min(i + 1, queue.length - 1)), 100) }} disabled={idx === queue.length - 1}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                <div className="mini-fc-right">
                    <button className={`mini-shuffle-btn ${shuffled ? 'on' : ''}`} onClick={shuffle}>
                        🔀 {shuffled ? 'Đang xáo' : 'Xáo thẻ'}
                    </button>
                </div>
            </div>

            {/* Track mode buttons */}
            {track && (
                <div className="mini-fc-track-btns">
                    <button className="mini-skip-btn" onClick={() => { setFlip(false); setTimeout(() => { if (idx + 1 >= queue.length) { const rem = queue.filter(c => !known.has(c.id)); setQueue(rem.length ? rem : [...cards]); setIdx(0); } else setIdx(i => i + 1) }, 100) }}>
                        ✗ Chưa biết
                    </button>
                    <button className="mini-know-btn" onClick={() => {
                        const nk = new Set(known); nk.add(cur.id); setKnown(nk)
                        setFlip(false)
                        setTimeout(() => { if (idx + 1 >= queue.length) { const rem = queue.filter(c => !nk.has(c.id)); setQueue(rem.length ? rem : [...cards]); setIdx(0); } else setIdx(i => i + 1) }, 100)
                    }}>
                        ✓ Đã biết
                    </button>
                </div>
            )}
        </div>
    )
}

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [set, setSet] = useState<StudySet | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDel] = useState(false)

    useEffect(() => {
        api.getSet(id).then(s => { setSet(s); setLoading(false) }).catch(() => setLoading(false))
    }, [id])

    const handleDelete = async () => {
        if (!confirm('Xoá bộ thẻ này?')) return
        setDel(true)
        await api.deleteSet(id)
        router.push('/library')
    }

    if (loading) return (
        <>
            <Topbar />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ fontSize: 28, animation: 'spin .8s linear infinite', color: 'var(--accent)' }}>⟳</div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </>
    )

    if (!set) return (
        <>
            <Topbar />
            <div className="page-body" style={{ textAlign: 'center', paddingTop: 60 }}>
                <p style={{ fontSize: 40 }}>😕</p>
                <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>Không tìm thấy bộ thẻ</p>
                <Link href="/library"><button className="btn btn-ghost">← Thư viện</button></Link>
            </div>
        </>
    )

    const cards = set.cards || []

    return (
        <>
            <Topbar />
            <div className="set-detail-page">
                {/* Header */}
                <div className="set-detail-header">
                    <div className="set-detail-breadcrumb">
                        <Link href="/library">Thư viện</Link>
                        <span>›</span>
                        <span>{set.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/sets/${id}/edit`}><button className="btn btn-ghost" style={{ height: 34, fontSize: 13 }}>✏️ Chỉnh sửa</button></Link>
                        <button className="btn btn-ghost" style={{ height: 34, fontSize: 13, color: 'var(--danger)' }}
                            onClick={handleDelete} disabled={deleting}>🗑️</button>
                    </div>
                </div>

                {/* Title */}
                <div className="set-detail-title-row">
                    <div className="set-detail-color" style={{ background: set.color || '#4255ff' }} />
                    <div>
                        <h1 className="set-detail-title">{set.title}</h1>
                        {set.description && <p className="set-detail-desc">{set.description}</p>}
                        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🃏 {cards.length} thuật ngữ</span>
                        </div>
                    </div>
                </div>

                {/* Study modes */}
                <div className="set-study-grid">
                    {STUDY_MODES.map(m => (
                        <button key={m.key} className="set-study-btn" onClick={() => router.push(`/sets/${id}/${m.key}`)}>
                            <span className="set-study-icon">{m.icon}</span>
                            <span className="set-study-label">{m.label}</span>
                            <span className="set-study-desc">{m.desc}</span>
                        </button>
                    ))}
                </div>

                {/* Mini flashcard */}
                <MiniFlashcard set={set} />

                {/* Author */}
                <div className="set-author-row">
                    <div className="set-author-avatar">B</div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Tác giả</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bạn</div>
                    </div>
                </div>

                {/* Cards list */}
                <div className="set-terms-section">
                    <h3 className="set-terms-title">Thuật ngữ trong học phần ({cards.length})</h3>
                    <div className="set-terms-grid">
                        {cards.map((card, i) => (
                            <div key={card.id} className="set-term-row">
                                <div className="set-term-num">{i + 1}</div>
                                <div className="set-term-content">
                                    <div className="set-term-front">
                                        <span className="set-term-word">{card.term}</span>
                                        {card.pronunciation && <span className="set-term-pron">{card.pronunciation}</span>}
                                    </div>
                                    <div className="set-term-back">{card.definition}</div>
                                </div>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
                                    onClick={() => speak(card.term)}>🔊</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}