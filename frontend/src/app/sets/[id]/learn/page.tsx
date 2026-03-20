'use client'
// PATH: src/app/sets/[id]/learn/page.tsx
import { use, useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSet } from '@/hooks/useSets'
import { api, type Card } from '@/lib/api'
import StudyTopbar from '@/components/StudyTopbar'
import './learn.css'

// ─── Helpers ─────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - .5) }

function stripMeta(s: string): string {
    return s.replace(/\/[^/]+\//g, '').replace(/^\s*[a-z]+\.\s+/gi, '').replace(/\([^)]+\)/g, '').replace(/\s+/g, ' ').trim()
}
function checkVi(user: string, correct: string): boolean {
    const norm = (s: string) => stripMeta(s).toLowerCase().replace(/\s*[,;]\s*/g, ',').trim()
    const u = norm(user); const c = norm(correct)
    if (!u) return false; if (u === c) return true
    return c.split(',').map(m => m.trim()).some(m => m === u)
}
function checkEn(user: string, correct: string): boolean {
    return stripMeta(user.trim()).toLowerCase() === stripMeta(correct).toLowerCase()
}
function speakWord(text: string) {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.9
    window.speechSynthesis.speak(u)
}

// ─── Settings ───────────────────────────────────────────────
interface LearnSettings { mcOn: boolean; typeOn: boolean; fcOn: boolean; langEn: boolean; langVi: boolean }

// ─── SRS types ──────────────────────────────────────────────
type CardStatus = 'new' | 'learning' | 'known'
type QType = 'mc' | 'type' | 'voice_mc'
interface LearningCard { card: Card; status: CardStatus; consecutiveCorrect: number; wrongCount: number }
interface Step { lc: LearningCard; type: QType; reverse: boolean; options?: string[] }

function pickQType(lc: LearningCard, s: LearnSettings, idx: number): { type: QType; reverse: boolean } {
    if (lc.wrongCount >= 2 && s.typeOn) return { type: 'type', reverse: false }
    if (s.mcOn && idx % 5 === 4) return { type: 'voice_mc', reverse: false }
    if (s.mcOn && s.langEn && s.langVi && idx % 3 === 2) return { type: 'mc', reverse: true }
    if (s.typeOn && idx % 4 === 3) return { type: 'type', reverse: false }
    return s.mcOn ? { type: 'mc', reverse: false } : { type: 'type', reverse: false }
}

function makeStep(lc: LearningCard, allDefs: string[], allTerms: string[], qType: QType, reverse: boolean): Step {
    if (qType === 'mc' || qType === 'voice_mc') {
        const correct = reverse ? lc.card.term : lc.card.definition
        const pool = (reverse ? allTerms : allDefs).filter(x => x !== correct)
        return { lc, type: qType, reverse, options: shuffle([correct, ...shuffle(pool).slice(0, 3)]) }
    }
    return { lc, type: qType, reverse }
}

// ─── Example sentence fetch ──────────────────────────────────
// Client-side cache + pending dedup — chỉ gọi 1 lần dù StrictMode double-invoke
const exampleCache: Map<string, { en: string; vi: string } | null> = new Map()
const examplePending: Map<string, Promise<{ en: string; vi: string } | null>> = new Map()

async function fetchExample(term: string, definition: string): Promise<{ en: string; vi: string } | null> {
    const key = term.toLowerCase().trim()

    // Có cache → trả ngay (kể cả null = đã fail)
    if (exampleCache.has(key)) return exampleCache.get(key)!

    // Đang có request pending cho từ này → đợi, không gọi thêm
    if (examplePending.has(key)) return examplePending.get(key)!

    // Tạo promise, lưu vào pending
    const promise = fetch('/api/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition })
    }).then(async res => {
        const result = res.ok ? await res.json().then(d => (d.en && d.vi ? d : null)) : null
        exampleCache.set(key, result)
        return result
    }).catch(() => {
        exampleCache.set(key, null)
        return null
    }).finally(() => examplePending.delete(key))

    examplePending.set(key, promise)
    return promise
}

