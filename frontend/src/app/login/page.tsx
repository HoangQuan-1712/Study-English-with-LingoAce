// PATH: src/app/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import './auth.css'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPwd, setShowPwd] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            const res = await fetch(`${BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Đăng nhập thất bại'); return }
            auth.save(data.token, data.user)
            router.push('/')
        } catch { setError('Không kết nối được server') }
        finally { setLoading(false) }
    }

    const guestLogin = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BASE}/api/auth/guest`, { method: 'POST' })
            const data = await res.json()
            auth.save(data.token, data.user)
            router.push('/')
        } catch { setError('Lỗi') }
        finally { setLoading(false) }
    }

    return (
        <div className="auth-shell">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span>Lingo<strong>Ace</strong></span>
                </div>

                <h1 className="auth-title">Chào mừng trở lại</h1>
                <p className="auth-sub">Đăng nhập để tiếp tục học tập</p>

                {error && <div className="auth-error">⚠️ {error}</div>}

                <form onSubmit={submit} className="auth-form">
                    <div className="auth-field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="email@example.com" required autoFocus />
                    </div>
                    <div className="auth-field">
                        <label>Mật khẩu</label>
                        <div className="auth-pwd-wrap">
                            <input type={showPwd ? 'text' : 'password'} value={password}
                                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                            <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd(s => !s)}>
                                {showPwd ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="auth-btn primary" disabled={loading}>
                        {loading ? '⟳ Đang đăng nhập...' : '→ Đăng nhập'}
                    </button>
                </form>

                <div className="auth-divider"><span>hoặc</span></div>

                <button className="auth-btn guest" onClick={guestLogin} disabled={loading}>
                    👤 Dùng thử không cần tài khoản
                </button>

                <p className="auth-footer">
                    Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí →</Link>
                </p>
            </div>

            {/* Background decoration */}
            <div className="auth-bg-deco" />
        </div>
    )
}