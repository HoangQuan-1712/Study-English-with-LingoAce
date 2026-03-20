// PATH: src/components/QuizViewer/index.tsx
'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { api, type Card } from '@/lib/api'
import StudyTopbar from '@/components/StudyTopbar'
import './QuizViewer.css'

interface Props { cards: Card[]; setId: string; setTitle: string }
type QType = 'mc_en' | 'mc_vi' | 'write_en' | 'write_vi' | 'match_q'

interface Question {
    id: number; card: Card; type: QType; options?: string[]
    matchPairs?: { term: string; def: string; cardId: number }[]
}

// Câu trả lời người dùng khi đang làm (chưa biết đúng sai)
type UserAnswer = string

// Sau khi nộp bài - kết quả từng câu
type GradedResult = { value: string; correct: boolean; correctAns: string }

interface Settings {
    count: number; langEn: boolean; langVi: boolean
    mcOn: boolean; writeOn: boolean; matchOn: boolean
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - .5) }

// Chuẩn hoá tiếng Việt: chỉ quan tâm đến từ, bỏ dấu cách/phẩy thừa
function normalizeVi(s: string) {
    return s.toLowerCase().replace(/\s*[,،]\s*/g, ',').replace(/\s+/g, ' ').trim()
}

// Kiểm tra đáp án tiếng Việt: chỉ cần đúng từ (không cần loại từ, phiên âm)
function checkVi(user: string, correct: string): boolean {
    // Lấy phần nghĩa thuần (bỏ phiên âm /.../ và loại từ như "n.", "v.", "adj.")
    const stripMeta = (s: string) => s
        .replace(/\/[^/]+\//g, '')          // bỏ /phiên âm/
        .replace(/^[a-z]+\.\s*/gi, '')      // bỏ loại từ đầu câu (n., v., adj.,...)
        .replace(/\([^)]+\)/g, '')          // bỏ (loại từ)
        .trim()

    const u = normalizeVi(stripMeta(user))
    const c = normalizeVi(stripMeta(correct))

    if (!u) return false
    if (u === c) return true

    // Chấp nhận nếu user gõ đúng ít nhất 1 nghĩa (tách bởi dấu phẩy/chấm phẩy)
    const meanings = c.split(/[,;]/).map(m => m.trim()).filter(Boolean)
    return meanings.some(m => normalizeVi(m) === u)
}

// Kiểm tra đáp án tiếng Anh: chỉ cần đúng từ (không cần loại từ)
function checkEn(user: string, correct: string): boolean {
    const stripMeta = (s: string) => s
        .replace(/\([^)]+\)/g, '')          // bỏ (v), (n), (adj)...
        .replace(/^[a-z]+\.\s*/gi, '')
        .trim()
    return stripMeta(user.trim()).toLowerCase() === stripMeta(correct).toLowerCase()
}

function buildQuestions(cards: Card[], s: Settings): Question[] {
    const allTerms = cards.map(c => c.term)
    const allDefs = cards.map(c => c.definition)
    const pick = shuffle(cards).slice(0, s.count)
    const qs: Question[] = []
    let id = 0

    if (s.matchOn && pick.length >= 4) {
        const mc = shuffle(cards).slice(0, Math.min(6, cards.length))
        qs.push({
            id: id++, card: mc[0], type: 'match_q',
            matchPairs: mc.map(c => ({ term: c.term, def: c.definition, cardId: c.id }))
        })
    }

    for (const card of pick) {
        const types: QType[] = []
        if (s.mcOn && s.langEn) types.push('mc_en')
        if (s.mcOn && s.langVi) types.push('mc_vi')
        if (s.writeOn && s.langEn) types.push('write_en')
        if (s.writeOn && s.langVi) types.push('write_vi')
        if (!types.length) types.push('mc_vi')

        const t = types[Math.floor(Math.random() * types.length)]
        if (t === 'mc_en') {
            const wrong = shuffle(allTerms.filter(x => x !== card.term)).slice(0, 3)
            qs.push({ id: id++, card, type: 'mc_en', options: shuffle([card.term, ...wrong]) })
        } else if (t === 'mc_vi') {
            const wrong = shuffle(allDefs.filter(x => x !== card.definition)).slice(0, 3)
            qs.push({ id: id++, card, type: 'mc_vi', options: shuffle([card.definition, ...wrong]) })
        } else {
            qs.push({ id: id++, card, type: t })
        }
    }
    return qs
}

