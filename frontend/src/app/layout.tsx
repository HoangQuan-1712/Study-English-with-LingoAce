// PATH: src/app/layout.tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import ConditionalLayout from '@/components/ConditionalLayout'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = { title: 'LingoAce', description: 'Học từ vựng thông minh' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={geist.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `try{var s=JSON.parse(localStorage.getItem('lingoace_settings')||'{}');if(s.darkMode)document.documentElement.setAttribute('data-theme','dark');}catch(e){}` }} />
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}