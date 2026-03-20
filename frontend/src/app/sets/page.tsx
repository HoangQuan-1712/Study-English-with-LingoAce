// /sets → redirect về /library
import { redirect } from 'next/navigation'
export default function SetsPage() {
    redirect('/library')
}