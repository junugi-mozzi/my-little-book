// src/app/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import MedievalHero from '@/components/MedievalHero'

export default function Home() {
  const router = useRouter()
  return <MedievalHero onEnter={() => router.push('/story')} />
}
