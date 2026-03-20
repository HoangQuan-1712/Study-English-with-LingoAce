// PATH: src/components/FlashcardViewer/index.tsx
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, type Card } from '@/lib/api'
import StudyTopbar from '@/components/StudyTopbar'
import { appSettings } from '@/lib/settings'
import './FlashcardViewer.css'

interface Props { cards: Card[]; setId: string; setTitle: string }

function speak(text: string) {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.9
    window.speechSynthesis.speak(u)
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - .5) }

// Settings panel
function FCSettings({ frontLang, onFrontLang, showShortcuts, onShortcuts, autoPlay, onAutoPlay, onClose }:
    { frontLang: 'en' | 'vi'; onFrontLang: (v: 'en' | 'vi') => void; showShortcuts: boolean; onShortcuts: (v: boolean) => void; autoPlay: boolean; onAutoPlay: (v: boolean) => void; onClose: () => void }) {
    return (
        <div className="fc-settings-overlay" onClick={onClose}>
            <div className="fc-settings-panel" onClick={e => e.stopPropagation()}>
                <div className="fc-settings-header">
                    <h3>Tùy chọn thẻ ghi nhớ</h3>
                    <button onClick={onClose}>✕</button>
                </div>
                <div className="fc-settings-row">
                    <div>
                        <div className="fc-settings-label">Mặt trước</div>
                        <div className="fc-settings-desc">Ngôn ngữ hiển thị khi bắt đầu</div>
                    </div>
                    <div className="fc-lang-toggle">
                        <button className={frontLang === 'en' ? 'active' : ''} onClick={() => onFrontLang('en')}>Tiếng Anh</button>
                        <button className={frontLang === 'vi' ? 'active' : ''} onClick={() => onFrontLang('vi')}>Tiếng Việt</button>
                    </div>
                </div>
                <div className="fc-settings-row">
                    <div>
                        <div className="fc-settings-label">Tự phát âm</div>
                        <div className="fc-settings-desc">Đọc thuật ngữ khi sang thẻ mới</div>
                    </div>
                    <label className="fc-toggle">
                        <input type="checkbox" checked={autoPlay} onChange={e => onAutoPlay(e.target.checked)} />
                        <span className="fc-toggle-track"><span className="fc-toggle-thumb" /></span>
                    </label>
                </div>
                <div className="fc-settings-row">
                    <div>
                        <div className="fc-settings-label">Hiện phím tắt</div>
                    </div>
                    <label className="fc-toggle">
                        <input type="checkbox" checked={showShortcuts} onChange={e => onShortcuts(e.target.checked)} />
                        <span className="fc-toggle-track"><span className="fc-toggle-thumb" /></span>
                    </label>
                </div>
                {showShortcuts && (
                    <div className="fc-shortcuts-list">
                        <div className="fc-shortcut-item"><kbd>Space</kbd> Lật thẻ</div>
                        <div className="fc-shortcut-item"><kbd>→</kbd> / <kbd>K</kbd> Đã biết</div>
                        <div className="fc-shortcut-item"><kbd>←</kbd> / <kbd>J</kbd> Chưa biết / Tiếp</div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Round-done screen (màn hình sau khi hết lượt)
function RoundDoneScreen({ known, total, unknownCount, round, setId, onContinueTrack, onStudyQuiz, onReset }:
    { known: number; total: number; unknownCount: number; round: number; setId: string; onContinueTrack: () => void; onStudyQuiz: () => void; onReset: () => void }) {
    const [countdown, setCountdown] = useState(5)
    const router = useRouter()

    useEffect(() => {
        const t = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(t); router.push(`/sets/${setId}/learn`); return 0 }
                return c - 1
            })
        }, 1000)
        return () => clearInterval(t)
    }, [setId, router])

    const pct = Math.round((known / total) * 100)

    return (
        <div className="fc-round-done">
            <div className="fc-round-done-card">
                <div className="fc-round-done-ring">
                    <svg viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                        <circle cx="60" cy="60" r="50" fill="none" stroke={pct === 100 ? '#16a34a' : 'var(--accent)'} strokeWidth="10"
                            strokeDasharray={`${pct * 3.14} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                    </svg>
                    <span>{pct}%</span>
                </div>
                <h2>{pct === 100 ? 'Rất ấn tượng! 🎉' : 'Chỉ còn một chút nữa thôi!'}</h2>
                <div className="fc-round-done-progress">
                    <div className="fc-progress-bar-row"><span className="fc-prog-label known">Đã biết</span><div className="fc-prog-track"><div className="fc-prog-fill known-fill" style={{ width: `${pct}%` }} /></div><span>{known}</span></div>
                    {unknownCount > 0 && <div className="fc-progress-bar-row"><span className="fc-prog-label learning">Đang học</span><div className="fc-prog-track"><div className="fc-prog-fill learning-fill" style={{ width: `${(unknownCount / total) * 100}%` }} /></div><span>{unknownCount}</span></div>}
                    <div className="fc-progress-bar-row"><span className="fc-prog-label">Còn lại</span><div className="fc-prog-track" /><span>0</span></div>
                </div>
                <div className="fc-round-done-next">
                    <div className="fc-round-done-hint">Bước tiếp theo</div>
                    <button className="fc-round-done-primary" onClick={onStudyQuiz}>
                        <div className="fc-countdown-circle">
                            <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="3" /><circle cx="18" cy="18" r="15" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${(countdown / 5) * 94.2} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" /></svg>
                            <span>{countdown}</span>
                        </div>
                        Ôn luyện với các câu hỏi
                    </button>
                    {unknownCount > 0 && (
                        <button className="fc-round-done-secondary" onClick={onContinueTrack}>
                            Tập trung vào học {unknownCount} thẻ
                        </button>
                    )}
                    <button className="fc-round-done-ghost" onClick={onReset}>
                        Đặt lại thẻ ghi nhớ
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function FlashcardViewer({ cards: allCards, setId, setTitle }: Props) {
    const [frontLang, setFrontLang] = useState<'en' | 'vi'>('en')
    const [autoPlay, setAutoPlay] = useState(() => appSettings.get().autoPlay)
    const [showShortcuts, setShowShortcuts] = useState(() => appSettings.get().showShortcuts)
    const [showSettings, setShowSettings] = useState(false)
    const [shuffled, setShuffled] = useState(false)
    const [trackMode, setTrackMode] = useState(false)
    const [roundDone, setRoundDone] = useState(false)

    const [queue, setQueue] = useState<Card[]>(() => appSettings.get().shuffle ? [...allCards].sort(() => Math.random() - .5) : [...allCards])
    const [index, setIndex] = useState(0)
    const [flipped, setFlip] = useState(false)
    const [known, setKnown] = useState<Set<number>>(new Set())
    const [unknown, setUnknown] = useState<Set<number>>(new Set())
    const [round, setRound] = useState(1)
    const [autoplayRunning, setAutoplayRunning] = useState(false)
    const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startRef = useRef(Date.now())

    const cur = queue[index]

    const getDisplayCard = useCallback(() => {
        if (!cur) return { front: '', back: '', pron: '' }
        return frontLang === 'en'
            ? { front: cur.term, back: cur.definition, pron: cur.pronunciation || '' }
            : { front: cur.definition, back: cur.term, pron: '' }
    }, [cur, frontLang])

    // Auto-speak
    useEffect(() => {
        if (cur && autoPlay) speak(frontLang === 'en' ? cur.term : cur.definition)
    }, [index, cur, autoPlay, frontLang])

    // Autoplay
    useEffect(() => {
        if (autoplayRunning && !trackMode) {
            autoRef.current = setInterval(() => {
                setFlip(f => {
                    if (!f) return true
                    setIndex(i => { if (i + 1 >= queue.length) { setAutoplayRunning(false); return i } return i + 1 })
                    return false
                })
            }, 2500)
        }
        return () => { if (autoRef.current) clearInterval(autoRef.current) }
    }, [autoplayRunning, trackMode, queue.length])

    const goNext = useCallback(() => {
        setFlip(false)
        setTimeout(() => {
            if (index + 1 >= queue.length) {
                // Hết lượt - ra màn hình kết thúc
                const dur = Math.floor((Date.now() - startRef.current) / 1000)
                api.saveSession({ setId: Number(setId), mode: 'flashcard', score: known.size, total: allCards.length, duration: dur }).catch(() => { })
                setRoundDone(true)
            } else {
                setIndex(i => i + 1)
            }
        }, 150)
    }, [index, queue.length, known, setId, allCards.length])

    const goPrev = useCallback(() => {
        setFlip(false)
        setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150)
    }, [])

    const markKnown = useCallback(() => {
        if (!cur) return
        const nk = new Set(known); nk.add(cur.id); setKnown(nk)
        const nu = new Set(unknown); nu.delete(cur.id); setUnknown(nu)
        setFlip(false)
        setTimeout(() => {
            const ni = index + 1
            if (ni >= queue.length) {
                const stillUnknown = queue.filter(c => !nk.has(c.id))
                if (stillUnknown.length === 0) {
                    // All known!
                    const dur = Math.floor((Date.now() - startRef.current) / 1000)
                    api.saveSession({ setId: Number(setId), mode: 'flashcard', score: nk.size, total: allCards.length, duration: dur }).catch(() => { })
                    setRoundDone(true)
                } else {
                    setQueue(stillUnknown); setIndex(0); setRound(r => r + 1)
                }
            } else setIndex(ni)
        }, 150)
    }, [cur, known, unknown, index, queue, setId, allCards.length])

    const markUnknown = useCallback(() => {
        if (!cur) return
        const nu = new Set(unknown); nu.add(cur.id); setUnknown(nu)
        setFlip(false)
        setTimeout(() => {
            const ni = index + 1
            if (ni >= queue.length) {
                const stillUnknown = queue.filter(c => !known.has(c.id))
                if (stillUnknown.length === 0) setRoundDone(true)
                else { setQueue(stillUnknown); setIndex(0); setRound(r => r + 1) }
            } else setIndex(ni)
        }, 150)
    }, [cur, unknown, known, index, queue])

    const toggleShuffle = () => {
        const ns = !shuffled
        setShuffled(ns)
        setQueue(ns ? shuffle([...allCards]) : [...allCards])
        setIndex(0); setFlip(false)
    }

    const resetAll = () => {
        setQueue(appSettings.get().shuffle ? [...allCards].sort(() => Math.random() - .5) : [...allCards]); setIndex(0); setFlip(false)
        setKnown(new Set()); setUnknown(new Set()); setRound(1)
        setRoundDone(false); startRef.current = Date.now()
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (showSettings) return
            if (e.key === ' ') { e.preventDefault(); setFlip(f => !f) }
            if (trackMode) {
                if (e.key === 'ArrowRight' || e.key === 'k' || e.key === 'K') markKnown()
                if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') markUnknown()
            } else {
                if (e.key === 'ArrowRight') goNext()
                if (e.key === 'ArrowLeft') goPrev()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [showSettings, trackMode, markKnown, markUnknown, goNext, goPrev])

    const { front, back, pron } = getDisplayCard()
    const knownCount = known.size
    const unknownCount = allCards.length - known.size  // thẻ chưa được mark là biết
    const pct = trackMode ? (knownCount / allCards.length) * 100 : ((index + 1) / queue.length) * 100

    // Round done screen
    if (roundDone) return (
        <div className="fc-fullscreen">
            <StudyTopbar mode="flashcards" setId={setId} setTitle={setTitle} />
            <RoundDoneScreen
                known={knownCount} total={allCards.length}
                unknownCount={unknownCount}
                round={round} setId={setId}
                onContinueTrack={() => {
                    const rem = allCards.filter(c => !known.has(c.id))
                    if (rem.length > 0) {
                        setRoundDone(false); setQueue(rem); setIndex(0); setRound(r => r + 1)
                    } else {
                        // Đã học hết - reset toàn bộ
                        setRoundDone(false); setQueue([...allCards]); setIndex(0)
                        setKnown(new Set()); setUnknown(new Set()); setRound(1)
                    }
                }}
                onStudyQuiz={() => window.location.href = `/sets/${setId}/learn`}
                onReset={resetAll}
            />
        </div>
    )

    return (
        <div className="fc-fullscreen">
            {/* StudyTopbar */}
            <StudyTopbar
                mode="flashcards" setId={setId} setTitle={setTitle}
                onSettingsClick={() => setShowSettings(true)}
                extra={
                    <button className="study-topbar-icon-btn" onClick={() => speak(front)} title="Phát âm">🔊</button>
                }
            />

            {/* Settings overlay */}
            {showSettings && (
                <FCSettings
                    frontLang={frontLang} onFrontLang={setFrontLang}
                    showShortcuts={showShortcuts} onShortcuts={setShowShortcuts}
                    autoPlay={autoPlay} onAutoPlay={setAutoPlay}
                    onClose={() => setShowSettings(false)}
                />
            )}

            {/* Progress bar */}
            <div className="fc-topbar-prog">
                <div className="fc-topbar-prog-fill" style={{ width: `${pct}%`, background: trackMode ? '#16a34a' : 'var(--accent)' }} />
            </div>

            {/* Main content */}
            <div className="fc-content">
                {/* Top stats (track mode) */}
                {trackMode && (
                    <div className="fc-track-stats">
                        <span className="fc-stat-badge red">✗ {unknownCount} chưa học</span>
                        <span className="fc-stat-badge neutral">{index + 1}/{queue.length} · Vòng {round}</span>
                        <span className="fc-stat-badge green">✓ {knownCount} đã biết</span>
                    </div>
                )}

                {/* Card */}
                <div className={`fc-card-wrap ${flipped ? 'flipped' : ''}`} onClick={() => setFlip(f => !f)}>
                    <div className="fc-card-inner">
                        <div className="fc-card-face fc-front">
                            <span className="fc-card-label">{frontLang === 'en' ? 'THUẬT NGỮ' : 'ĐỊNH NGHĨA'}</span>
                            <p className="fc-card-text">{front}</p>
                            {pron && <p className="fc-card-pron">{pron}</p>}
                            <span className="fc-card-hint">Nhấn hoặc Space để lật thẻ</span>
                        </div>
                        <div className="fc-card-face fc-back">
                            <span className="fc-card-label" style={{ color: 'var(--accent)' }}>{frontLang === 'en' ? 'ĐỊNH NGHĨA' : 'THUẬT NGỮ'}</span>
                            <p className="fc-card-text">{back}</p>
                            <span className="fc-card-hint">Nhấn lại để xem mặt trước</span>
                        </div>
                    </div>
                </div>

                {/* Bottom controls */}
                <div className="fc-bottom-area">
                    {/* Left: track toggle */}
                    <div className="fc-bottom-left">
                        <button className={`fc-toggle-track-btn ${trackMode ? 'on' : ''}`}
                            onClick={() => { setTrackMode(t => !t); resetAll() }}>
                            <span className="fc-toggle-track-switch"><span /></span>
                            📊 Theo dõi tiến độ
                        </button>
                    </div>

                    {/* Center: nav or track buttons */}
                    <div className="fc-bottom-center">
                        {trackMode ? (
                            <div className="fc-track-btns">
                                <button className="fc-btn-skip" onClick={markUnknown}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    Chưa biết
                                </button>
                                <span className="fc-nav-counter">{index + 1} / {queue.length}</span>
                                <button className="fc-btn-know" onClick={markKnown}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Đã biết
                                </button>
                            </div>
                        ) : (
                            <div className="fc-nav-row">
                                <button className="fc-nav-btn" onClick={goPrev} disabled={index === 0}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                                </button>
                                <span className="fc-nav-counter">{index + 1} / {queue.length}</span>
                                <button className="fc-nav-btn" onClick={goNext} disabled={index === queue.length - 1}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: shuffle */}
                    <div className="fc-bottom-right">
                        <button className={`fc-shuffle-btn ${shuffled ? 'on' : ''}`} onClick={toggleShuffle}>
                            🔀 {shuffled ? 'Đang xáo' : 'Xáo thẻ'}
                        </button>
                    </div>
                </div>

                {/* Shortcuts hint */}
                {showShortcuts && (
                    <p className="fc-shortcuts-hint">
                        {trackMode
                            ? <><kbd>Space</kbd> lật · <kbd>K</kbd> biết · <kbd>J</kbd> chưa</>
                            : <><kbd>Space</kbd> lật · <kbd>←</kbd><kbd>→</kbd> chuyển</>
                        }
                    </p>
                )}
            </div>
        </div>
    )
}