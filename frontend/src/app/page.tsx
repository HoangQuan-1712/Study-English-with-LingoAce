'use client'
import Link from 'next/link'
import Topbar from '@/components/Topbar'
import { useSets } from '@/hooks/useSets'
import { api } from '@/lib/api'
import { useState, useEffect } from 'react'
import './page.css'

const COLORS = ['#4255ff', '#ff4b4b', '#23b26d', '#ff9500', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6']

function SkeletonCard() {
  return (
    <div className="home-set-card" style={{ pointerEvents: 'none', cursor: 'default' }}>
      <div style={{ height: 3, background: '#eef0f8', borderRadius: 99 }} />
      <div style={{ height: 16, width: '65%', background: '#eef0f8', borderRadius: 6, margin: '14px 0 8px' }} />
      <div style={{ height: 12, width: '35%', background: '#eef0f8', borderRadius: 6 }} />
    </div>
  )
}

function StatCard({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-xl)',
      padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flex: 1
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { sets, loading, error, reload, removeSet } = useSets(1)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [stats, setStats] = useState<{ totalSets: number; totalCards: number; streak: number } | null>(null)

  useEffect(() => {
    api.getStats().then(setStats).catch(() => { })
  }, [sets.length])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Xoá bộ thẻ này?')) return
    setDeleting(id)
    try { await api.deleteSet(id); removeSet(id) }
    catch { alert('Xoá thất bại!') }
    finally { setDeleting(null) }
  }

  const recentSets = sets.slice(0, 6)

  return (
    <>
      <Topbar />
      <div className="page-body">

        {/* Stats row */}
        {!error && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <StatCard icon="📚" value={stats?.totalSets ?? sets.length} label="Bộ thẻ" color="#4255ff" />
            <StatCard icon="🃏" value={stats?.totalCards ?? sets.reduce((s, x) => s + x.cards.length, 0)} label="Thuật ngữ" color="#23b26d" />
            <StatCard icon="🔥" value={`${stats?.streak ?? 0} ngày`} label="Streak" color="#ff9500" />
          </div>
        )}

        {/* Continue banner */}
        {!loading && !error && sets[0] && (
          <div className="home-continue">
            <div style={{ flex: 1 }}>
              <p className="home-continue-label">Tiếp tục học</p>
              <h2 className="home-continue-title">{sets[0].title}</h2>
              <div className="home-progress-bar">
                <div className="home-progress-fill" style={{ width: '40%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Link href={`/sets/${sets[0].id}/flashcards`}>
                  <button className="btn btn-primary">🃏 Thẻ ghi nhớ</button>
                </Link>
                <Link href={`/sets/${sets[0].id}/quiz`}>
                  <button className="btn btn-ghost" style={{ height: 38 }}>📝 Kiểm tra</button>
                </Link>
              </div>
            </div>
            <div className="home-continue-emoji">📚</div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="page-title" style={{ marginBottom: 0 }}>Gần đây</h2>
          {!loading && sets.length > 0 && (
            <Link href="/library" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Xem tất cả →
            </Link>
          )}
        </div>
        <p className="page-subtitle">{loading ? 'Đang tải...' : `${sets.length} bộ thẻ`}</p>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff8f0', border: '1.5px solid #fed7aa', borderRadius: 'var(--radius-lg)',
            padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#c2410c', margin: '0 0 4px' }}>Không kết nối được server</p>
              <p style={{ fontSize: 13, color: '#9a3412', margin: '0 0 10px' }}>
                Kiểm tra backend đang chạy tại <code style={{ background: '#ffedd5', padding: '1px 6px', borderRadius: 4 }}>localhost:5000</code>
              </p>
              <button className="btn btn-ghost" style={{ height: 30, fontSize: 12 }} onClick={reload}>🔄 Thử lại</button>
            </div>
          </div>
        )}

        {loading && <div className="home-grid">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>}

        {!loading && !error && sets.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Chưa có bộ thẻ nào</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Tạo bộ thẻ đầu tiên để bắt đầu học!</p>
            <Link href="/create"><button className="btn btn-primary" style={{ height: 42, fontSize: 15 }}>+ Tạo bộ thẻ đầu tiên</button></Link>
          </div>
        )}

        {!loading && recentSets.length > 0 && (
          <div className="home-grid">
            {recentSets.map((set, i) => {
              const color = set.color || COLORS[i % COLORS.length]
              const isDel = deleting === set.id
              return (
                <Link key={set.id} href={`/sets/${set.id}`} className="home-set-card"
                  style={{ opacity: isDel ? 0.5 : 1, pointerEvents: isDel ? 'none' : 'auto' }}>
                  <div className="home-set-accent" style={{ background: color }} />
                  <div className="home-set-title">{set.title}</div>
                  {set.description && (
                    <div style={{
                      fontSize: 12, color: 'var(--text-muted)', marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {set.description}
                    </div>
                  )}
                  <div className="home-set-count">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /></svg>
                    {set.cards.length} thuật ngữ
                  </div>
                  <div className="home-set-footer">
                    <div className="home-set-avatar" style={{ background: color + '22' }}>👤</div>
                    <span className="home-set-author">Bạn</span>
                    <button onClick={e => handleDelete(e, set.id)} title="Xoá"
                      style={{
                        marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: 14
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = '#fff0f0' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}>
                      🗑️
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </div>
    </>
  )
}