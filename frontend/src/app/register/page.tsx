// PATH: src/app/register/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import '../login/auth.css'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPwd, setShowPwd] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            const res = await fetch(`${BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Đăng ký thất bại'); return }
            auth.save(data.token, data.user)
            router.push('/')
        } catch { setError('Không kết nối được server') }
        finally { setLoading(false) }
    }

    const pwdStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span>Lingo<strong>Ace</strong></span>
                </div>

                <h1 className="auth-title">Tạo tài khoản miễn phí</h1>
                <p className="auth-sub">Bắt đầu hành trình học từ vựng của bạn</p>

                {error && <div className="auth-error">⚠️ {error}</div>}

                <form onSubmit={submit} className="auth-form">
                    <div className="auth-field">
                        <label>Họ tên</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            placeholder="Nguyễn Văn A" autoFocus />
                    </div>
                    <div className="auth-field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="email@example.com" required />
                    </div>
                    <div className="auth-field">
                        <label>Mật khẩu</label>
                        <div className="auth-pwd-wrap">
                            <input type={showPwd ? 'text' : 'password'} value={password}
                                onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" required />
                            <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd(s => !s)}>
                                {showPwd ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {password.length > 0 && (
                            <div className="auth-pwd-strength">
                                <div className="auth-pwd-bars">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`auth-pwd-bar ${i <= pwdStrength ? ['', 'weak', 'medium', 'strong'][pwdStrength] : ''}`} />
                                    ))}
                                </div>
                                <span>{['', 'Yếu', 'Trung bình', 'Mạnh'][pwdStrength]}</span>
                            </div>
                        )}
                    </div>
                    <button type="submit" className="auth-btn primary" disabled={loading}>
                        {loading ? '⟳ Đang tạo tài khoản...' : '✓ Tạo tài khoản'}
                    </button>
                </form>

                <div className="auth-features">
                    {['🃏 Tạo bộ thẻ không giới hạn', '📊 Theo dõi tiến độ học', '🎓 Learn mode thông minh'].map(f => (
                        <div key={f} className="auth-feature-item">
                            <span>✓</span> {f}
                        </div>
                    ))}
                </div>

                <p className="auth-footer">
                    Đã có tài khoản? <Link href="/login">Đăng nhập →</Link>
                </p>
            </div>
            <div className="auth-bg-deco" />
        </div>
    )
}