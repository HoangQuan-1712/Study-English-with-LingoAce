'use client'
// PATH: src/app/create/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { api } from '@/lib/api'
import { Loader2, Trash2, Plus } from 'lucide-react'
import './page.css'

type CardDraft = { id: string; term: string; definition: string; pronunciation: string; image: string }

const LANGS = [
    { code: 'en', label: 'Tiếng Anh' }, { code: 'vi', label: 'Tiếng Việt' },
    { code: 'ja', label: 'Tiếng Nhật' }, { code: 'ko', label: 'Tiếng Hàn' },
    { code: 'zh', label: 'Tiếng Trung' }, { code: 'fr', label: 'Tiếng Pháp' },
]
const newCard = (): CardDraft => ({ id: Math.random().toString(36).slice(2), term: '', definition: '', pronunciation: '', image: '' })

async function fetchSuggestions(term: string, fromLang: string, toLang: string) {
    if (!term.trim() || term.length < 2) return []
    try {
        let phonetic = '', posShort = '', translatedWord = ''
        if (fromLang === 'en') {
            try {
                const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term.trim())}`)
                if (r.ok) {
                    const d = await r.json()
                    const entry = d[0]
                    phonetic = entry.phonetics?.find((p: any) => p.text)?.text || entry.phonetic || ''
                    const pos = entry.meanings?.[0]?.partOfSpeech || ''
                    if (pos === 'noun') posShort = 'n.'
                    else if (pos === 'verb') posShort = 'v.'
                    else if (pos === 'adjective') posShort = 'adj.'
                    else if (pos === 'adverb') posShort = 'adv.'
                    else if (pos) posShort = pos + '.'
                }
            } catch { }
        }
        try {
            const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(term.trim())}`)
            if (r.ok) {
                const d = await r.json()
                if (d?.[0]?.[0]) {
                    translatedWord = String(d[0][0][0]).toLowerCase().trim()
                    const half = Math.floor(translatedWord.length / 2)
                    if (translatedWord.length > 3 && translatedWord.slice(0, half) === translatedWord.slice(half))
                        translatedWord = translatedWord.slice(0, half)
                }
            }
        } catch { }
        if (!translatedWord) return []
        const fullDef = [posShort, phonetic, translatedWord].filter(Boolean).join(' ').trim()
        if (fullDef === translatedWord) return [{ def: fullDef, phonetic: '' }]
        return [{ def: fullDef, phonetic: '' }, { def: translatedWord, phonetic: '' }]
    } catch { return [] }
}

