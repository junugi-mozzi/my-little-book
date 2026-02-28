// src/app/long-story/page.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStoryStore, StoryField } from '@/store/storyStore'
import { useState } from 'react'
import GridLoader from '../../GridLoader'

const FIELD_LABELS: Record<StoryField, string> = {
  genre: '장르',
  era: '시대',
  mood: '분위기',
  keywords: '핵심 단서',
}

const STATUS_MAP = {
  pending:    { label: '대기 중',  style: 'text-[#a1887f] border-[#a1887f]/40 bg-[#e8dcc4]' },
  generating: { label: '집필 중',  style: 'text-[#d4b483] border-[#d4b483]/60 bg-[#eddfc0]' },
  completed:  { label: '완성',     style: 'text-[#5d4037] border-[#8d6e63]/60 bg-[#e0cfa0]' },
}

export default function LongStoryPage() {
  const router = useRouter()
  const store = useStoryStore()
  const { outline, setOutline, setField } = store
  const [loading, setLoading] = useState(false)

  const handleGenerateOutline = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/long-story/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: store.genre,
          era: store.era,
          mood: store.mood,
          keywords: store.keywords,
        }),
      })
      const data = await res.json()
      if (data.outline) {
        setOutline(data.outline)
      }
    } catch {
      console.error('아웃라인 생성 실패')
    } finally {
      setLoading(false)
    }
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

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 space-y-8">

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

        {/* 입력 + 생성 양피지 카드 */}
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

          {/* 헤더 */}
          <div className="relative p-8 pb-6 border-b border-[#d4b483]/50 flex flex-col items-center">
            <div className="flex items-center gap-4 mb-5 opacity-40">
              <div className="w-16 h-px bg-[#8d6e63]" />
              <span className="text-[#8d6e63] text-xs tracking-[0.5em]">✦</span>
              <div className="w-16 h-px bg-[#8d6e63]" />
            </div>
            <h1 className="text-3xl font-bold text-[#5d4037] tracking-wide">장편 소설로 엮기</h1>
            <p className="mt-2 text-sm text-[#8d6e63] tracking-wider">마도서의 목차를 먼저 소환합니다</p>
          </div>

          {/* 입력 필드 */}
          <div className="relative p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
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
                  placeholder={FIELD_LABELS[field]}
                  className="bg-transparent border-b border-[#a1887f] px-1 py-2 text-[#3e2723] text-sm focus:outline-none focus:border-[#5d4037] transition-colors placeholder-[#a1887f]/50"
                />
              </motion.div>
            ))}
          </div>

          {/* 생성 버튼 */}
          <div className="relative p-8 pt-0">
            <motion.button
              onClick={handleGenerateOutline}
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-[#d4b483] hover:bg-[#c6a165] text-[#3e2723] font-bold text-lg tracking-widest rounded border border-[#8d6e63] shadow-[0_4px_15px_rgba(0,0,0,0.35)] transition-colors disabled:opacity-50"
            >
              ✨ 아웃라인 생성하기
            </motion.button>
          </div>
        </motion.div>

        {/* 로딩 */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-10"
          >
            <GridLoader color="#d4b483" />
            <p className="mt-6 text-[#d4b483] tracking-widest animate-pulse">목차를 구성하는 중...</p>
          </motion.div>
        )}

        {/* 챕터 목록 */}
        <AnimatePresence>
          {outline.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* 목차 구분선 */}
              <div className="flex items-center gap-4 opacity-55">
                <div className="flex-1 h-px bg-[#d4b483]" />
                <span className="text-[#d4b483] text-xs tracking-[0.4em] uppercase">소설 목차</span>
                <div className="flex-1 h-px bg-[#d4b483]" />
              </div>

              {outline.map((chapter, i) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="relative bg-[#f4e4bc] rounded-xl border border-[#d4b483]/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
                  />

                  {/* 왼쪽 챕터 번호 마진 선 */}
                  <div className="absolute top-0 left-16 bottom-0 w-px bg-[#d4b483]/30" />

                  <div className="relative flex">
                    {/* 챕터 번호 */}
                    <div className="w-16 shrink-0 flex flex-col items-center justify-start pt-6 pb-6">
                      <span className="text-xs text-[#a1887f] tracking-widest uppercase">제</span>
                      <span className="text-2xl font-bold text-[#8d6e63] leading-none">{chapter.id}</span>
                      <span className="text-xs text-[#a1887f] tracking-widest uppercase">장</span>
                    </div>

                    {/* 본문 */}
                    <div className="flex-1 p-6 pl-7 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-lg font-bold text-[#5d4037] leading-snug">{chapter.title}</h3>
                        <span className={`shrink-0 text-xs px-2.5 py-1 rounded border tracking-wider ${STATUS_MAP[chapter.status].style}`}>
                          {STATUS_MAP[chapter.status].label}
                        </span>
                      </div>

                      <p className="text-[#6d4c41] text-sm leading-relaxed italic">{chapter.summary}</p>

                      <div className="w-full h-px bg-[#d4b483]/35 my-1" />

                      <motion.button
                        disabled={chapter.status === 'generating'}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="self-end px-5 py-2 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-sm rounded border border-[#5d4037] transition-colors disabled:opacity-40 tracking-widest"
                      >
                        이 챕터 집필하기
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* 하단 장식 */}
              <div className="flex items-center justify-center gap-4 pt-4 opacity-30">
                <div className="w-20 h-px bg-[#d4b483]" />
                <span className="text-[#d4b483] text-xs tracking-[0.4em]">✦ ✦ ✦</span>
                <div className="w-20 h-px bg-[#d4b483]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  )
}
