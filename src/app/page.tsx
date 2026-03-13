// src/app/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import MedievalHero from '@/components/MedievalHero'
import { useStoryStore } from '@/store/storyStore'

export default function Home() {
  const router = useRouter()
  const resetStoryContext = useStoryStore((s) => s.resetStoryContext)
  return (
    <MedievalHero
      onEnter={() => {
        resetStoryContext()
        router.push('/story')
      }}
    />
  )
}
