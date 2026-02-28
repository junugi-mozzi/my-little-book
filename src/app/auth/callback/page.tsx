// src/app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        router.push('/')
      })
    } else {
      router.push('/')
    }
  }, [router])

  return (
    <main className="min-h-screen bg-[#1a1412] flex flex-col items-center justify-center font-serif gap-4">
      <div className="w-10 h-10 border-4 border-transparent rounded-full animate-spin border-t-[#d4b483] border-l-[#d4b483]" />
      <p className="text-[#d4b483] tracking-widest animate-pulse">별빛 도서관으로 입장 중...</p>
    </main>
  )
}
