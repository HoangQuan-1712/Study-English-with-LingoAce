// PATH: src/app/settings/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Topbar from '@/components/Topbar'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { useAppSettings } from '@/hooks/useAppSettings'
import './settings.css'

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            style={{
                width: 44, height: 24, borderRadius: 99, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                background: checked ? 'var(--accent)' : 'var(--border-strong)',
                position: 'relative', transition: 'background .2s', flexShrink: 0, opacity: disabled ? .5 : 1
            }}>
            <span style={{
                position: 'absolute', top: 3, left: checked ? 'calc(100% - 21px)' : '3px',
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)'
            }} />
        </button>
    )
}

function Row({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
    return (
        <div className="settings-row">
            <div className="settings-row-info">
                <div className="settings-row-label">{label}</div>
                {desc && <div className="settings-row-desc">{desc}</div>}
            </div>
            {right}
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="settings-section">
            <div className="settings-section-title">{title}</div>
            {children}
        </div>
    )
}

export default function SettingsPage() {
    // Profile
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [errMsg, setErrMsg] = useState('')

    // Global settings
    const { settings, update } = useAppSettings()

    // Load user từ localStorage
    useEffect(() => {
        const user = auth.getUser()
        if (user) { setName(user.name || ''); setEmail(user.email || '') }
    }, [])

    // Apply dark mode khi settings thay đổi
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
    }, [settings.darkMode])

    const initial = (name || email || 'U')[0].toUpperCase()

    const saveProfile = async () => {
        setErrMsg(''); setSaving(true)
        try {
            const updated = await api.updateMe({ name: name.trim(), email: email.trim() })
            const token = auth.getToken()!
            auth.save(token, { ...auth.getUser()!, name: updated.name, email: updated.email })
            setEditing(false); setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (e: any) {
            setErrMsg(e?.message || 'Lưu thất bại')
        } finally { setSaving(false) }
    }

    const cancelEdit = () => {
        const user = auth.getUser()
        if (user) { setName(user.name || ''); setEmail(user.email || '') }
        setEditing(false); setErrMsg('')
    }

    return (
        <>
            <Topbar />
            <div className="page-body">
                <div className="settings-page">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <h1 className="page-title" style={{ marginBottom: 2 }}>Cài đặt</h1>
                            <p className="page-subtitle" style={{ marginBottom: 0 }}>Tuỳ chỉnh trải nghiệm học</p>
                        </div>
                        {saved && (
                            <div style={{
                                background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 'var(--radius-md)',
                                padding: '7px 14px', fontSize: 13, fontWeight: 700, color: '#166534'
                            }}>✓ Đã lưu</div>
                        )}
                    </div>

                    {errMsg && (
                        <div style={{
                            background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 'var(--radius-md)',
                            padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16
                        }}>⚠️ {errMsg}</div>
                    )}

                    {/* ─── Hồ sơ ─── */}
                    <Section title="Hồ sơ">
                        <div className="settings-row" style={{ gap: 16 }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%', flexShrink: 0, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white',
                                background: 'linear-gradient(135deg,#667eea,#764ba2)'
                            }}>
                                {initial}
                            </div>
                            {editing ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4 }}>Tên hiển thị</label>
                                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên..."
                                            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, outline: 'none', background: 'var(--bg-page)', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4 }}>Email</label>
                                        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email..."
                                            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13, outline: 'none', background: 'var(--bg-page)', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{name || '(chưa đặt tên)'}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{email}</div>
                                </div>
                            )}
                            {editing ? (
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button className="btn btn-primary" style={{ height: 34, fontSize: 13, padding: '0 14px' }} onClick={saveProfile} disabled={saving}>
                                        {saving ? '...' : 'Lưu'}
                                    </button>
                                    <button className="btn btn-ghost" style={{ height: 34, fontSize: 13 }} onClick={cancelEdit}>Huỷ</button>
                                </div>
                            ) : (
                                <button className="btn btn-ghost" style={{ height: 34, fontSize: 13, flexShrink: 0 }} onClick={() => setEditing(true)}>Chỉnh sửa</button>
                            )}
                        </div>
                    </Section>

                    {/* ─── Học tập ─── */}
                    <Section title="Học tập">
                        <Row label="Số thẻ mỗi phiên" desc="Số thẻ tối đa trong Flashcard / Learn"
                            right={
                                <select className="settings-select"
                                    value={settings.cardsPerSession === 'all' ? 'all' : String(settings.cardsPerSession)}
                                    onChange={e => update({ cardsPerSession: e.target.value === 'all' ? 'all' : Number(e.target.value) })}>
                                    <option value="10">10 thẻ</option>
                                    <option value="20">20 thẻ</option>
                                    <option value="30">30 thẻ</option>
                                    <option value="all">Tất cả</option>
                                </select>
                            } />
                        <Row label="Xáo trộn thẻ" desc="Ngẫu nhiên thứ tự khi bắt đầu học"
                            right={<Toggle checked={settings.shuffle} onChange={v => update({ shuffle: v })} />} />
                        <Row label="Tự phát âm" desc="Tự đọc thuật ngữ khi sang thẻ mới (Flashcard)"
                            right={<Toggle checked={settings.autoPlay} onChange={v => update({ autoPlay: v })} />} />
                        <Row label="Hiện phím tắt" desc="Hiện hướng dẫn phím tắt trong Flashcard"
                            right={<Toggle checked={settings.showShortcuts} onChange={v => update({ showShortcuts: v })} />} />
                        <Row label="Ngôn ngữ định nghĩa" desc="Ngôn ngữ mặc định khi tạo bộ thẻ mới"
                            right={
                                <select className="settings-select" value={settings.defLang}
                                    onChange={e => update({ defLang: e.target.value as 'vi' | 'en' | 'ja' })}>
                                    <option value="vi">🇻🇳 Tiếng Việt</option>
                                    <option value="en">🇬🇧 English</option>
                                    <option value="ja">🇯🇵 日本語</option>
                                </select>
                            } />
                    </Section>

                    {/* ─── Giao diện ─── */}
                    <Section title="Giao diện">
                        <Row label="Chế độ tối" desc="Đổi giao diện sang màu tối"
                            right={<Toggle checked={settings.darkMode} onChange={v => update({ darkMode: v })} />} />
                    </Section>

                    {/* ─── Dữ liệu ─── */}
                    <Section title="Dữ liệu & Tài khoản">
                        <Row label="Xuất dữ liệu" desc="Tải xuống tất cả bộ thẻ (JSON)"
                            right={
                                <button className="btn btn-ghost" style={{ height: 32, fontSize: 13 }}
                                    onClick={async () => {
                                        try {
                                            const sets = await api.getSets()
                                            const blob = new Blob([JSON.stringify(sets, null, 2)], { type: 'application/json' })
                                            const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                                            a.download = 'lingoace-export.json'; a.click()
                                        } catch { alert('Xuất thất bại!') }
                                    }}>📥 Xuất JSON</button>
                            } />
                        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                            <div className="settings-row-label" style={{ color: 'var(--danger)' }}>Xoá tài khoản</div>
                            <div className="settings-row-desc">Xoá vĩnh viễn tất cả bộ thẻ và dữ liệu</div>
                            <button onClick={() => confirm('Bạn thực sự muốn xoá tất cả?')}
                                style={{
                                    padding: '8px 16px', background: 'transparent', border: '1.5px solid #fca5a5',
                                    borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, color: 'var(--danger)', cursor: 'pointer'
                                }}>
                                🗑️ Xoá tài khoản
                            </button>
                        </div>
                    </Section>

                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>LingoAce v1.0.0 · Built with ❤️</p>
                </div>
            </div>
        </>
    )
}