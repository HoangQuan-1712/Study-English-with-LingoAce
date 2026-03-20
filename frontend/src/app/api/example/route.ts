// PATH: src/app/api/example/route.ts
import { NextResponse } from 'next/server'

const cache = new Map<string, { en: string; vi: string }>()
const pending = new Map<string, Promise<{ en: string; vi: string } | null>>()

async function callOllama(term: string, definition: string): Promise<{ en: string; vi: string } | null> {
    const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'qwen2.5:3b',
            prompt: `Give ONE short example sentence (max 12 words) using the English word "${term}" (meaning: ${definition}). Reply ONLY with valid JSON: {"en":"<sentence>","vi":"<Vietnamese translation>"}. No markdown.`,
            stream: false,
            format: 'json'
        })
    })

    if (!res.ok) throw new Error(`Ollama ${res.status}`)

    const data = await res.json()
    // Ollama trả về { response: "..." }
    const parsed = typeof data.response === 'string' ? JSON.parse(data.response) : data.response
    if (!parsed?.en || !parsed?.vi) throw new Error('Bad format')
    return { en: parsed.en, vi: parsed.vi }
}

export async function POST(req: Request) {
    try {
        const { term, definition } = await req.json()
        if (!term) return NextResponse.json({ error: 'Missing term' }, { status: 400 })

        const key = term.toLowerCase().trim()

        // Cache hit
        if (cache.has(key)) return NextResponse.json(cache.get(key))

        // Đang pending — đợi luôn, không gọi thêm (fix StrictMode double-invoke)
        if (pending.has(key)) {
            const r = await pending.get(key)
            return r ? NextResponse.json(r) : NextResponse.json({ error: 'Failed' }, { status: 500 })
        }

        const promise = callOllama(term, definition || '')
            .then(r => {
                cache.set(key, r!)
                if (cache.size > 500) cache.delete(cache.keys().next().value!)
                return r
            })
            .catch(err => { console.error('[example]', err.message); return null })
            .finally(() => pending.delete(key))

        pending.set(key, promise)
        const result = await promise
        return result
            ? NextResponse.json(result)
            : NextResponse.json({ error: 'Ollama failed' }, { status: 500 })

    } catch (err: any) {
        console.error('[example] Server error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}