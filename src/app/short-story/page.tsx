// src/app/short-story/page.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStoryStore } from '@/store/storyStore'
import { useState } from 'react'
import GridLoader from '../../GridLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import BookCover from '@/components/BookCover'

const CONTEXT_LABELS = [
  { key: 'atmosphere', label: '분위기/세계' },
  { key: 'wound', label: '이야기의 상처' },
  { key: 'direction', label: '이야기의 방향' },
  { key: 'tension', label: '이야기의 긴장' },
  { key: 'resonance', label: '독자의 울림' },
] as const

export default function ShortStoryPage() {
  const router = useRouter()
  const store = useStoryStore()
  const { user, session } = useAuthGuard()
  const [result, setResult] = useState<string>('')
  const [storyTitle, setStoryTitle] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverLoading, setCoverLoading] = useState(false)

  const handleSave = async () => {
    if (!result || savedId || saving) return
    setSaving(true)
    const { data } = await supabase
      .from('library')
      .insert({
        genre: store.atmosphere,
        era: store.wound,
        mood: store.resonance,
        keywords: `${store.direction} / ${store.tension}`,
        title: storyTitle || null,
        type: 'short',
        content: result,
        user_id: user?.id ?? null,
        cover_url: coverUrl ?? null,
      })
      .select('id')
      .single()
    if (data?.id) setSavedId(data.id)
    setSaving(false)
  }

  const fetchCover = async () => {
    setCoverUrl(null)
    setCoverLoading(true)
    try {
      const res = await fetch('/api/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atmosphere: store.atmosphere,
          wound: store.wound,
          direction: store.direction,
          tension: store.tension,
          resonance: store.resonance,
          title: storyTitle,
        }),
      })
      const data = await res.json()
      if (data.imageUrl) setCoverUrl(data.imageUrl)
    } catch {
      // 표지 실패 시 CSS 표지 유지
    } finally {
      setCoverLoading(false)
    }
  }

  const handleGenerate = async () => {
    setSavedId(null)
    setCoverUrl(null)
    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch('/api/short-story', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          atmosphere: store.atmosphere,
          wound: store.wound,
          direction: store.direction,
          tension: store.tension,
          resonance: store.resonance,
        }),
      })
      const data = await res.json()
      setResult(data.story ?? data.error ?? '생성 실패')
      setStoryTitle(data.title ?? '')
      // 소설 완성 후 표지 이미지 백그라운드 생성
      fetchCover()
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
            <p className="mt-2 text-sm text-[#8d6e63] tracking-wider">루미스가 모은 이야기 조각으로 소설을 소환합니다</p>
          </div>

          {/* 수집된 이야기 조각 표시 */}
          <div className="relative p-8 space-y-4">
            {CONTEXT_LABELS.map(({ key, label }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="flex gap-4 border-b border-[#d4b483]/40 pb-3"
              >
                <span className="text-xs font-bold text-[#8d6e63] tracking-widest uppercase shrink-0 w-24 pt-0.5">{label}</span>
                <span className="text-[#3e2723] text-sm leading-relaxed">{store[key] || '—'}</span>
              </motion.div>
            ))}
          </div>

          {/* 생성 버튼 */}
          <div className="relative p-8 pt-0">
            <motion.button
              onClick={handleGenerate}
              disabled={loading || !store.atmosphere}
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

              {/* 책 표지 */}
              <div className="relative flex flex-col items-center pt-8 pb-2 gap-4">
                <div className="relative">
                  <BookCover genre={store.atmosphere} era={store.wound} mood={store.resonance} title={storyTitle} size="md" imageUrl={coverUrl ?? undefined} />
                  {coverLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                      <span className="text-[#d4b483] text-xs tracking-widest animate-pulse">표지 생성 중...</span>
                    </div>
                  )}
                </div>
                {storyTitle && (
                  <p className="text-[#5d4037] text-lg font-bold tracking-wide text-center px-4">{storyTitle}</p>
                )}
              </div>

              {/* 본문 */}
              <div className="relative p-8 pt-6">
                <p className="text-[#3e2723] leading-loose text-base whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:text-[#8d6e63] first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                  {result}
                </p>
              </div>

              {/* 저장 버튼 */}
              <div className="relative px-8 pb-8 flex justify-end border-t border-[#d4b483]/30 pt-5">
                {savedId ? (
                  <span className="text-[#8d6e63] text-sm tracking-widest flex items-center gap-2">
                    ✦ 서재에 저장되었습니다
                  </span>
                ) : (
                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-sm rounded border border-[#5d4037] tracking-widest transition-colors disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '📚 서재에 저장하기'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  )
}
