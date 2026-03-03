// src/app/library/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import BookCover from '@/components/BookCover'

interface Story {
  id: string
  created_at: string
  genre: string
  era: string
  mood: string
  keywords: string
  type: 'short' | 'long'
  content: string | null
  outline: { id: number; title: string; summary: string; status: string }[] | null
}

export default function LibraryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthGuard()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Story | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return
    fetchStories()
  }, [user, authLoading])

  const fetchStories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (!error && data) setStories(data as Story[])
    setLoading(false)
  }

  const closeModal = () => {
    setSelected(null)
    setDeleteConfirm(false)
  }

  const deleteStory = async (id: string) => {
    setDeleting(true)
    const { error } = await supabase.from('stories').delete().eq('id', id)
    if (!error) {
      setStories(prev => prev.filter(s => s.id !== id))
      closeModal()
    }
    setDeleting(false)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-[#1a1412] font-serif relative overflow-x-hidden">
      {/* 캔들라이트 광원 */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_38%,_rgba(180,118,36,0.13),_transparent)] pointer-events-none" />
      {/* 양피지 질감 */}
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 space-y-8">

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

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center text-center gap-3"
        >
          <div className="flex items-center gap-4 opacity-40">
            <div className="w-16 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs tracking-[0.5em]">✦</span>
            <div className="w-16 h-px bg-[#d4b483]" />
          </div>
          <h1 className="text-3xl font-bold text-[#f4e4bc] tracking-wide">나의 서재</h1>
          <p className="text-sm text-[#a1887f] tracking-wider">엮어낸 이야기들이 잠들어 있다</p>
        </motion.div>

        {/* 로딩 */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-8 h-8 border-2 border-[#d4b483]/30 border-t-[#d4b483] rounded-full animate-spin" />
            <p className="text-[#d4b483]/60 text-sm tracking-widest animate-pulse">서재를 열고 있습니다...</p>
          </div>
        )}

        {/* 빈 서재 */}
        {!loading && stories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 gap-5"
          >
            <span className="text-6xl opacity-30">📖</span>
            <p className="text-[#a1887f] tracking-wider text-center">
              아직 엮어낸 이야기가 없습니다.<br />
              <span className="text-[#d4b483]/70">음유시인과 함께 첫 이야기를 시작해보세요.</span>
            </p>
            <motion.button
              onClick={() => router.push('/story')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-2 px-8 py-3 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-sm rounded border border-[#5d4037] tracking-widest transition-colors"
            >
              이야기 시작하기
            </motion.button>
          </motion.div>
        )}

        {/* 스토리 카드 그리드 */}
        {!loading && stories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {stories.map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelected(story)}
                className="relative bg-[#f4e4bc] rounded-xl border border-[#d4b483]/50 shadow-[0_8px_30px_rgba(0,0,0,0.55)] overflow-hidden cursor-pointer group"
              >
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
                />
                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-[#3e2723]/0 group-hover:bg-[#3e2723]/8 transition-colors duration-200 pointer-events-none rounded-xl" />

                <div className="relative p-6 flex flex-col gap-3">
                  {/* 책 표지 + 타입 뱃지 + 날짜 */}
                  <div className="flex items-start gap-3">
                    <BookCover genre={story.genre} era={story.era} mood={story.mood} size="sm" />
                    <div className="flex flex-col justify-between flex-1 self-stretch">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2.5 py-1 rounded border tracking-wider ${
                          story.type === 'short'
                            ? 'text-[#5d4037] border-[#8d6e63]/50 bg-[#e0cfa0]'
                            : 'text-[#a1887f] border-[#a1887f]/40 bg-[#e8dcc4]'
                        }`}>
                          {story.type === 'short' ? '단편' : '장편'}
                        </span>
                        <span className="text-[#a1887f] text-[10px] tracking-wider">{formatDate(story.created_at)}</span>
                      </div>
                      <div>
                        <p className="text-[#5d4037] font-bold text-sm leading-snug">{story.genre} · {story.era}</p>
                        <p className="text-[#8d6e63] text-xs mt-0.5 tracking-wide">{story.mood}</p>
                      </div>
                    </div>
                  </div>

                  {/* 구분선 */}
                  <div className="w-full h-px bg-[#d4b483]/35" />

                  {/* 단편: 미리보기 텍스트 / 장편: 챕터 수 */}
                  {story.type === 'short' && story.content && (
                    <p className="text-[#6d4c41] text-xs leading-relaxed line-clamp-3 italic">
                      {story.content}
                    </p>
                  )}
                  {story.type === 'long' && story.outline && (
                    <p className="text-[#8d6e63] text-xs tracking-wider">
                      총 {story.outline.length}챕터
                    </p>
                  )}

                  {/* 키워드 태그 */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {story.keywords.split(',').slice(0, 3).map((kw, ki) => (
                      <span key={ki} className="text-[10px] px-2 py-0.5 bg-[#d4b483]/25 border border-[#d4b483]/40 rounded text-[#5d4037] tracking-wide">
                        {kw.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* 상세 모달 */}
      <AnimatePresence>
        {selected && (
          <>
            {/* 딤 배경 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
            />

            {/* 모달 본체 */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="fixed inset-x-4 top-[8%] bottom-[4%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 overflow-hidden rounded-2xl border border-[#d4b483]/50 shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
            >
              <div className="relative h-full bg-[#f4e4bc] overflow-y-auto">
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
                />

                {/* 책 표지 */}
                <div className="relative flex justify-center pt-8 pb-4">
                  <BookCover genre={selected.genre} era={selected.era} mood={selected.mood} size="lg" />
                </div>

                {/* 모달 헤더 */}
                <div className="sticky top-0 z-10 relative bg-[#f4e4bc]/95 backdrop-blur-sm p-6 border-b border-[#d4b483]/50 flex items-start justify-between gap-4">
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded border tracking-wider ${
                        selected.type === 'short'
                          ? 'text-[#5d4037] border-[#8d6e63]/50 bg-[#e0cfa0]'
                          : 'text-[#a1887f] border-[#a1887f]/40 bg-[#e8dcc4]'
                      }`}>
                        {selected.type === 'short' ? '단편' : '장편'}
                      </span>
                      <span className="text-[#a1887f] text-xs">{formatDate(selected.created_at)}</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#3e2723] tracking-wide">
                      {selected.genre} · {selected.era}
                    </h2>
                    <p className="text-[#8d6e63] text-sm mt-0.5">{selected.mood} · {selected.keywords}</p>
                  </div>
                  <div className="relative flex items-center gap-2 shrink-0">
                    {/* 삭제 버튼 */}
                    {!deleteConfirm ? (
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="w-8 h-8 rounded-full border border-[#c0392b]/40 text-[#c0392b]/60 hover:text-[#c0392b] hover:border-[#c0392b] transition-colors flex items-center justify-center text-sm"
                        title="이야기 삭제"
                      >
                        🗑
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <span className="text-[#c0392b] text-xs tracking-wide">삭제할까요?</span>
                        <button
                          onClick={() => deleteStory(selected!.id)}
                          disabled={deleting}
                          className="px-2.5 py-1 bg-[#c0392b] text-white text-xs rounded border border-[#c0392b] hover:bg-[#a93226] transition-colors disabled:opacity-50"
                        >
                          {deleting ? '...' : '삭제'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-2.5 py-1 text-[#8d6e63] text-xs rounded border border-[#a1887f]/50 hover:border-[#8d6e63] transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    )}
                    {/* 닫기 버튼 */}
                    <button
                      onClick={closeModal}
                      className="w-8 h-8 rounded-full border border-[#a1887f]/50 text-[#8d6e63] hover:text-[#3e2723] hover:border-[#8d6e63] transition-colors flex items-center justify-center text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* 모달 본문 */}
                <div className="relative p-8">
                  {selected.type === 'short' && selected.content && (
                    <p className="text-[#3e2723] leading-loose text-base whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:text-[#8d6e63] first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                      {selected.content}
                    </p>
                  )}

                  {selected.type === 'long' && selected.outline && (
                    <div className="space-y-4">
                      <p className="text-xs text-[#8d6e63] tracking-[0.3em] uppercase mb-6 text-center">소설 목차</p>
                      {selected.outline.map((ch) => (
                        <div key={ch.id} className="flex gap-4 pb-4 border-b border-[#d4b483]/30 last:border-0">
                          <div className="flex flex-col items-center shrink-0 w-10 pt-1">
                            <span className="text-[10px] text-[#a1887f]">제</span>
                            <span className="text-xl font-bold text-[#8d6e63] leading-none">{ch.id}</span>
                            <span className="text-[10px] text-[#a1887f]">장</span>
                          </div>
                          <div>
                            <p className="font-bold text-[#5d4037] text-sm">{ch.title}</p>
                            <p className="text-[#6d4c41] text-xs mt-1 leading-relaxed italic">{ch.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 하단 장식 */}
                <div className="relative flex items-center justify-center gap-3 py-6 opacity-30">
                  <div className="w-12 h-px bg-[#8d6e63]" />
                  <span className="text-[#8d6e63] text-xs tracking-[0.4em]">✦ ✦ ✦</span>
                  <div className="w-12 h-px bg-[#8d6e63]" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
