// src/app/short-story/page.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStoryStore, StoryField } from '@/store/storyStore'
import { useState } from 'react'
import GridLoader from '../../GridLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'

const FIELD_LABELS: Record<StoryField, string> = {
  genre: '장르',
  era: '시대',
  mood: '분위기',
  keywords: '핵심 단서',
}

const FIELD_PLACEHOLDERS: Record<StoryField, string> = {
  genre: '예) 판타지, 로맨스, 미스터리...',
  era: '예) 중세, 현대, 미래...',
  mood: '예) 몽환적, 긴박한, 따뜻한...',
  keywords: '예) 마법사, 비밀 결사, 잃어버린 왕국...',
}

export default function ShortStoryPage() {
  const router = useRouter()
  const store = useStoryStore()
  const { setField } = store
  const { session } = useAuthGuard()
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch('/api/short-story', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          genre: store.genre,
          era: store.era,
          mood: store.mood,
          keywords: store.keywords,
        }),
      })
      const data = await res.json()
      setResult(data.story ?? data.error ?? '생성 실패')
    } catch {
      setResult('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1a1412] flex flex-col items-center justify-center font-serif">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_38%,_rgba(180,118,36,0.15),_transparent)] pointer-events-none" />
        <GridLoader color="#d4b483" />
        <p className="mt-6 text-[#d4b483] tracking-widest animate-pulse">양피지에 이야기를 새기는 중...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#1a1412] font-serif relative overflow-x-hidden">
      {/* 캔들라이트 방사형 광원 */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_38%,_rgba(180,118,36,0.15),_transparent)] pointer-events-none" />
      {/* 양피지 질감 */}
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* 뒤로가기 */}
        <motion.button
          onClick={() => router.push('/')}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[#d4b483]/60 hover:text-[#d4b483] transition-colors text-sm tracking-widest flex items-center gap-2"
        >
          ← 별빛 도서관으로
        </motion.button>

        {/* 메인 양피지 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative bg-[#f4e4bc] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-[#d4b483]/50 overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
          />

          {/* 상단 헤더 */}
          <div className="relative p-8 pb-6 border-b border-[#d4b483]/50 flex flex-col items-center">
            <div className="flex items-center gap-4 mb-5 opacity-40">
              <div className="w-16 h-px bg-[#8d6e63]" />
              <span className="text-[#8d6e63] text-xs tracking-[0.5em]">✦</span>
              <div className="w-16 h-px bg-[#8d6e63]" />
            </div>
            <h1 className="text-3xl font-bold text-[#5d4037] tracking-wide">단편 소설 짓기</h1>
            <p className="mt-2 text-sm text-[#8d6e63] tracking-wider">조각을 확인하고, 이야기를 소환하세요</p>
          </div>

          {/* 입력 필드 */}
          <div className="relative p-8 grid grid-cols-1 md:grid-cols-2 gap-7">
            {(Object.keys(FIELD_LABELS) as StoryField[]).map((field, i) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="flex flex-col gap-2"
              >
                <label className="text-xs font-bold text-[#8d6e63] tracking-[0.25em] uppercase">
                  {FIELD_LABELS[field]}
                </label>
                <input
                  type="text"
                  value={store[field]}
                  onChange={(e) => setField(field, e.target.value)}
                  placeholder={FIELD_PLACEHOLDERS[field]}
                  className="bg-transparent border-b border-[#a1887f] px-1 py-2 text-[#3e2723] text-base focus:outline-none focus:border-[#5d4037] transition-colors placeholder-[#a1887f]/50"
                />
              </motion.div>
            ))}
          </div>

          {/* 생성 버튼 */}
          <div className="relative p-8 pt-0">
            <motion.button
              onClick={handleGenerate}
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] font-bold text-lg tracking-widest rounded border border-[#5d4037] shadow-[0_4px_15px_rgba(0,0,0,0.35)] transition-colors disabled:opacity-50"
            >
              📖 이야기 생성하기
            </motion.button>
          </div>
        </motion.div>

        {/* 결과 — 양피지 두루마리 */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              className="relative bg-[#f4e4bc] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-[#d4b483]/50 overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
              />

              {/* 결과 헤더 */}
              <div className="relative p-6 border-b border-[#d4b483]/50 flex items-center justify-center gap-3">
                <div className="w-12 h-px bg-[#8d6e63] opacity-50" />
                <span className="text-[#8d6e63] text-xs opacity-60">✦</span>
                <span className="text-xl font-bold text-[#5d4037] tracking-wider">소환된 이야기</span>
                <span className="text-[#8d6e63] text-xs opacity-60">✦</span>
                <div className="w-12 h-px bg-[#8d6e63] opacity-50" />
              </div>

              {/* 본문 */}
              <div className="relative p-8">
                <p className="text-[#3e2723] leading-loose text-base whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:text-[#8d6e63] first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                  {result}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  )
}