// ─── Settings Panel ──────────────────────────────────────────
function SettingsPanel({ s, onChange, onClose }: {
    s: LearnSettings; onChange: (k: keyof LearnSettings, v: boolean) => void; onClose: () => void
}) {
    return (
        <div className="learn-settings-overlay" onClick={onClose}>
            <div className="learn-settings-panel" onClick={e => e.stopPropagation()}>
                <div className="learn-settings-header"><h3>Tùy chọn học</h3><button onClick={onClose}>✕</button></div>
                <div className="learn-settings-section">Loại câu hỏi</div>
                <div className="learn-settings-row"><div><div className="learn-settings-label">Trắc nghiệm</div></div>
                    <input type="checkbox" checked={s.mcOn} onChange={e => { if (!e.target.checked && !s.typeOn) return; onChange('mcOn', e.target.checked) }} /></div>
                <div className="learn-settings-row"><div><div className="learn-settings-label">Tự luận (gõ đáp án)</div></div>
                    <input type="checkbox" checked={s.typeOn} onChange={e => { if (!e.target.checked && !s.mcOn) return; onChange('typeOn', e.target.checked) }} /></div>
                <div className="learn-settings-row"><div><div className="learn-settings-label">Thẻ ghi nhớ</div><div className="learn-settings-desc">Sắp có</div></div>
                    <input type="checkbox" checked={false} disabled /></div>
                <div className="learn-settings-section">Trả lời bằng</div>
                <div className="learn-settings-row"><div><div className="learn-settings-label">🇬🇧 Tiếng Anh</div></div>
                    <input type="checkbox" checked={s.langEn} onChange={e => { if (!e.target.checked && !s.langVi) return; onChange('langEn', e.target.checked) }} /></div>
                <div className="learn-settings-row"><div><div className="learn-settings-label">🇻🇳 Tiếng Việt</div></div>
                    <input type="checkbox" checked={s.langVi} onChange={e => { if (!e.target.checked && !s.langEn) return; onChange('langVi', e.target.checked) }} /></div>
                <div className="learn-settings-section">Nâng cao</div>
                <div className="learn-settings-row disabled"><div><div className="learn-settings-label">Chế độ viết</div><div className="learn-settings-desc">Sắp có</div></div><input type="checkbox" disabled /></div>
                <div className="learn-settings-row disabled"><div><div className="learn-settings-label">Chế độ chính tả</div><div className="learn-settings-desc">Sắp có</div></div><input type="checkbox" disabled /></div>
            </div>
        </div>
    )
}

