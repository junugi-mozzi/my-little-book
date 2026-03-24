// src/app/explore/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import BookCover from '@/components/BookCover'
import GridLoader from '../../GridLoader'
import type { LibraryBookReaderHandle } from '@/components/LibraryBookReader'

const DynamicBookReader = dynamic(() => import('@/components/LibraryBookReader'), { ssr: false })

// ── 타입 ────────────────────────────────────────────────────────────────────

interface StoryCard {
  id: string
  title: string | null
  type: 'short' | 'long'
  genre: string
  era: string
  mood: string
  cover_url: string | null
  view_count: number
  created_at: string
}

interface StoryDetail extends StoryCard {
  keywords: string
  content: string | null
  outline: { id: number; title: string; summary: string; status: string; content?: string }[] | null
}

type BookPage =
  | { kind: 'cover' }
  | { kind: 'synopsis' }
  | { kind: 'locked' }
  | { kind: 'chapter-title'; chapterId: number; chapterTitle: string; summary: string }
  | { kind: 'text'; text: string; pageNum: number; totalPages: number; chapterLabel?: string }
  | { kind: 'blank' }

type SortType = 'latest' | 'popular'

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

function paginateText(text: string, charsPerPage: number): string[] {
  const pages: string[] = []
  let remaining = text.trim()
  while (remaining.length > 0) {
    if (remaining.length <= charsPerPage) { pages.push(remaining); break }
    let cut = charsPerPage
    while (cut > 0 && remaining[cut] !== ' ' && remaining[cut] !== '\n') cut--
    if (cut === 0) cut = charsPerPage
    pages.push(remaining.slice(0, cut).trimEnd())
    remaining = remaining.slice(cut).trimStart()
  }
  return pages
}