export default function CreatePage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [cards, setCards] = useState<CardDraft[]>([newCard(), newCard()])
    const [saving, setSaving] = useState(false)
    const [errMsg, setErrMsg] = useState('')
    const [isDirty, setIsDirty] = useState(false)
    const [showLeaveModal, setShowLeaveModal] = useState(false)
    const pendingHrefRef = useRef<string | null>(null)
    const [termLang, setTermLang] = useState('en')
    const [defLang, setDefLang] = useState('vi')
    const [suggestions, setSuggestions] = useState<Record<string, { def: string; phonetic: string }[]>>({})
    const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

    // Track dirty
    useEffect(() => {
        if (title.trim() || desc.trim() || cards.some(c => c.term.trim() || c.definition.trim()))
            setIsDirty(true)
    }, [title, desc, cards])

    useEffect(() => {
        const h = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = '' } }
        window.addEventListener('beforeunload', h)
        return () => window.removeEventListener('beforeunload', h)
    }, [isDirty])

    const addCard = () => setCards(p => [...p, newCard()])
    const removeCard = (id: string) => { if (cards.length > 1) setCards(p => p.filter(c => c.id !== id)) }

    const updateCard = (id: string, field: keyof CardDraft, val: string) => {
        setCards(p => p.map(c => c.id === id ? { ...c, [field]: val } : c))
        if (field === 'term' && val.trim().length >= 2) {
            clearTimeout(debounceRefs.current[id])
            debounceRefs.current[id] = setTimeout(async () => {
                const suggs = await fetchSuggestions(val, termLang, defLang)
                setSuggestions(prev => ({ ...prev, [id]: suggs }))
            }, 400)
        } else if (field === 'term') {
            setSuggestions(prev => ({ ...prev, [id]: [] }))
        }
    }

    const applySuggestion = (id: string, sugg: { def: string; phonetic: string }) => {
        setCards(p => p.map(c => c.id === id ? { ...c, definition: sugg.def, pronunciation: sugg.phonetic } : c))
        setSuggestions(prev => ({ ...prev, [id]: [] }))
    }

    const handleImageUpload = (id: string, file: File) => {
        const reader = new FileReader()
        reader.onload = e => updateCard(id, 'image', e.target?.result as string)
        reader.readAsDataURL(file)
    }

    const validCards = cards.filter(c => c.term.trim() && c.definition.trim())

    const handleSave = async () => {
        setErrMsg('')
        if (!title.trim()) { setErrMsg('Vui lòng nhập tiêu đề!'); return }
        if (validCards.length === 0) { setErrMsg('Cần ít nhất 1 thẻ hợp lệ!'); return }
        setSaving(true)
        try {
            const set = await api.createSet({
                title: title.trim(), description: desc.trim(),
                cards: validCards.map(c => ({ term: c.term.trim(), definition: c.definition.trim(), pronunciation: c.pronunciation.trim() || undefined }))
            })
            setIsDirty(false)
            router.push(`/sets/${set.id}`)
        } catch (e: unknown) {
            setErrMsg('Lỗi: ' + (e instanceof Error ? e.message : 'Thử lại'))
            setSaving(false)
        }
    }

    const guardNav = (href: string) => {
        if (!isDirty) { router.push(href); return }
        pendingHrefRef.current = href
        setShowLeaveModal(true)
    }

    return (
        <>
            {/* Leave modal */}
            {showLeaveModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '36px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>💾</div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Bạn có thay đổi chưa lưu</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>Nếu thoát bây giờ, tất cả thẻ đã tạo sẽ bị mất.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button onClick={async () => { setShowLeaveModal(false); await handleSave() }}
                                style={{ padding: 13, borderRadius: 12, background: 'linear-gradient(135deg,#4255ff,#7b68ee)', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                                💾 Lưu và thoát
                            </button>
                            <button onClick={() => { setIsDirty(false); setShowLeaveModal(false); if (pendingHrefRef.current) router.push(pendingHrefRef.current) }}
                                style={{ padding: 13, borderRadius: 12, background: '#fff5f5', color: 'var(--danger)', border: '1.5px solid #fca5a5', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                🗑️ Bỏ thay đổi và thoát
                            </button>
                            <button onClick={() => setShowLeaveModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: 8 }}>
                                Tiếp tục chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Topbar />
            <div className="page-body">
                <div className="create-header">
                    <h1 className="create-title">Tạo bộ học tập mới</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {validCards.length > 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{validCards.length} thẻ hợp lệ</span>}
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {saving ? <><Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} />Đang lưu...</> : '✓ Tạo bộ thẻ'}
                        </button>
                    </div>
                </div>

                {errMsg && (
                    <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 20, color: '#991b1b', fontSize: 14 }}>
                        ⚠️ {errMsg}
                    </div>
                )}

                <input className="create-field-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề bộ thẻ, ví dụ: Từ vựng IELTS..." />
                <textarea className="create-field-desc" value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Thêm mô tả..." />

                <div className="create-lang-row">
                    <div className="create-lang-group"><label>Ngôn ngữ thuật ngữ</label>
                        <select value={termLang} onChange={e => setTermLang(e.target.value)} className="create-lang-select">
                            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 18 }}>⇄</div>
                    <div className="create-lang-group"><label>Ngôn ngữ định nghĩa</label>
                        <select value={defLang} onChange={e => setDefLang(e.target.value)} className="create-lang-select">
                            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                    </div>
                </div>

                {cards.map((card, i) => (
                    <div key={card.id} className="create-card">
                        <div className="create-card-header">
                            <span className="create-card-num">{i + 1}</span>
                            <button className="create-card-del" onClick={() => removeCard(card.id)} disabled={cards.length <= 1}><Trash2 size={15} /></button>
                        </div>
                        <div className="create-card-body">
                            <div className="create-card-inputs">
                                <div className="create-input-group">
                                    <div className="create-input-header">
                                        <label>Thuật ngữ</label>
                                        <span className="create-lang-tag">{LANGS.find(l => l.code === termLang)?.label}</span>
                                    </div>
                                    <input value={card.term} onChange={e => updateCard(card.id, 'term', e.target.value)} placeholder="Nhập thuật ngữ..." />
                                    {card.pronunciation && (
                                        <div className="create-phonetic">{card.pronunciation}
                                            <button onClick={() => updateCard(card.id, 'pronunciation', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>×</button>
                                        </div>
                                    )}
                                </div>
                                <div className="create-input-group" style={{ position: 'relative' }}>
                                    <div className="create-input-header">
                                        <label>Định nghĩa</label>
                                        <span className="create-lang-tag">{LANGS.find(l => l.code === defLang)?.label}</span>
                                    </div>
                                    <input value={card.definition} onChange={e => updateCard(card.id, 'definition', e.target.value)} placeholder="Nhập định nghĩa..." />
                                    {(suggestions[card.id]?.length ?? 0) > 0 && !card.definition && (
                                        <div className="create-suggestions">
                                            {suggestions[card.id].map((s, si) => (
                                                <button key={si} className="create-suggestion-item" onClick={() => applySuggestion(card.id, s)}>
                                                    <span className="create-sugg-def">{s.def}</span>
                                                    {s.phonetic && <span className="create-sugg-phonetic">{s.phonetic}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="create-image-col">
                                    {card.image ? (
                                        <div className="create-image-preview">
                                            <img src={card.image} alt="card" />
                                            <button onClick={() => updateCard(card.id, 'image', '')}>×</button>
                                        </div>
                                    ) : (
                                        <label className="create-image-btn">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                            <span>Hình ảnh</span>
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageUpload(card.id, e.target.files[0])} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button className="create-add-btn" onClick={addCard}><Plus size={17} /> THÊM THẺ</button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>
    )
}