// ─── Settings panel ───────────────────────────────────────────────
function SettingsPanel({ s, onChange, onStart, onClose }: {
    s: Settings; onChange: (k: keyof Settings, v: number | boolean) => void
    onStart: () => void; onClose: () => void
}) {
    return (
        <div className="qset-overlay" onClick={onClose}>
            <div className="qset-panel" onClick={e => e.stopPropagation()}>
                <div className="qset-header"><h3>Tùy chọn kiểm tra</h3><button onClick={onClose}>✕</button></div>
                <div className="qset-row"><label>Số câu hỏi (1–30)</label>
                    <input type="number" min={1} max={30} value={s.count}
                        onChange={e => onChange('count', Math.min(30, Math.max(1, +e.target.value)))} /></div>
                <div className="qset-section">Định dạng</div>
                <div className="qset-row"><label>🇬🇧 Tiếng Anh</label>
                    <input type="checkbox" checked={s.langEn} onChange={e => { if (!e.target.checked && !s.langVi) return; onChange('langEn', e.target.checked) }} /></div>
                <div className="qset-row"><label>🇻🇳 Tiếng Việt</label>
                    <input type="checkbox" checked={s.langVi} onChange={e => { if (!e.target.checked && !s.langEn) return; onChange('langVi', e.target.checked) }} /></div>
                <div className="qset-section">Loại câu hỏi</div>
                <div className="qset-row"><label>Trắc nghiệm</label>
                    <input type="checkbox" checked={s.mcOn} onChange={e => { if (!e.target.checked && !s.writeOn) return; onChange('mcOn', e.target.checked) }} /></div>
                <div className="qset-row"><label>Tự luận (gõ đáp án)</label>
                    <input type="checkbox" checked={s.writeOn} onChange={e => { if (!e.target.checked && !s.mcOn) return; onChange('writeOn', e.target.checked) }} /></div>
                <div className="qset-row"><label>Ghép thẻ (thêm 1 phần)</label>
                    <input type="checkbox" checked={s.matchOn} onChange={e => onChange('matchOn', e.target.checked)} /></div>
                <button className="qset-start-btn" onClick={onStart}>Tạo bài kiểm tra mới</button>
            </div>
        </div>
    )
}

