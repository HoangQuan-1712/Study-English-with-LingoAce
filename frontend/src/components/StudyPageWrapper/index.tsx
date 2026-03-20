// PATH: src/components/StudyPageWrapper/index.tsx
'use client'
import { useSet } from '@/hooks/useSets'
import type { Card } from '@/lib/api'
import StudyLayout from '@/components/StudyLayout'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
    setId: string
    children: (props: { cards: Card[]; setId: string; setTitle: string }) => React.ReactNode
}

export default function StudyPageWrapper({ setId, children }: Props) {
    const { set, loading, error } = useSet(setId)

    if (loading) return (
        <div style={{
            position: 'fixed', inset: 0, background: 'var(--bg-page)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12
        }}>
            <Loader2 size={40} style={{ animation: 'spin .8s linear infinite', color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Đang tải bộ thẻ...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (error || !set) return (
        <div style={{
            position: 'fixed', inset: 0, background: 'var(--bg-page)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
        }}>
            <div style={{ fontSize: 52 }}>😕</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>Không tìm thấy bộ thẻ</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{error}</p>
            <Link href="/"><button className="btn btn-ghost">← Về trang chủ</button></Link>
        </div>
    )

    return <>{children({ cards: set.cards, setId, setTitle: set.title })}</>
}