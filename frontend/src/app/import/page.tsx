'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'

type ParsedCard = { term: string; definition: string }

const PRESETS = [
    { label: 'Tab (Excel copy)', sep: '\t', row: '\n' },
    { label: 'Dấu phẩy CSV', sep: ',', row: '\n' },
    { label: 'Dấu gạch ngang', sep: ' - ', row: '\n' },
    { label: 'Dấu chấm phẩy', sep: ';', row: '\n' },
    { label: 'Dấu hai chấm', sep: ': ', row: '\n' },
]

function parseText(text: string, sep: string, row: string): ParsedCard[] {
    return text.trim().split(row)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const idx = line.indexOf(sep)
            if (idx === -1) return null
            return { term: line.slice(0, idx).trim(), definition: line.slice(idx + sep.length).trim() }
        })
        .filter((c): c is ParsedCard => c !== null && c.term.length > 0 && c.definition.length > 0)
}

export default function ImportPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [text, setText] = useState('')
    const [preset, setPreset] = useState(0)
    const [cards, setCards] = useState<ParsedCard[]>([])
    const [saving, setSaving] = useState(false)
    const [errMsg, setErrMsg] = useState('')

    const sep = PRESETS[preset].sep
    const row = PRESETS[preset].row

    const handleParse = () => {
        const parsed = parseText(text, sep, row)
        setCards(parsed)
        if (parsed.length === 0 && text.trim()) {
            setErrMsg('Không parse được! Thử đổi kiểu phân cách.')
        } else {
            setErrMsg('')
        }
    }

    const updateCard = (i: number, f: keyof ParsedCard, v: string) =>
        setCards(p => p.map((c, j) => j === i ? { ...c, [f]: v } : c))

    const removeCard = (i: number) => setCards(p => p.filter((_, j) => j !== i))

    const handleSave = async () => {
        if (!title.trim()) { setErrMsg('Nhập tiêu đề trước!'); return }
        if (cards.length === 0) { setErrMsg('Cần ít nhất 1 thẻ!'); return }
        setSaving(true)
        try {
            const set = await api.createSet({ title: title.trim(), cards })
            router.push(`/sets/${set.id}`)
        } catch (e: unknown) {
            setErrMsg('Lỗi: ' + (e instanceof Error ? e.message : 'Thử lại'))
            setSaving(false)
        }
    }

    return (
        <>
            <Topbar />
            <div className="page-body" style={{ maxWidth: 800 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 2 }}>📥 Import từ văn bản</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>
                            Paste danh sách từ vựng, tự động tạo bộ thẻ
                        </p>
                    </div>
                    {cards.length > 0 && (
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {saving ? <><Loader2 size={14} className="spin-icon" />Đang lưu...</> : `✓ Tạo ${cards.length} thẻ`}
                        </button>
                    )}
                </div>

                {errMsg && (
                    <div style={{
                        background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-lg)',
                        padding: '12px 16px', marginBottom: 20, color: '#991b1b', fontSize: 14
                    }}>
                        ⚠️ {errMsg}
                    </div>
                )}

                {/* Tiêu đề */}
                <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Tiêu đề bộ thẻ..."
                    style={{
                        width: '100%', padding: '12px 16px', fontSize: 16, fontWeight: 700,
                        background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-lg)', outline: 'none', marginBottom: 16,
                        color: 'var(--text-primary)'
                    }} />

                {/* Kiểu phân cách */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center' }}>Phân cách:</span>
                    {PRESETS.map((p, i) => (
                        <button key={i} onClick={() => setPreset(i)}
                            style={{
                                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `1.5px solid ${preset === i ? 'var(--accent)' : 'var(--border)'}`,
                                background: preset === i ? 'var(--accent-light)' : 'var(--bg-card)',
                                color: preset === i ? 'var(--accent)' : 'var(--text-muted)'
                            }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Hướng dẫn */}
                <div style={{
                    background: '#f0f7ff', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-lg)',
                    padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#1e40af', lineHeight: 1.7
                }}>
                    <strong>💡 Cách dùng:</strong> Mỗi dòng = 1 thẻ. Dùng ký tự phân cách để tách <em>thuật ngữ</em> và <em>định nghĩa</em>.<br />
                    Ví dụ với Tab: <code style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>algorithm	thuật toán</code><br />
                    Ví dụ với dấu -: <code style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>algorithm - thuật toán</code>
                </div>

                {/* Text area */}
                <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder={`Paste văn bản vào đây...\nVí dụ:\nalgorithm${sep}thuật toán\nvariable${sep}biến số\nfunction${sep}hàm`}
                    rows={10}
                    style={{
                        width: '100%', padding: '14px 16px', fontSize: 14, lineHeight: 1.7,
                        background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-lg)', outline: 'none', resize: 'vertical',
                        color: 'var(--text-primary)', fontFamily: 'monospace', marginBottom: 12
                    }} />

                <button onClick={handleParse}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
                        background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 28
                    }}>
                    🔍 Phân tích văn bản
                </button>

                {/* Preview */}
                {cards.length > 0 && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                                Xem trước — {cards.length} thẻ
                            </h2>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chỉnh sửa trực tiếp bên dưới</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {cards.map((card, i) => (
                                <div key={i} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12,
                                    background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)', padding: '12px 16px', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Thuật ngữ</div>
                                        <input value={card.term} onChange={e => updateCard(i, 'term', e.target.value)}
                                            style={{
                                                width: '100%', fontSize: 14, fontWeight: 600, background: 'transparent',
                                                border: 'none', borderBottom: '1px solid var(--border)', outline: 'none',
                                                padding: '4px 0', color: 'var(--text-primary)'
                                            }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Định nghĩa</div>
                                        <input value={card.definition} onChange={e => updateCard(i, 'definition', e.target.value)}
                                            style={{
                                                width: '100%', fontSize: 14, background: 'transparent',
                                                border: 'none', borderBottom: '1px solid var(--border)', outline: 'none',
                                                padding: '4px 0', color: 'var(--text-secondary)'
                                            }} />
                                    </div>
                                    <button onClick={() => removeCard(i)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                            fontSize: 18, padding: '4px', borderRadius: 4, lineHeight: 1
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, height: 44, fontSize: 15 }}>
                            {saving ? <><Loader2 size={16} className="spin-icon" />Đang tạo...</> : `✓ Tạo bộ thẻ (${cards.length} thẻ)`}
                        </button>
                    </>
                )}
            </div>
            <style>{`.spin-icon{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>
    )
}