// ─── CorrectFeedback ─────────────────────────────────────────
// Chỉ advance đúng 1 lần duy nhất. Dùng advancedRef để guard.
function CorrectFeedback({ card, showExample, onNext }: {
    card: Card; showExample: boolean; onNext: () => void
}) {
    const [example, setExample] = useState<{ en: string; vi: string } | null>(null)
    const [loadingEx, setLoadingEx] = useState(false)
    // Guard: chỉ cho advance 1 lần
    const advancedRef = useRef(false)
    // Snapshot onNext tại thời điểm mount - KHÔNG update sau đó
    const onNextSnapshot = useRef(onNext)

    const doAdvance = useCallback(() => {
        if (advancedRef.current) return
        advancedRef.current = true
        onNextSnapshot.current()
    }, [])

    useEffect(() => {
        advancedRef.current = false
        let timer: ReturnType<typeof setTimeout>
        let cancelled = false  // guard chống StrictMode double-invoke

        if (showExample) {
            setLoadingEx(true)
            setExample(null)
            fetchExample(card.term, card.definition)
                .then(ex => {
                    if (cancelled) return  // đã unmount (StrictMode cleanup)
                    setExample(ex)
                    setLoadingEx(false)
                    timer = setTimeout(doAdvance, 5000)
                })
                .catch(() => {
                    if (cancelled) return
                    setLoadingEx(false)
                    timer = setTimeout(doAdvance, 3000)
                })
        } else {
            timer = setTimeout(doAdvance, 2000)
        }
        return () => {
            cancelled = true   // cancel pending fetch callback
            clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // empty deps - chỉ chạy khi mount

    return (
        <div className="learn-correct-card" onClick={doAdvance}>
            <div className="learn-correct-header">
                <span className="learn-correct-check">✓</span>
                <span className="learn-correct-label">Chính xác!</span>
            </div>
            <div className="learn-correct-term">{card.term}</div>
            {card.pronunciation && <div className="learn-correct-pron">{card.pronunciation}</div>}
            <div className="learn-correct-def">{card.definition}</div>
            {showExample && (
                <div className="learn-correct-example">
                    {loadingEx ? <span className="learn-ex-loading">Đang tạo ví dụ...</span>
                        : example ? <>
                            <div className="learn-ex-en">"{example.en}"</div>
                            <div className="learn-ex-vi">{example.vi}</div>
                        </> : null}
                </div>
            )}
            <p className="learn-correct-hint">Nhấn để tiếp tục</p>
        </div>
    )
}

// ─── WrongFeedback ───────────────────────────────────────────
function WrongFeedback({ question, correctAns, userAns, onNext }: {
    question: string; correctAns: string; userAns: string; onNext: () => void
}) {
    const [val, setVal] = useState('')
    const ref = useRef<HTMLInputElement>(null)
    const ok = val.trim().toLowerCase() === correctAns.toLowerCase()
    useEffect(() => { setTimeout(() => ref.current?.focus(), 80) }, [])
    return (
        <div className="learn-wrong-card">
            <div className="learn-wrong-header"><span className="learn-wrong-icon">✗</span><h3>Chưa đúng</h3></div>
            <div className="learn-wrong-compare">
                <div className="learn-wrong-row"><span className="learn-wrong-lbl">Câu hỏi</span><span className="learn-wrong-val">{question}</span></div>
                <div className="learn-wrong-row wrong"><span className="learn-wrong-lbl">Bạn trả lời</span><span className="learn-wrong-val red">{userAns || '(bỏ qua)'}</span></div>
                <div className="learn-wrong-row correct"><span className="learn-wrong-lbl">Đáp án đúng</span><span className="learn-wrong-val green">{correctAns}</span></div>
            </div>
            <p className="learn-retype-hint">Gõ lại đáp án đúng để tiếp tục:</p>
            <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ok && onNext()}
                placeholder={correctAns} className={`learn-retype-inp ${ok ? 'correct' : ''}`} />
            <button className="learn-fb-next-btn" onClick={onNext} disabled={!ok} style={{ opacity: ok ? 1 : 0.4 }}>
                {ok ? 'Tiếp tục →' : `Gõ "${correctAns}" để tiếp`}
            </button>
        </div>
    )
}

// ─── Main ────────────────────────────────────────────────────
export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { set, loading } = useSet(id)

    const [phase, setPhase] = useState<'setup' | 'study' | 'done'>('setup')
    const [goal, setGoal] = useState<'quick' | 'master'>('master')
    const [settings, setSettings] = useState<LearnSettings>({ mcOn: true, typeOn: true, fcOn: false, langEn: true, langVi: true })
    const [showSettings, setShowSettings] = useState(false)

    const [deck, setDeck] = useState<LearningCard[]>([])
    const [queue, setQueue] = useState<Step[]>([])
    const [stepIdx, setStepIdx] = useState(0)

    // Refs để tránh stale closure trong callbacks
    const stepIdxRef = useRef(0)
    const queueRef = useRef<Step[]>([])
    const deckRef = useRef<LearningCard[]>([])

    // Luôn sync refs với state mới nhất
    stepIdxRef.current = stepIdx
    queueRef.current = queue
    deckRef.current = deck

    // Feedback
    const [fbMode, setFbMode] = useState<'idle' | 'correct' | 'wrong'>('idle')
    const [fbData, setFbData] = useState<{ question: string; correctAns: string; userAns: string } | null>(null)
    // Key để force-remount CorrectFeedback khi card mới
    const [correctKey, setCorrectKey] = useState(0)
    const [correctCard, setCorrectCard] = useState<Card | null>(null)
    const [correctType, setCorrectType] = useState<QType>('mc')  // type của câu vừa trả lời đúng

    const [typed, setTyped] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const [totalAnswered, setTotalAnswered] = useState(0)
    const [totalCorrect, setTotalCorrect] = useState(0)
    const [streak, setStreak] = useState(0)
    const startRef = useRef(Date.now())

    // Stable refs cho allDefs/allTerms - không tạo array mới mỗi render
    const allDefsRef = useRef<string[]>([])
    const allTermsRef = useRef<string[]>([])
    if (set?.cards) {
        allDefsRef.current = set.cards.map(c => c.definition)
        allTermsRef.current = set.cards.map(c => c.term)
    }

    // buildQueue: stable - dùng refs bên trong
    const buildQueue = useCallback((d: LearningCard[], _g: 'quick' | 'master', s: LearnSettings, startI = 0) => {
        return d.filter(lc => lc.status !== 'known').map((lc, i) => {
            const { type, reverse } = pickQType(lc, s, startI + i)
            return makeStep(lc, allDefsRef.current, allTermsRef.current, type, reverse)
        })
    }, []) // empty deps - hoàn toàn stable

    // advanceStep: stable - đọc từ refs
    const advanceStep = useCallback(() => {
        setFbMode('idle'); setFbData(null); setTyped(''); setCorrectCard(null)
        const ni = stepIdxRef.current + 1
        if (ni >= queueRef.current.length) {
            // Dùng deckRef để đọc deck mới nhất không cần re-create callback
            const currentDeck = deckRef.current
            const stillLearning = currentDeck.filter(lc => lc.status !== 'known')
            if (stillLearning.length === 0) {
                const dur = Math.floor((Date.now() - startRef.current) / 1000)
                api.saveSession({
                    setId: Number(id), mode: 'learn',
                    score: currentDeck.filter(lc => lc.status === 'known').length,
                    total: currentDeck.length, duration: dur
                }).catch(() => { })
                setPhase('done')
            } else {
                const nq = shuffle(buildQueue(currentDeck, goal, settings, ni))
                queueRef.current = nq
                stepIdxRef.current = 0
                setQueue(nq)
                setStepIdx(0)
            }
        } else {
            stepIdxRef.current = ni
            setStepIdx(ni)
        }
    }, [id, goal, settings, buildQueue]) // goal/settings cần thiết cho buildQueue

    // speak effect: chỉ khi stepIdx thay đổi VÀ fbMode đang idle
    const fbModeRef = useRef(fbMode)
    fbModeRef.current = fbMode
    useEffect(() => {
        // Chỉ speak khi vừa đến step mới (fbMode lúc này phải là idle)
        if (fbModeRef.current !== 'idle') return
        const step = queueRef.current[stepIdxRef.current]
        if (step?.type === 'voice_mc') speakWord(step.lc.card.term)
        if (step?.type === 'type') inputRef.current?.focus()
    }, [stepIdx]) // chỉ deps stepIdx

    const settingChange = (k: keyof LearnSettings, v: boolean) =>
        setSettings(p => ({ ...p, [k]: v }))

    const handleStart = (g: 'quick' | 'master') => {
        if (!set) return
        setGoal(g)
        const newDeck: LearningCard[] = shuffle(set.cards).map(card => ({
            card, status: 'new', consecutiveCorrect: 0, wrongCount: 0
        }))
        const iq = buildQueue(newDeck, g, settings)
        deckRef.current = newDeck
        queueRef.current = iq
        stepIdxRef.current = 0
        setDeck(newDeck); setQueue(iq); setStepIdx(0)
        setFbMode('idle'); setTyped(''); setFbData(null); setCorrectCard(null)
        setTotalAnswered(0); setTotalCorrect(0); setStreak(0)
        startRef.current = Date.now()
        setPhase('study')
    }

    const handleAnswer = (userAnswer: string) => {
        if (fbMode !== 'idle') return
        const step = queueRef.current[stepIdxRef.current]
        if (!step) return
        const { lc, type, reverse } = step
        const expected = reverse ? lc.card.term : lc.card.definition
        const cleanExpect = stripMeta(expected)
        const correct = type === 'type'
            ? (reverse ? checkEn(userAnswer, expected) : checkVi(userAnswer, expected))
            : userAnswer === expected

        setTotalAnswered(t => t + 1)
        setTyped('')

        // Update deck immutably
        const updatedDeck = deckRef.current.map(d => {
            if (d.card.id !== lc.card.id) return d
            if (correct) {
                const nc = d.consecutiveCorrect + 1
                return { ...d, status: nc >= 2 ? 'known' as CardStatus : 'learning' as CardStatus, consecutiveCorrect: nc }
            }
            return { ...d, status: 'learning' as CardStatus, consecutiveCorrect: 0, wrongCount: d.wrongCount + 1 }
        })
        deckRef.current = updatedDeck
        setDeck(updatedDeck)

        if (correct) {
            setTotalCorrect(t => t + 1)
            setStreak(s => s + 1)
            setCorrectCard(lc.card)
            setCorrectType(type)       // lưu type để biết có cần ví dụ không
            setCorrectKey(k => k + 1)
            setFbMode('correct')
        } else {
            setStreak(0)
            setFbData({ question: reverse ? lc.card.definition : lc.card.term, correctAns: cleanExpect, userAns: userAnswer })
            setFbMode('wrong')
        }
    }

    // ── Loading ──────────────────────────────────────────────
    if (loading || !set) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ fontSize: 32, animation: 'spin .8s linear infinite', color: 'var(--accent)' }}>⟳</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    const knownCount = deck.filter(lc => lc.status === 'known').length
    const progPct = deck.length ? Math.round((knownCount / deck.length) * 100) : 0
    const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0

    // ── Done ─────────────────────────────────────────────────
    if (phase === 'done') return (
        <div className="learn-fullscreen">
            <div className="learn-header">
                <Link href={`/sets/${id}`} className="learn-back-btn">←</Link>
                <div className="learn-prog-wrap">
                    <div className="learn-prog-bar"><div className="learn-prog-fill" style={{ width: '100%', background: '#16a34a' }} /></div>
                    <span className="learn-prog-txt">Hoàn thành!</span>
                </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
                <div className="learn-done">
                    <div className="learn-done-icon">{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '💪'}</div>
                    <h2 className="learn-done-title">Học xong!</h2>
                    <p className="learn-done-sub">{set.title} · {deck.length} thuật ngữ</p>
                    <div className="learn-done-ring">
                        <svg viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" strokeWidth="10"
                                strokeDasharray={`${accuracy * 3.14} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                        </svg>
                        <span>{accuracy}%</span>
                    </div>
                    <div className="learn-done-stats">
                        <div className="learn-stat green"><strong>{totalCorrect}</strong>Đúng</div>
                        <div className="learn-stat red"><strong>{totalAnswered - totalCorrect}</strong>Sai</div>
                        <div className="learn-stat blue"><strong>{streak}</strong>Streak</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => setPhase('setup')}>🔄 Học lại</button>
                        <Link href={`/sets/${id}`}><button className="btn btn-ghost">← Về bộ thẻ</button></Link>
                    </div>
                </div>
            </div>
        </div>
    )

    // ── Setup ─────────────────────────────────────────────────
    if (phase === 'setup') return (
        <div className="learn-fullscreen">
            <div className="learn-setup-overlay">
                <div className="learn-setup-card">
                    <div className="learn-setup-logo">🎓</div>
                    <h2 className="learn-setup-title">{set.title}</h2>
                    <p className="learn-setup-sub">{set.cards.length} thuật ngữ · Chọn mục tiêu học</p>
                    <div className="learn-goal-grid">
                        <button className={`learn-goal-btn ${goal === 'quick' ? 'active' : ''}`} onClick={() => setGoal('quick')}>
                            <span className="learn-goal-icon">⚡</span><strong>Học nhanh</strong><span>Chỉ trắc nghiệm, qua nhanh</span>
                        </button>
                        <button className={`learn-goal-btn ${goal === 'master' ? 'active' : ''}`} onClick={() => setGoal('master')}>
                            <span className="learn-goal-icon">🧠</span><strong>Ghi nhớ sâu</strong><span>MC + Tự luận + Ví dụ câu</span>
                        </button>
                    </div>
                    <button className="learn-start-btn" onClick={() => handleStart(goal)}>Bắt đầu học →</button>
                </div>
            </div>
        </div>
    )

    // ── Study ─────────────────────────────────────────────────
    const currentStep = queue[stepIdx]
    if (!currentStep) return null
    const { lc, type, reverse, options } = currentStep
    const questionText = reverse ? lc.card.definition : lc.card.term
    const pron = !reverse && lc.card.pronunciation ? lc.card.pronunciation : ''
    const qLabel = { mc: reverse ? '📋 Chọn thuật ngữ tiếng Anh' : '📋 Chọn định nghĩa đúng', type: reverse ? '✏️ Gõ thuật ngữ tiếng Anh' : '✏️ Gõ định nghĩa tiếng Việt', voice_mc: '🔊 Nghe và chọn định nghĩa đúng' }[type]

    return (
        <div className="learn-fullscreen">
            {showSettings && <SettingsPanel s={settings} onChange={settingChange} onClose={() => setShowSettings(false)} />}

            <StudyTopbar mode="learn" setId={id} setTitle={set.title}
                onSettingsClick={() => setShowSettings(true)}
                extra={
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 10px', background: 'var(--bg-page)', border: '1.5px solid var(--border)', borderRadius: 8 }}>
                        {knownCount}/{deck.length} đã biết
                    </span>
                }
            />
            <div style={{ height: 4, background: 'var(--border)', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${progPct}%`, background: 'linear-gradient(90deg,#4255ff,#7b68ee)', transition: 'width .5s' }} />
            </div>

            <div className="learn-content">
                {streak >= 3 && fbMode === 'idle' && (
                    <div className="learn-streak-banner">🔥 {streak} câu đúng liên tiếp!</div>
                )}

                {fbMode === 'correct' && correctCard && (
                    <CorrectFeedback key={correctKey} card={correctCard}
                        showExample={goal === 'master' && correctType === 'type'}
                        onNext={advanceStep} />
                )}

                {fbMode === 'wrong' && fbData && (
                    <WrongFeedback question={fbData.question} correctAns={fbData.correctAns} userAns={fbData.userAns} onNext={advanceStep} />
                )}

                {fbMode === 'idle' && (
                    <div className="learn-card">
                        <div className="learn-term-box">
                            <span className="learn-term-label">{reverse ? 'ĐỊNH NGHĨA' : 'THUẬT NGỮ'}</span>
                            {type === 'voice_mc' ? (
                                <button className="learn-voice-btn" onClick={() => speakWord(lc.card.term)}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M15.54 8.46a5 5 0 010 7.07" /></svg>
                                    Nhấn để nghe lại
                                </button>
                            ) : (
                                <h2 className="learn-term">{questionText}</h2>
                            )}
                            {pron && <p className="learn-pron">{pron}</p>}
                        </div>

                        <div className="learn-type-label">{qLabel}</div>

                        {(type === 'mc' || type === 'voice_mc') && options && (
                            <div className="learn-options">
                                {options.map((opt, i) => (
                                    <button key={i} className="learn-opt" onClick={() => handleAnswer(opt)}>
                                        <span className="learn-opt-key">{String.fromCharCode(65 + i)}</span>{opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {type === 'type' && (
                            <div className="learn-type-area">
                                <input ref={inputRef} value={typed}
                                    onChange={e => setTyped(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && typed.trim() && handleAnswer(typed)}
                                    placeholder={reverse ? 'Gõ thuật ngữ tiếng Anh...' : 'Gõ định nghĩa tiếng Việt...'}
                                    className="learn-type-input" />
                                <button className="learn-submit-btn" onClick={() => handleAnswer(typed)} disabled={!typed.trim()}>
                                    Kiểm tra →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="learn-bottom-stats">
                    <span>✓ <strong style={{ color: '#16a34a' }}>{totalCorrect}</strong></span>
                    <span>✗ <strong style={{ color: 'var(--danger)' }}>{totalAnswered - totalCorrect}</strong></span>
                    <span>🃏 {knownCount}/{deck.length}</span>
                </div>
            </div>
        </div>
    )
}