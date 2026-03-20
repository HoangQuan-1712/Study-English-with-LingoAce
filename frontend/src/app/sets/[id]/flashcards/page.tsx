'use client'
// PATH: src/app/sets/[id]/flashcards/page.tsx
import { use } from 'react'
import { useSet } from '@/hooks/useSets'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import FlashcardViewer from '@/components/FlashcardViewer'



function Page({ id }: { id: string }) {
    const { set, loading, error } = useSet(id)
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
            <Loader2 size={32} style={{ animation: 'spin .8s linear infinite', color: 'var(--accent)' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
    if (error || !set) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
            <p style={{ fontSize: 40 }}>😕</p>
            <p style={{ color: 'var(--text-muted)' }}>{error || 'Không tìm thấy bộ thẻ'}</p>
            <Link href="/library"><button className="btn btn-ghost">← Thư viện</button></Link>
        </div>
    )
    return <FlashcardViewer cards={set.cards} setId={id} setTitle={set.title} />
}

export default function Page_flashcards({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <Page id={id} />
}