function prepareBookPages(story: StoryDetail, charsPerPage: number, purchased: boolean): BookPage[] {
  const pages: BookPage[] = [{ kind: 'cover' }, { kind: 'synopsis' }]

  if (!purchased) {
    pages.push({ kind: 'locked' })
    if (pages.length % 2 === 0) pages.push({ kind: 'blank' })
    return pages
  }

  if (story.type === 'short') {
    paginateText(story.content ?? '', charsPerPage).forEach((text, i, arr) =>
      pages.push({ kind: 'text', text, pageNum: i + 1, totalPages: arr.length })
    )
  } else {
    for (const ch of story.outline ?? []) {
      pages.push({ kind: 'chapter-title', chapterId: ch.id, chapterTitle: ch.title, summary: ch.summary })
      if (ch.content) {
        paginateText(ch.content, charsPerPage).forEach((text, i, arr) =>
          pages.push({ kind: 'text', text, pageNum: i + 1, totalPages: arr.length, chapterLabel: `제${ch.id}장 · ${ch.title}` })
        )
      }
    }
  }

  if (pages.length % 2 === 0) pages.push({ kind: 'blank' })
  return pages
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const router = useRouter()
  const [stories, setStories] = useState<StoryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortType>('latest')
  const [topStories, setTopStories] = useState<StoryCard[]>([])
  const [filterType, setFilterType] = useState<'all' | 'long' | 'short'>('all')

  // 모달 상태
  const [selected, setSelected] = useState<StoryDetail | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  // 모바일 감지
  const [isMobile, setIsMobile] = useState(false)

  // 북 리더 상태
  const [bookPages, setBookPages] = useState<BookPage[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const bookContainerRef = useRef<HTMLDivElement>(null)
  const [bookSize, setBookSize] = useState({ w: 0, h: 0 })
  const bookReaderRef = useRef<LibraryBookReaderHandle>(null)

  // ── 모바일 감지 ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── 그리드 로드 ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: topData } = await supabase
        .from('library')
        .select('id, title, type, genre, era, mood, cover_url, view_count, created_at')
        .eq('is_public', true)
        .order('view_count', { ascending: false })
        .limit(3)
      setTopStories((topData as StoryCard[]) ?? [])

      const { data: listData } = await supabase
        .from('library')
        .select('id, title, type, genre, era, mood, cover_url, view_count, created_at')
        .eq('is_public', true)
        .order(sort === 'latest' ? 'created_at' : 'view_count', { ascending: false })
        .limit(50)
      setStories((listData as StoryCard[]) ?? [])
      setLoading(false)
    }
    load()
  }, [sort])

  // ── 책 컨테이너 크기 ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = bookContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBookSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [selected])

  const filteredStories = useMemo(() => {
    if (filterType === 'all') return stories
    return stories.filter(s => s.type === filterType)
  }, [stories, filterType])

  const charsPerPage = useMemo(() => {
    if (bookSize.w === 0 || bookSize.h === 0) return 400
    const isMd = bookSize.w >= 768
    const pageW = isMd ? bookSize.w / 2 : bookSize.w
    const textAreaW = pageW - 56
    const textAreaH = bookSize.h - 70
    const charsPerLine = Math.floor(textAreaW / 15)
    const linesPerPage = Math.floor((textAreaH - 30) / 26)
    return Math.max(120, Math.floor(charsPerLine * linesPerPage * 0.72))
  }, [bookSize])

  // ── 페이지 빌드 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) { setBookPages([]); setPageIndex(0); return }
    setBookPages(prepareBookPages(selected, charsPerPage, purchased))
    setPageIndex(0)
  }, [selected, charsPerPage, purchased])

  // ── ESC 닫기 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && selected) closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected])

  // ── 책 열기 ──────────────────────────────────────────────────────────────
  const openBook = async (card: StoryCard) => {
    setModalLoading(true)
    setSelected(null)
    setPurchased(false)

    // 상세 데이터 fetch
    const { data: detail } = await supabase
      .from('library')
      .select('id, title, type, genre, era, mood, keywords, content, outline, cover_url, view_count, created_at')
      .eq('id', card.id)
      .single()

    if (!detail) { setModalLoading(false); return }

    // 구매 여부 확인
    const { data: { user } } = await supabase.auth.getUser()
    let isPurchased = false
    if (user) {
      // 자기 이야기면 항상 접근 가능
      const { data: ownStory } = await supabase
        .from('library')
        .select('id')
        .eq('id', card.id)
        .eq('user_id', user.id)
        .single()
      if (ownStory) {
        isPurchased = true
      } else {
        const { data: purchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('story_id', card.id)
          .eq('user_id', user.id)
          .single()
        if (purchase) isPurchased = true
      }
    }

    // 조회수 증가
    await supabase.rpc('increment_view_count', { story_id: card.id })

    setPurchased(isPurchased)
    setSelected(detail as StoryDetail)
    setModalLoading(false)
  }

  // ── 소장하기 ─────────────────────────────────────────────────────────────
  const handlePurchase = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (!selected) return

    setPurchasing(true)
    const { error } = await supabase
      .from('purchases')
      .insert({ user_id: user.id, story_id: selected.id })
    if (!error) {
      setPurchased(true)
    }
    setPurchasing(false)
  }

  // ── 모달 닫기 ────────────────────────────────────────────────────────────
  const closeModal = () => {
    setSelected(null)
  }

  // ── 플립 ─────────────────────────────────────────────────────────────────
  const totalSpreads = Math.ceil(bookPages.length / 2)
  const canGoPrev = pageIndex > 0
  const canGoNext = pageIndex < bookPages.length - 2

  const handleFlipNext = () => bookReaderRef.current?.flipNext()
  const handleFlipPrev = () => bookReaderRef.current?.flipPrev()

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#1a1412] font-serif relative overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_38%,_rgba(180,118,36,0.15),_transparent)] pointer-events-none" />
      <div className="fixed inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* ─── 헤더 ─── */}
        <div className="flex items-center justify-between flex-wrap gap-4 pr-12 sm:pr-0">
          <button onClick={() => router.push('/')} className="text-[#d4b483]/60 hover:text-[#d4b483] transition-colors text-sm tracking-widest">
            ← 메인으로
          </button>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl md:text-4xl font-bold text-[#d4b483] tracking-wide text-center">이야기 광장</h1>
            <p className="text-sm text-[#a1887f] tracking-widest text-center">루미스가 엮은 수많은 세계들이 당신을 기다립니다</p>
          </div>
          <div className="w-16 sm:w-20" />
        </div>

        {/* ─── 오늘의 인기 명작 TOP 3 ─── */}
        {!loading && topStories.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">👑</span>
              <h2 className="text-xl font-bold text-[#f4e4bc] tracking-widest">오늘의 인기 명작</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-[#d4b483]/50 to-transparent ml-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topStories.map((story, i) => (
                <motion.div
                  key={`top-${story.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => openBook(story)}
                  className="bg-[#2e1b0e]/40 border border-[#d4b483]/20 rounded-xl p-4 flex gap-4 cursor-pointer hover:bg-[#3e2723]/60 transition-all group"
                >
                  <div className="shrink-0 group-hover:scale-105 transition-transform">
                    <BookCover genre={story.genre} era={story.era} mood={story.mood} title={story.title ?? ''} size="sm" imageUrl={story.cover_url ?? undefined} />
                  </div>
                  <div className="flex flex-col justify-center overflow-hidden">
                    <span className="text-[#d4b483] text-[10px] tracking-widest mb-1 border border-[#d4b483]/30 px-1.5 py-0.5 rounded w-fit">
                      TOP {i + 1}
                    </span>
                    <p className="text-[#f4e4bc] font-bold text-sm truncate mb-1">{story.title ?? '무제'}</p>
                    <p className="text-[#a1887f] text-xs leading-relaxed">
                      {story.genre} 배경의 {story.type === 'short' ? '단편' : '장편'} 이야기
                    </p>
                    <p className="text-[#8d6e63] text-xs mt-2">👁 {story.view_count.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 탐색 필터 및 정렬 ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#d4b483]/20 pb-4">
          {/* 타입 필터 탭 */}
          <div className="flex gap-6">
            {(['all', 'long', 'short'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-sm tracking-widest pb-2 transition-colors relative ${
                  filterType === type ? 'text-[#f4e4bc] font-bold' : 'text-[#a1887f] hover:text-[#d4b483]'
                }`}
              >
                {type === 'all' ? '전체 보기' : type === 'long' ? '장편 소설' : '단편 소설'}
                {filterType === type && (
                  <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4b483]" />
                )}
              </button>
            ))}
          </div>

          {/* 정렬 토글 */}
          <div className="flex bg-[#2e1b0e] rounded-lg p-1 border border-[#d4b483]/20">
            {(['latest', 'popular'] as SortType[]).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-4 py-1.5 text-xs rounded-md tracking-widest transition-colors ${
                  sort === s ? 'bg-[#5d4037] text-[#f4e4bc] shadow-sm' : 'text-[#a1887f] hover:text-[#d4b483]'
                }`}
              >
                {s === 'latest' ? '최신순' : '인기순'}
              </button>
            ))}
          </div>
        </div>

        {/* ─── 메인 그리드 ─── */}
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <GridLoader color="#d4b483" />
            <p className="mt-6 text-[#d4b483] tracking-widest animate-pulse">서고를 정리하는 중...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4">
            <p className="text-[#a1887f] tracking-widest">해당 분류에 등록된 이야기가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {filteredStories.map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openBook(story)}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="transition-transform group-hover:scale-105 duration-200">
                  <BookCover genre={story.genre} era={story.era} mood={story.mood} title={story.title ?? ''} size="sm" imageUrl={story.cover_url ?? undefined} />
                </div>
                <div className="text-center w-full px-1">
                  <p className="text-[#d4b483] text-xs font-bold truncate">{story.title ?? '무제'}</p>
                  <p className="text-[#a1887f] text-xs mt-0.5">👁 {story.view_count.toLocaleString()}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${story.type === 'short' ? 'bg-[#3e2723] text-[#a1887f]' : 'bg-[#2e1b0e] text-[#d4b483]'}`}>
                    {story.type === 'short' ? '단편' : '장편'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && <div className="flex items-center justify-center gap-4 pt-8 opacity-20">
          <div className="w-20 h-px bg-[#d4b483]" />
          <span className="text-[#d4b483] text-xs tracking-[0.4em]">✦ ✦ ✦</span>
          <div className="w-20 h-px bg-[#d4b483]" />
        </div>}
      </div>

      {/* 로딩 오버레이 */}
      <AnimatePresence>
        {modalLoading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
          >
            <GridLoader color="#d4b483" />
            <p className="text-[#d4b483] tracking-widest animate-pulse text-sm">이야기를 펼치는 중...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D 북 리더 모달 ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/85 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="fixed z-50 inset-2 md:inset-6 flex flex-col items-center gap-2 md:gap-3 py-2 md:py-4"
              style={{ pointerEvents: 'none' }}
            >
              {/* 상단 바 */}
              <div className="w-full max-w-5xl flex items-center justify-between px-1 shrink-0" style={{ pointerEvents: 'auto' }}>
                <div className="flex items-center gap-3">
                  <h2 className="text-[#f4e4bc] text-sm font-bold tracking-wide leading-tight">
                    {selected.title ?? `${selected.genre} · ${selected.era}`}
                  </h2>
                  <span className="text-[#a1887f] text-xs tracking-widest hidden sm:inline">
                    👁 {selected.view_count.toLocaleString()}
                  </span>
                  {purchased && (
                    <span className="text-[#d4b483] text-[10px] tracking-widest border border-[#d4b483]/30 px-2 py-0.5 rounded">
                      ✦ 소장 중
                    </span>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#a1887f]/50 text-[#d4b483] hover:text-[#f4e4bc] hover:border-[#d4b483] hover:bg-[#3e2723]/60 transition-colors text-xs tracking-widest"
                >
                  ✕ 닫기
                </button>
              </div>

              {/* 책 본체 */}
              <div
                ref={bookContainerRef}
                className="w-full max-w-5xl relative flex-1 min-h-0 flex items-center justify-center"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="absolute inset-[-6px] md:inset-[-10px] rounded-xl bg-[#3e2723] shadow-[0_24px_80px_rgba(0,0,0,0.95)] border border-[#261714]" />
                <div className="absolute inset-[-4px] md:inset-[-7px] rounded-xl border border-[#8d6e63]/30 pointer-events-none" />

                {bookSize.w > 0 && bookSize.h > 0 && (
                  <div className="relative z-10 overflow-hidden rounded-lg">
                    <DynamicBookReader
                      ref={bookReaderRef}
                      pages={bookPages}
                      story={selected}
                      generatingChapterId={null}
                      onPurchase={handlePurchase}
                      purchasing={purchasing}
                      onPageChange={(pi) => setPageIndex(pi)}
                      startPage={pageIndex}
                      width={Math.max(120, isMobile ? bookSize.w : Math.floor(bookSize.w / 2))}
                      height={bookSize.h}
                      isMobile={isMobile}
                    />
                  </div>
                )}
              </div>

              {/* 하단 내비 */}
              <div className="flex items-center gap-4 md:gap-6 shrink-0" style={{ pointerEvents: 'auto' }}>
                <motion.button onClick={handleFlipPrev} disabled={!canGoPrev} whileHover={{ scale: canGoPrev ? 1.04 : 1 }} whileTap={{ scale: 0.96 }} className="px-4 md:px-6 py-2 min-h-[44px] bg-[#5d4037]/80 hover:bg-[#5d4037] text-[#d4b483] text-xs md:text-sm rounded border border-[#8d6e63]/50 tracking-widest transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
                  ← 이전 장
                </motion.button>
                <span className="text-[#a1887f] text-[11px] tracking-[0.25em] min-w-[70px] text-center">
                  {Math.floor(pageIndex / 2) + 1} / {totalSpreads}
                </span>
                <motion.button onClick={handleFlipNext} disabled={!canGoNext} whileHover={{ scale: canGoNext ? 1.04 : 1 }} whileTap={{ scale: 0.96 }} className="px-4 md:px-6 py-2 min-h-[44px] bg-[#5d4037]/80 hover:bg-[#5d4037] text-[#d4b483] text-xs md:text-sm rounded border border-[#8d6e63]/50 tracking-widest transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
                  다음 장 →
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
