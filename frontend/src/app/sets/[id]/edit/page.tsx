'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { api, type CardDraft } from '@/lib/api'
import Link from 'next/link'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import '@/app/create/page.css'

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [cards, setCards] = useState<CardDraft[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [errMsg, setErrMsg] = useState('')

    useEffect(() => {
        api.getSet(id)
            .then(set => {
                setTitle(set.title)
                setDesc(set.description || '')
                setCards(set.cards.map(c => ({
                    term: c.term, definition: c.definition,
                    pronunciation: c.pronunciation || undefined,
                })))
            })
            .catch(() => setErrMsg('Không tải được bộ thẻ'))
            .finally(() => setLoading(false))
    }, [id])

    const addCard = () => setCards(p => [...p, { term: '', definition: '' }])
    const removeCard = (i: number) => { if (cards.length > 1) setCards(p => p.filter((_, j) => j !== i)) }
    const updateCard = (i: number, f: keyof CardDraft, v: string) =>
        setCards(p => p.map((c, j) => j === i ? { ...c, [f]: v } : c))

    const validCards = cards.filter(c => c.term.trim() && c.definition.trim())

    const handleSave = async () => {
        setErrMsg('')
        if (!title.trim()) { setErrMsg('Tiêu đề không được để trống'); return }
        if (validCards.length === 0) { setErrMsg('Cần ít nhất 1 thẻ hợp lệ'); return }
        setSaving(true)
        try {
            await api.updateSet(id, { title: title.trim(), description: desc.trim(), cards: validCards })
            router.push(`/sets/${id}`)
        } catch (e: unknown) {
            setErrMsg('Lỗi khi lưu: ' + (e instanceof Error ? e.message : 'Thử lại'))
            setSaving(false)
        }
    }

    if (loading) return (
        <>
            <Topbar />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={32} style={{ animation: 'spin .8s linear infinite', color: 'var(--accent)' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </>
    )

    return (
        <>
            <Topbar />
            <div className="page-body">
                <div className="create-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href={`/sets/${id}`}>
                            <button className="btn btn-ghost" style={{ height: 36, fontSize: 13 }}>← Huỷ</button>
                        </Link>
                        <h1 className="create-title">Chỉnh sửa bộ thẻ</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {validCards.length > 0 && (
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{validCards.length} thẻ hợp lệ</span>
                        )}
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? .7 : 1 }}>
                            {saving ? <><Loader2 size={14} className="spin-icon" /> Đang lưu...</> : '✓ Lưu thay đổi'}
                        </button>
                    </div>
                </div>
                {errMsg && (
                    <div style={{
                        background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-lg)',
                        padding: '12px 16px', marginBottom: 20, color: '#991b1b', fontSize: 14
                    }}>
                        ⚠️ {errMsg}
                    </div>
                )}
                <input className="create-field-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề..." />
                <textarea className="create-field-desc" value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Mô tả..." />
                {cards.map((card, i) => (
                    <div key={i} className="create-card">
                        <div className="create-card-header">
                            <span className="create-card-num">{i + 1}</span>
                            <button className="create-card-del" onClick={() => removeCard(i)} disabled={cards.length <= 1}>
                                <Trash2 size={15} />
                            </button>
                        </div>
                        <div className="create-card-inputs">
                            <div className="create-input-group">
                                <label>Thuật ngữ</label>
                                <input value={card.term} onChange={e => updateCard(i, 'term', e.target.value)} placeholder="Thuật ngữ..." />
                            </div>
                            <div className="create-input-group">
                                <label>Định nghĩa</label>
                                <input value={card.definition} onChange={e => updateCard(i, 'definition', e.target.value)} placeholder="Định nghĩa..." />
                            </div>
                        </div>
                    </div>
                ))}
                <button className="create-add-btn" onClick={addCard}><Plus size={17} /> THÊM THẺ</button>
            </div>
            <style>{`.spin-icon{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>
    )
}