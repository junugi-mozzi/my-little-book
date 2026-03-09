// src/app/long-story/page.tsx
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

const STATUS_MAP = {
  pending:    { label: '대기 중',  style: 'text-[#a1887f] border-[#a1887f]/40 bg-[#e8dcc4]' },
  generating: { label: '집필 중',  style: 'text-[#d4b483] border-[#d4b483]/60 bg-[#eddfc0]' },
  completed:  { label: '완성',     style: 'text-[#5d4037] border-[#8d6e63]/60 bg-[#e0cfa0]' },
}

export default function LongStoryPage() {
  const router = useRouter()
  const store = useStoryStore()
  const { outline, setOutline, updateChapterContent, updateChapterStatus } = store
  const { user, session } = useAuthGuard()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [storyTitle, setStoryTitle] = useState<string>('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverLoading, setCoverLoading] = useState(false)

  const handleSave = async () => {
    if (outline.length === 0 || savedId || saving) return
    setSaving(true)
    const { data } = await supabase
      .from('library')
      .insert({
        genre: store.atmosphere,
        era: store.wound,
        mood: store.resonance,
        keywords: `${store.direction} / ${store.tension}`,
        title: storyTitle || null,
        type: 'long',
        outline,
        user_id: user?.id ?? null,
        cover_url: coverUrl ?? null,
      })
      .select('id')
      .single()
    if (data?.id) setSavedId(data.id)
    setSaving(false)
  }

  const handleGenerateChapter = async (chapterId: number) => {
    const chapter = outline.find(c => c.id === chapterId)
    if (!chapter) return
    updateChapterStatus(chapterId, 'generating')
    try {
      const res = await fetch('/api/long-story/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atmosphere: store.atmosphere,
          wound: store.wound,
          direction: store.direction,
          tension: store.tension,
          resonance: store.resonance,
          chapterId,
          chapterTitle: chapter.title,
          chapterSummary: chapter.summary,
          allChapters: outline.map(c => ({ id: c.id, title: c.title, summary: c.summary })),
        }),
      })
      const data = await res.json()
      if (data.content) {
        updateChapterContent(chapterId, data.content)
      } else {
        updateChapterStatus(chapterId, 'pending')
      }
    } catch {
      updateChapterStatus(chapterId, 'pending')
    }
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

  const handleGenerateOutline = async () => {
    setSavedId(null)
    setCoverUrl(null)
    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch('/api/long-story/outline', {
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
      if (data.outline) {
        setOutline(data.outline)
        setStoryTitle(data.title ?? '')
        // 아웃라인 완성 후 표지 이미지 백그라운드 생성
        fetchCover()
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
            <p className="mt-2 text-sm text-[#8d6e63] tracking-wider">스토리의 목차를 먼저 생성합니다</p>
          </div>

          {/* 수집된 이야기 조각 표시 */}
          <div className="relative p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTEXT_LABELS.map(({ key, label }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="flex flex-col gap-1 border-b border-[#d4b483]/40 pb-3"
              >
                <span className="text-xs font-bold text-[#8d6e63] tracking-widest uppercase">{label}</span>
                <span className="text-[#3e2723] text-sm leading-relaxed">{store[key] || '—'}</span>
              </motion.div>
            ))}
          </div>

          {/* 생성 버튼 */}
          <div className="relative p-8 pt-0">
            <motion.button
              onClick={handleGenerateOutline}
              disabled={loading || !store.atmosphere}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-[#d4b483] hover:bg-[#c6a165] text-[#3e2723] font-bold text-lg tracking-widest rounded border border-[#8d6e63] shadow-[0_4px_15px_rgba(0,0,0,0.35)] transition-colors disabled:opacity-50"
            >
              ✨ 이야기 생성하기
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

              {/* 책 표지 */}
              <div className="flex flex-col items-center py-2 gap-3">
                <div className="relative">
                  <BookCover genre={store.atmosphere} era={store.wound} mood={store.resonance} title={storyTitle} size="md" imageUrl={coverUrl ?? undefined} />
                  {coverLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                      <span className="text-[#d4b483] text-xs tracking-widest animate-pulse">표지 생성 중...</span>
                    </div>
                  )}
                </div>
                {storyTitle && (
                  <p className="text-[#d4b483] text-base font-bold tracking-wide text-center">{storyTitle}</p>
                )}
              </div>

              {outline.map((chapter, i) => {
                const prevChapter = i > 0 ? outline[i - 1] : null
                const isBlocked = prevChapter !== null && prevChapter.status !== 'completed'
                return (
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
                        onClick={() => handleGenerateChapter(chapter.id)}
                        disabled={chapter.status === 'generating' || chapter.status === 'completed' || isBlocked}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="self-end px-5 py-2 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-sm rounded border border-[#5d4037] transition-colors disabled:opacity-40 tracking-widest"
                      >
                        {isBlocked ? '🔒 이전 챕터 먼저' : chapter.status === 'generating' ? '집필 중...' : chapter.status === 'completed' ? '✦ 완성됨' : '이 챕터 집필하기'}
                      </motion.button>

                      {/* 완성된 챕터 본문 */}
                      {chapter.status === 'completed' && chapter.content && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 pt-4 border-t border-[#d4b483]/40"
                        >
                          <p className="text-[#3e2723] text-sm leading-loose whitespace-pre-wrap">
                            {chapter.content}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )})}

              {/* 저장 버튼 */}
              <div className="flex justify-end pt-2">
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
                    className="px-6 py-2.5 bg-[#d4b483] hover:bg-[#c6a165] text-[#3e2723] text-sm font-semibold rounded border border-[#8d6e63] tracking-widest transition-colors disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '📚 서재에 저장하기'}
                  </motion.button>
                )}
              </div>

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