// ─── Mini match trong bài ─────────────────────────────────────────
function MiniMatch({ q, userAns, onAnswer, submitted }: {
    q: Question; userAns: string | undefined
    onAnswer: (v: string) => void; submitted: boolean
}) {
    const pairs = q.matchPairs!
    const [sel, setSel] = useState<string | null>(null)
    const [matched, setMatched] = useState<Record<number, string>>({})
    const [wrongs, setWrongs] = useState<string[]>([])
    const rightOptions = useRef(shuffle(pairs.map(p => p.term))).current

    // Khi submitted: parse userAns để hiện kết quả
    const submittedMatched: Record<number, string> = {}
    if (submitted && userAns) {
        try { Object.assign(submittedMatched, JSON.parse(userAns)) } catch { }
    }

    const selectRight = (term: string) => {
        if (submitted || !sel) return
        const pair = pairs.find(p => p.def === sel)
        const correct = pair?.term === term
        if (correct) {
            const nm = { ...matched, [pair!.cardId]: term }
            setMatched(nm)
            setSel(null)
            if (Object.keys(nm).length === pairs.length) {
                onAnswer(JSON.stringify(nm))
            }
        } else {
            setWrongs(w => [...w, term])
            setSel(null)
            setTimeout(() => setWrongs(w => w.filter(x => x !== term)), 700)
        }
    }

    const display = submitted ? submittedMatched : matched

    return (
        <div className="mini-match">
            <p className="mini-match-hint">Ghép thuật ngữ với định nghĩa</p>
            <div className="mini-match-cols">
                <div className="mini-match-col">
                    {pairs.map(p => {
                        const done = !!display[p.cardId]
                        return (
                            <button key={p.cardId}
                                className={`mini-match-item left ${sel === p.def ? 'sel' : ''} ${done ? 'ok' : ''}`}
                                onClick={() => !done && !submitted && setSel(sel === p.def ? null : p.def)}
                                disabled={done}>
                                {done ? '✓ ' : ''}{p.def}
                            </button>
                        )
                    })}
                </div>
                <div className="mini-match-col">
                    {rightOptions.map(term => {
                        const done = Object.values(display).includes(term)
                        return (
                            <button key={term}
                                className={`mini-match-item right ${done ? 'ok' : ''} ${wrongs.includes(term) ? 'err' : ''}`}
                                onClick={() => selectRight(term)}
                                disabled={done || submitted}>
                                {done ? '✓ ' : ''}{term}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── QuestionCard (khi đang làm - không hiện đúng/sai) ────────────
function QuestionCard({ q, qi, total, userAns, onAnswer }: {
    q: Question; qi: number; total: number
    userAns: UserAnswer | undefined
    onAnswer: (qi: number, value: string) => void
}) {
    const [typed, setTyped] = useState(userAns || '')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (q.type === 'write_en' || q.type === 'write_vi') inputRef.current?.focus()
    }, [q.type])

    const qLabel = {
        mc_en: '📋 Chọn thuật ngữ tiếng Anh đúng',
        mc_vi: '📋 Chọn định nghĩa tiếng Việt đúng',
        write_en: '✏️ Gõ thuật ngữ tiếng Anh',
        write_vi: '✏️ Gõ định nghĩa tiếng Việt',
        match_q: '🧩 Ghép thẻ',
    }[q.type]

    // Phần câu hỏi: chỉ hiện từ/nghĩa thuần, không hiện loại từ/phiên âm ở phần trả lời
    const questionText =
        q.type === 'mc_en' || q.type === 'write_en'
            ? q.card.definition  // hỏi nghĩa tiếng Việt → gõ/chọn từ tiếng Anh
            : q.type === 'match_q'
                ? ''
                : q.card.term        // hỏi từ tiếng Anh → gõ/chọn nghĩa tiếng Việt

    return (
        <div className={`quiz-qcard ${userAns ? 'answered' : 'unanswered'}`} id={`q-${qi}`}>
            <div className="quiz-qcard-meta">
                <span className="quiz-qcard-type">{qLabel}</span>
                <span className="quiz-qcard-num">{qi + 1} / {total}</span>
            </div>
            {questionText && <p className="quiz-qcard-text">{questionText}</p>}

            {/* MC */}
            {(q.type === 'mc_en' || q.type === 'mc_vi') && (
                <div className="quiz-mc-grid">
                    {q.options!.map((opt, i) => (
                        <button key={i}
                            className={`quiz-mc-opt ${userAns === opt ? 'selected' : ''}`}
                            onClick={() => onAnswer(qi, opt)}>
                            <span className="quiz-mc-key">{i + 1}</span>{opt}
                        </button>
                    ))}
                </div>
            )}

            {/* Write */}
            {(q.type === 'write_en' || q.type === 'write_vi') && (
                <div className="quiz-write-wrap">
                    <input ref={inputRef} value={typed}
                        onChange={e => { setTyped(e.target.value); onAnswer(qi, e.target.value) }}
                        placeholder={q.type === 'write_vi' ? 'Gõ định nghĩa tiếng Việt...' : 'Gõ từ tiếng Anh...'}
                        className={`quiz-write-inp ${userAns ? 'has-answer' : ''}`} />
                </div>
            )}

            {/* Match */}
            {q.type === 'match_q' && (
                <MiniMatch q={q} userAns={userAns} onAnswer={v => onAnswer(qi, v)} submitted={false} />
            )}
        </div>
    )
}

// ─── QuestionReview (sau khi nộp bài - hiện đúng/sai + đáp án) ────
function QuestionReview({ q, qi, total, result }: {
    q: Question; qi: number; total: number; result: GradedResult
}) {
    const qLabel = {
        mc_en: '📋 Chọn thuật ngữ tiếng Anh đúng',
        mc_vi: '📋 Chọn định nghĩa tiếng Việt đúng',
        write_en: '✏️ Gõ thuật ngữ tiếng Anh',
        write_vi: '✏️ Gõ định nghĩa tiếng Việt',
        match_q: '🧩 Ghép thẻ',
    }[q.type]

    const questionText =
        q.type === 'mc_en' || q.type === 'write_en'
            ? q.card.definition
            : q.type === 'match_q' ? ''
                : q.card.term

    return (
        <div className={`quiz-qcard ${result.correct ? 'answered-ok' : 'answered-fail'}`} id={`r-${qi}`}>
            <div className="quiz-qcard-meta">
                <span className="quiz-qcard-type">{qLabel}</span>
                <span className={`quiz-result-badge ${result.correct ? 'ok' : 'fail'}`}>
                    {result.correct ? '✓ Đúng' : '✗ Sai'}
                </span>
                <span className="quiz-qcard-num">{qi + 1} / {total}</span>
            </div>
            {questionText && <p className="quiz-qcard-text">{questionText}</p>}

            {/* MC review */}
            {(q.type === 'mc_en' || q.type === 'mc_vi') && (
                <div className="quiz-mc-grid">
                    {q.options!.map((opt, i) => {
                        const isCorrect = opt === result.correctAns
                        const isUser = opt === result.value
                        let cls = 'quiz-mc-opt review'
                        if (isCorrect) cls += ' correct'
                        else if (isUser && !isCorrect) cls += ' wrong'
                        else cls += ' dim'
                        return (
                            <button key={i} className={cls} disabled>
                                <span className="quiz-mc-key">{isCorrect ? '✓' : isUser ? '✗' : i + 1}</span>{opt}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Write review */}
            {(q.type === 'write_en' || q.type === 'write_vi') && (
                <div className="quiz-write-wrap">
                    <input value={result.value} disabled
                        className={`quiz-write-inp ${result.correct ? 'correct' : 'wrong'}`} />
                    {!result.correct && (
                        <div className="quiz-correct-hint">
                            <span>✓ Đáp án đúng:</span>
                            <strong>{result.correctAns}</strong>
                        </div>
                    )}
                </div>
            )}

            {/* Match review */}
            {q.type === 'match_q' && (
                <MiniMatch q={q} userAns={result.value} onAnswer={() => { }} submitted={true} />
            )}
        </div>
    )
}

// ─── Grade all questions ──────────────────────────────────────────
function gradeQuestions(questions: Question[], userAnswers: Record<number, UserAnswer>): Record<number, GradedResult> {
    const results: Record<number, GradedResult> = {}
    questions.forEach((q, qi) => {
        const value = userAnswers[qi] || ''
        let correct = false
        let correctAns = ''

        if (q.type === 'mc_vi') {
            correctAns = q.card.definition
            correct = value === q.card.definition
        } else if (q.type === 'mc_en') {
            correctAns = q.card.term
            correct = value === q.card.term
        } else if (q.type === 'write_vi') {
            // Tiếng Việt: chỉ cần đúng từ, không cần loại từ/phiên âm
            correctAns = q.card.definition
            correct = checkVi(value, q.card.definition)
        } else if (q.type === 'write_en') {
            // Tiếng Anh: chỉ cần đúng từ, không cần loại từ/phiên âm
            correctAns = q.card.term
            correct = checkEn(value, q.card.term)
        } else if (q.type === 'match_q') {
            // Match: đúng nếu đã ghép hết
            correctAns = 'Ghép đủ tất cả'
            try {
                const m = JSON.parse(value || '{}')
                const pairs = q.matchPairs!
                correct = pairs.every(p => m[p.cardId] === p.term)
            } catch { correct = false }
        }
        results[qi] = { value, correct, correctAns }
    })
    return results
}

// ─── Main QuizViewer ──────────────────────────────────────────────
export default function QuizViewer({ cards, setId, setTitle }: Props) {
    const [settings, setSettings] = useState<Settings>({
        count: Math.min(20, Math.min(30, cards.length)), langEn: true, langVi: true,
        mcOn: true, writeOn: true, matchOn: false
    })
    const [showSettings, setShowSettings] = useState(false)
    const [phase, setPhase] = useState<'idle' | 'quiz' | 'result' | 'review'>('idle')
    const [questions, setQuestions] = useState<Question[]>([])
    const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({})
    const [gradedResults, setGradedResults] = useState<Record<number, GradedResult>>({})
    const [reviewMode, setReviewMode] = useState(false)
    const startRef = useRef(Date.now())
    const questionsColRef = useRef<HTMLDivElement>(null)

    const settingsChange = (k: keyof Settings, v: number | boolean) =>
        setSettings(p => ({ ...p, [k]: v }))

    const startQuiz = () => {
        const qs = buildQuestions(cards, settings)
        setQuestions(qs); setUserAnswers({}); setGradedResults({})
        setPhase('quiz'); setShowSettings(false); setReviewMode(false)
        startRef.current = Date.now()
        setTimeout(() => questionsColRef.current?.scrollTo({ top: 0 }), 50)
    }

    const handleAnswer = useCallback((qi: number, value: string) => {
        setUserAnswers(prev => ({ ...prev, [qi]: value }))
    }, [])

    const submitQuiz = () => {
        const results = gradeQuestions(questions, userAnswers)
        setGradedResults(results)
        const correct = Object.values(results).filter(r => r.correct).length
        const dur = Math.floor((Date.now() - startRef.current) / 1000)
        api.saveSession({ setId: Number(setId), mode: 'quiz', score: correct, total: questions.length, duration: dur }).catch(() => { })
        setPhase('result')
    }

    const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[+k]?.trim()).length
    const totalQ = questions.length
    const progPct = totalQ ? (answeredCount / totalQ) * 100 : 0

    const correctCount = Object.values(gradedResults).filter(r => r.correct).length
    const pct = totalQ ? Math.round((correctCount / totalQ) * 100) : 0

    const scrollToQ = (qi: number) => {
        const prefix = reviewMode ? 'r' : 'q'
        const el = document.getElementById(`${prefix}-${qi}`)
        if (el) {
            const col = el.closest('.quiz-questions-col') as HTMLElement
            if (col) {
                const top = el.offsetTop - col.offsetTop - 40
                col.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
            } else {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }

    // ── Idle screen ──
    if (phase === 'idle') return (
        <div className="quiz-shell">
            <StudyTopbar mode="quiz" setId={setId} setTitle={setTitle} />
            <div className="quiz-idle-page">
                <div className="quiz-idle-box">
                    <div style={{ fontSize: 52, marginBottom: 8 }}>📝</div>
                    <h2>Bài kiểm tra</h2>
                    <p>{setTitle} · {cards.length} thuật ngữ</p>
                    <div className="quiz-idle-form">
                        <div className="qset-row"><label>Số câu hỏi (1–30)</label>
                            <input type="number" min={1} max={30} value={settings.count}
                                onChange={e => settingsChange('count', Math.min(30, Math.max(1, +e.target.value)))} /></div>
                        <div className="qset-section">Định dạng</div>
                        <div className="qset-row"><label>🇬🇧 Tiếng Anh</label>
                            <input type="checkbox" checked={settings.langEn} onChange={e => { if (!e.target.checked && !settings.langVi) return; settingsChange('langEn', e.target.checked) }} /></div>
                        <div className="qset-row"><label>🇻🇳 Tiếng Việt</label>
                            <input type="checkbox" checked={settings.langVi} onChange={e => { if (!e.target.checked && !settings.langEn) return; settingsChange('langVi', e.target.checked) }} /></div>
                        <div className="qset-section">Loại câu hỏi</div>
                        <div className="qset-row"><label>Trắc nghiệm</label>
                            <input type="checkbox" checked={settings.mcOn} onChange={e => { if (!e.target.checked && !settings.writeOn) return; settingsChange('mcOn', e.target.checked) }} /></div>
                        <div className="qset-row"><label>Tự luận</label>
                            <input type="checkbox" checked={settings.writeOn} onChange={e => { if (!e.target.checked && !settings.mcOn) return; settingsChange('writeOn', e.target.checked) }} /></div>
                        <div className="qset-row"><label>Ghép thẻ (thêm 1 phần)</label>
                            <input type="checkbox" checked={settings.matchOn} onChange={e => settingsChange('matchOn', e.target.checked)} /></div>
                    </div>
                    <button className="quiz-start-btn" onClick={startQuiz}>Bắt đầu làm bài →</button>
                </div>
            </div>
        </div>
    )

    // ── Result screen ──
    if (phase === 'result') return (
        <div className="quiz-shell">
            <StudyTopbar mode="quiz" setId={setId} setTitle={setTitle} onSettingsClick={() => setShowSettings(true)} />
            {showSettings && <SettingsPanel s={settings} onChange={settingsChange} onStart={startQuiz} onClose={() => setShowSettings(false)} />}
            <div className="quiz-result-page">
                <div className="quiz-result-card">
                    {/* Score ring */}
                    <div className="quiz-result-ring">
                        <svg viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="58" fill="none" stroke="var(--border)" strokeWidth="12" />
                            <circle cx="70" cy="70" r="58" fill="none"
                                stroke={pct >= 70 ? '#16a34a' : pct >= 40 ? '#f59e0b' : 'var(--danger)'}
                                strokeWidth="12"
                                strokeDasharray={`${pct * 3.644} 364.4`}
                                strokeLinecap="round"
                                transform="rotate(-90 70 70)" />
                        </svg>
                        <div className="quiz-result-ring-inner">
                            <span className="quiz-result-pct">{pct}%</span>
                            <span className="quiz-result-label">điểm số</span>
                        </div>
                    </div>

                    <h2 className="quiz-result-title">
                        {pct === 100 ? '🏆 Hoàn hảo!' : pct >= 70 ? '🎉 Làm tốt lắm!' : pct >= 40 ? '📖 Cần ôn thêm' : '💪 Cố gắng hơn nào!'}
                    </h2>

                    {/* Stats */}
                    <div className="quiz-result-stats">
                        <div className="quiz-result-stat green">
                            <strong>{correctCount}</strong>
                            <span>Câu đúng</span>
                        </div>
                        <div className="quiz-result-stat red">
                            <strong>{totalQ - correctCount}</strong>
                            <span>Câu sai</span>
                        </div>
                        <div className="quiz-result-stat blue">
                            <strong>{totalQ}</strong>
                            <span>Tổng câu</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="quiz-result-actions">
                        <button className="quiz-result-btn primary" onClick={() => { setReviewMode(true); setPhase('review') }}>
                            🔍 Xem lại bài làm
                        </button>
                        <button className="quiz-result-btn secondary" onClick={startQuiz}>
                            🔄 Làm lại bài mới
                        </button>
                        <Link href={`/sets/${setId}`}>
                            <button className="quiz-result-btn ghost">← Về bộ thẻ</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )

    // ── Review screen ──
    if (phase === 'review') return (
        <div className="quiz-shell">
            <StudyTopbar mode="quiz" setId={setId} setTitle={setTitle}
                extra={
                    <button className="study-topbar-icon-btn" onClick={() => setPhase('result')} title="Về kết quả">
                        ← Kết quả
                    </button>
                }
            />
            <div className="quiz-prog-bar">
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#16a34a' : 'var(--accent)', transition: 'width .4s' }} />
            </div>
            <div className="quiz-layout">
                {/* Sidebar */}
                <div className="quiz-sidebar">
                    <div className="quiz-sb-title">Câu hỏi</div>
                    {questions.map((_, i) => {
                        const r = gradedResults[i]
                        return (
                            <div key={i}
                                className={`quiz-sb-dot ${r ? r.correct ? 'ok' : 'fail' : ''}`}
                                onClick={() => scrollToQ(i)}>
                                {r ? (r.correct ? '✓' : '✗') : i + 1}
                            </div>
                        )
                    })}
                </div>
                {/* Review questions */}
                <div className="quiz-questions-col">
                    <div className="quiz-review-header">
                        <span>📋 Xem lại bài làm · {correctCount}/{totalQ} câu đúng</span>
                        <button className="quiz-result-btn secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={startQuiz}>
                            🔄 Làm lại
                        </button>
                    </div>
                    {questions.map((q, qi) => (
                        <QuestionReview key={q.id} q={q} qi={qi} total={totalQ} result={gradedResults[qi]} />
                    ))}
                </div>
            </div>
        </div>
    )

    // ── Quiz in progress ──
    return (
        <div className="quiz-shell">
            <StudyTopbar mode="quiz" setId={setId} setTitle={setTitle} onSettingsClick={() => setShowSettings(true)}
                extra={
                    <span className="quiz-topbar-count">
                        {answeredCount}/{totalQ}
                    </span>
                }
            />
            {showSettings && <SettingsPanel s={settings} onChange={settingsChange} onStart={startQuiz} onClose={() => setShowSettings(false)} />}

            {/* Progress bar */}
            <div className="quiz-prog-bar">
                <div style={{ width: `${progPct}%`, height: '100%', background: 'var(--accent)', transition: 'width .3s' }} />
            </div>

            <div className="quiz-layout">
                {/* Sidebar */}
                <div className="quiz-sidebar">
                    <div className="quiz-sb-title">Câu hỏi</div>
                    {questions.map((_, i) => {
                        const answered = !!(userAnswers[i]?.trim())
                        return (
                            <div key={i}
                                className={`quiz-sb-dot ${answered ? 'answered' : ''}`}
                                onClick={() => scrollToQ(i)}>
                                {answered ? '●' : i + 1}
                            </div>
                        )
                    })}
                </div>

                {/* Questions list */}
                <div className="quiz-questions-col" ref={questionsColRef}>
                    {questions.map((q, qi) => (
                        <QuestionCard key={q.id} q={q} qi={qi} total={totalQ}
                            userAns={userAnswers[qi]}
                            onAnswer={handleAnswer} />
                    ))}

                    {/* Submit button */}
                    <div className="quiz-submit-area">
                        <div className="quiz-submit-info">
                            {answeredCount < totalQ && (
                                <span className="quiz-submit-warn">
                                    ⚠️ Còn {totalQ - answeredCount} câu chưa trả lời
                                </span>
                            )}
                        </div>
                        <button className="quiz-submit-btn" onClick={submitQuiz}>
                            Nộp bài ({answeredCount}/{totalQ} câu đã làm)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}