// PATH: src/components/MatchGame/index.tsx
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { api, type Card } from '@/lib/api'
import StudyTopbar from '@/components/StudyTopbar'
import './MatchGame.css'

interface Props { cards: Card[]; setId: string; setTitle: string }
type Tile = { id: string; text: string; type: 'term' | 'def'; cardId: number; matched: boolean; selected: boolean; wrong: boolean }
type Phase = 'ready' | 'playing' | 'done'

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - .5) }

function buildTiles(cards: Card[]): Tile[] {
    const pick = shuffle(cards).slice(0, 6)
    return shuffle([
        ...pick.map(c => ({ id: `t${c.id}`, text: c.term, type: 'term' as const, cardId: c.id, matched: false, selected: false, wrong: false })),
        ...pick.map(c => ({ id: `d${c.id}`, text: `${c.pronunciation ? c.pronunciation + ' — ' : ''}${c.definition}`, type: 'def' as const, cardId: c.id, matched: false, selected: false, wrong: false })),
    ])
}

// Web Audio API for sounds
function playSound(type: 'correct' | 'wrong' | 'complete') {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        if (type === 'correct') {
            osc.frequency.setValueAtTime(523, ctx.currentTime)
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
            osc.start(); osc.stop(ctx.currentTime + 0.3)
        } else if (type === 'wrong') {
            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(200, ctx.currentTime)
            gain.gain.setValueAtTime(0.2, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
            osc.start(); osc.stop(ctx.currentTime + 0.25)
        } else {
            // Complete fanfare
            const notes = [523, 659, 784, 1047]
            notes.forEach((freq, i) => {
                const o2 = ctx.createOscillator(); const g2 = ctx.createGain()
                o2.connect(g2); g2.connect(ctx.destination)
                o2.frequency.value = freq
                g2.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12)
                g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3)
                o2.start(ctx.currentTime + i * 0.12); o2.stop(ctx.currentTime + i * 0.12 + 0.3)
            })
        }
    } catch { }
}

export default function MatchGame({ cards, setId, setTitle }: Props) {
    const [phase, setPhase] = useState<Phase>('ready')
    const [tiles, setTiles] = useState<Tile[]>([])
    const [selected, setSelected] = useState<Tile | null>(null)
    const [time, setTime] = useState(0)
    const [wrongs, setWrongs] = useState(0)
    const [bestTime, setBest] = useState<number | null>(null)
    const [soundOn, setSoundOn] = useState(true)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startRef = useRef(0)
    const timeRef = useRef(0) // track real time without stale closure

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
    useEffect(() => () => stopTimer(), [])

    const startGame = () => {
        setTiles(buildTiles(cards)); setSelected(null); setTime(0); setWrongs(0); timeRef.current = 0
        setPhase('playing')
        startRef.current = Date.now()
        stopTimer()
        timerRef.current = setInterval(() => {
            timeRef.current = Math.floor((Date.now() - startRef.current) / 1000)
            setTime(timeRef.current)
        }, 500)
    }

    const handleTile = useCallback((tile: Tile) => {
        if (tile.matched || tile.wrong) return
        if (!selected) {
            setSelected(tile)
            setTiles(p => p.map(t => t.id === tile.id ? { ...t, selected: true } : t))
            return
        }
        if (selected.id === tile.id) {
            setTiles(p => p.map(t => t.id === tile.id ? { ...t, selected: false } : t))
            setSelected(null); return
        }

        const isMatch = selected.cardId === tile.cardId && selected.type !== tile.type

        if (isMatch) {
            if (soundOn) playSound('correct')
            setTiles(p => {
                const next = p.map(t => t.cardId === tile.cardId ? { ...t, matched: true, selected: false, wrong: false } : t)
                // Check all matched
                if (next.every(t => t.matched)) {
                    stopTimer()
                    const total = timeRef.current
                    if (soundOn) setTimeout(() => playSound('complete'), 200)
                    setTime(total)
                    setBest(b => b === null ? total : Math.min(b, total))
                    api.saveSession({ setId: Number(setId), mode: 'match', score: 1, total: 1, duration: total }).catch(() => { })
                    setTimeout(() => setPhase('done'), 600)
                }
                return next
            })
            setSelected(null)
        } else {
            if (soundOn) playSound('wrong')
            setWrongs(w => w + 1)
            // +2s penalty: increase startRef backwards
            startRef.current -= 2000
            setTiles(p => p.map(t => t.id === tile.id || t.id === selected.id ? { ...t, wrong: true, selected: false } : t))
            setSelected(null)
            setTimeout(() => setTiles(p => p.map(t => t.wrong ? { ...t, wrong: false } : t)), 700)
        }
    }, [selected, setId, soundOn])

    if (phase === 'ready') return (
        <div className="match-shell">
            <StudyTopbar mode="match" setId={setId} setTitle={setTitle}
                extra={
                    <button className={`match-sound-btn ${soundOn ? 'on' : ''}`} onClick={() => setSoundOn(s => !s)}>
                        {soundOn ? '🔊' : '🔇'}
                    </button>
                }
            />
            <div className="match-ready-bg">
                <div className="match-ready-card">
                    <div className="match-ready-puzzle">🧩</div>
                    <div className="match-ready-grid-icon">
                        <div className="mgrid-a" /><div className="mgrid-b" />
                        <div className="mgrid-b" /><div className="mgrid-a" />
                    </div>
                    <h2>Bạn đã sẵn sàng?</h2>
                    <p>Ghép tất cả thuật ngữ với định nghĩa nhanh nhất có thể.<br />Ghép sai sẽ bị phạt <strong>+2 giây!</strong></p>
                    {bestTime !== null && <div className="match-best">🏆 Kỷ lục: {fmt(bestTime)}</div>}
                    <button className="match-start-btn" onClick={startGame}>Bắt đầu chơi</button>
                    <Link href={`/sets/${setId}`} className="match-back-link">← Quay lại bộ thẻ</Link>
                </div>
            </div>
        </div>
    )

    if (phase === 'done') return (
        <div className="match-shell">
            <StudyTopbar mode="match" setId={setId} setTitle={setTitle}
                extra={<button className={`match-sound-btn ${soundOn ? 'on' : ''}`} onClick={() => setSoundOn(s => !s)}>{soundOn ? '🔊' : '🔇'}</button>}
            />
            <div className="match-ready-bg">
                <div className="match-ready-card match-done-card">
                    <div style={{ fontSize: 64 }}>🎉</div>
                    <h2>Hoàn thành!</h2>
                    <div className="match-done-time">{fmt(time)}</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sai: {wrongs} lần (+{wrongs * 2}s phạt)</p>
                    {bestTime !== null && time <= bestTime && <div className="match-best">🏆 Kỷ lục mới!</div>}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                        <button className="match-start-btn" onClick={startGame}>Chơi lại</button>
                        <Link href={`/sets/${setId}`}><button className="btn btn-ghost">← Bộ thẻ</button></Link>
                    </div>
                </div>
            </div>
        </div>
    )

    const matched = tiles.filter(t => t.matched).length / 2
    const total = tiles.length / 2

    return (
        <div className="match-shell">
            <StudyTopbar mode="match" setId={setId} setTitle={setTitle}
                extra={
                    <>
                        <button className={`match-sound-btn ${soundOn ? 'on' : ''}`} onClick={() => setSoundOn(s => !s)}>
                            {soundOn ? '🔊' : '🔇'}
                        </button>
                    </>
                }
            />
            {/* Sub-header: timer + progress */}
            <div className="match-subheader">
                <Link href={`/sets/${setId}`} className="match-sub-back">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                    {setTitle}
                </Link>
                <div className="match-timer">⏱ {fmt(time)}</div>
                <div className="match-chips">
                    {Array.from({ length: total }, (_, i) => (
                        <div key={i} className={`match-chip ${i < matched ? 'done' : ''}`} />
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="match-grid-area">
                <div className="match-grid">
                    {tiles.map(tile => (
                        <button key={tile.id}
                            className={`match-tile ${tile.selected ? 'sel' : ''} ${tile.matched ? 'ok' : ''} ${tile.wrong ? 'err' : ''} ${tile.type}`}
                            onClick={() => handleTile(tile)} disabled={tile.matched}>
                            <span className="match-tile-badge">{tile.type === 'term' ? 'T' : 'D'}</span>
                            <span className="match-tile-text">{tile.text}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}