// src/app/library/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import BookCover from '@/components/BookCover'
import ShareFAB from '@/components/ShareFAB'
import { useBGMStore } from '@/store/bgmStore'
import type { LibraryBookReaderHandle } from '@/components/LibraryBookReader'

const DynamicBookReader = dynamic(() => import('@/components/LibraryBookReader'), { ssr: false })

// ── 타입 정의 ────────────────────────────────────────────────────────────────

interface Story {
  id: string
  created_at: string
  genre: string
  era: string
  mood: string
  keywords: string
  title: string | null
  type: 'short' | 'long'
  content: string | null
  outline: { id: number; title: string; summary: string; status: string; content?: string }[] | null
  cover_url?: string | null
  characters?: { name: string; age: number; occupation: string; personality: string; speech_style: string; core_wound: string; relationships: { name: string; relation: string }[] }[] | null
  is_public: boolean
  view_count: number
}

type BookPage =
  | { kind: 'cover' }
  | { kind: 'synopsis' }
  | { kind: 'chapter-title'; chapterId: number; chapterTitle: string; summary: string }
  | { kind: 'pending'; chapterId: number; chapterTitle: string }
  | { kind: 'text'; text: string; pageNum: number; totalPages: number; chapterLabel?: string }
  | { kind: 'blank' }

// ── 헬퍼 함수 (컴포넌트 밖) ─────────────────────────────────────────────────

function paginateText(text: string, charsPerPage: number): string[] {
  const pages: string[] = []
  let remaining = text.trim()
  while (remaining.length > 0) {
    if (remaining.length <= charsPerPage) {
      pages.push(remaining)
      break
    }
    let cut = charsPerPage
    while (cut > 0 && remaining[cut] !== ' ' && remaining[cut] !== '\n') cut--
    if (cut === 0) cut = charsPerPage
    pages.push(remaining.slice(0, cut).trimEnd())
    remaining = remaining.slice(cut).trimStart()
  }
  return pages
}

function prepareBookPages(story: Story, charsPerPage: number): BookPage[] {
  const pages: BookPage[] = [{ kind: 'cover' }, { kind: 'synopsis' }]
  if (story.type === 'short') {
    paginateText(story.content ?? '', charsPerPage).forEach((text, i, arr) =>
      pages.push({ kind: 'text', text, pageNum: i + 1, totalPages: arr.length })
    )
  } else {
    for (const ch of story.outline ?? []) {
      pages.push({ kind: 'chapter-title', chapterId: ch.id, chapterTitle: ch.title, summary: ch.summary })
      if (!ch.content) {
        pages.push({ kind: 'pending', chapterId: ch.id, chapterTitle: ch.title })
      } else {
        paginateText(ch.content, charsPerPage).forEach((text, i, arr) =>
          pages.push({
            kind: 'text', text,
            pageNum: i + 1, totalPages: arr.length,
            chapterLabel: `제${ch.id}장 · ${ch.title}`,
          })
        )
      }
    }
  }
  // 짝수 보장 (마지막 스프레드 우측 페이지 공백)
  if (pages.length % 2 === 0) pages.push({ kind: 'blank' })
  return pages
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthGuard()

  // 서재 데이터
  const [stories, setStories] = useState<Story[]>([])
  const [purchasedStories, setPurchasedStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Story | null>(null)
  const [selectedIsPurchased, setSelectedIsPurchased] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 필터 / 정렬
  const [typeFilter, setTypeFilter] = useState<'all' | 'short' | 'long'>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // 챕터 생성 상태 (장편)
  const [generatingChapterId, setGeneratingChapterId] = useState<number | null>(null)
  const [chapterError, setChapterError] = useState<string | null>(null)

  // 북 리더 상태
  const [bookPages, setBookPages]     = useState<BookPage[]>([])
  const [pageIndex, setPageIndex]     = useState(0)          // StPageFlip 기준 페이지 번호
  const bookReaderRef = useRef<LibraryBookReaderHandle>(null)

  // BGM
  const { muted } = useBGMStore()
  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 모바일 감지
  const [isMobile, setIsMobile] = useState(false)

  // 책 컨테이너 크기 측정 (동적 페이지네이션용)
  const bookContainerRef = useRef<HTMLDivElement>(null)
  const [bookSize, setBookSize] = useState({ w: 0, h: 0 })

  // 책갈피
  const prevSelectedIdRef = useRef<string | null>(null)
  const [bookmarkRestored, setBookmarkRestored] = useState(false)
  const bookmarkToastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 데이터 로드 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return
    fetchStories()
  }, [user, authLoading])

  // ── 모바일 감지 ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── 책 컨테이너 크기 감지 ────────────────────────────────────────────────
  useEffect(() => {
    const el = bookContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBookSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [selected]) // selected 열릴 때마다 재연결

  // ── 페이지당 글자 수 동적 계산 ───────────────────────────────────────────
  const charsPerPage = useMemo(() => {
    if (bookSize.w === 0 || bookSize.h === 0) return 400
    const isMd = bookSize.w >= 768
    const pageW = isMd ? bookSize.w / 2 : bookSize.w
    const textAreaW = pageW - 56          // px-7 (28px) × 2
    const textAreaH = bookSize.h - 70    // py-5 (40px) + 페이지번호 (30px)
    const charsPerLine = Math.floor(textAreaW / 15)   // 한국어 13px ≈ 15px (드롭캡·헤더 여유)
    const linesPerPage = Math.floor((textAreaH - 30) / 26) // 여분 30px 제거 (챕터헤더 대비)
    return Math.max(120, Math.floor(charsPerLine * linesPerPage * 0.72))
  }, [bookSize])

  // ── selected / charsPerPage 변경 시 페이지 빌드 ──────────────────────────
  useEffect(() => {
    if (!selected) {
      setBookPages([])
      setPageIndex(0)
      prevSelectedIdRef.current = null
      return
    }
    const pages = prepareBookPages(selected, charsPerPage)
    setBookPages(pages)

    const isNewBook = selected.id !== prevSelectedIdRef.current
    if (isNewBook) {
      // 새 책 열기 → 책갈피 복원
      prevSelectedIdRef.current = selected.id
      const saved = localStorage.getItem(`bookmark_${selected.id}`)
      if (saved) {
        const idx = parseInt(saved, 10)
        if (idx > 0 && idx < pages.length) {
          setPageIndex(idx)
          setBookmarkRestored(true)
          if (bookmarkToastRef.current) clearTimeout(bookmarkToastRef.current)
          bookmarkToastRef.current = setTimeout(() => setBookmarkRestored(false), 2500)
        } else {
          setPageIndex(0)
        }
      } else {
        setPageIndex(0)
      }
    } else {
      // 리사이즈 → 현재 위치 유지 (유효 범위 내)
      setPageIndex(prev => (prev < pages.length ? prev : 0))
    }
  }, [selected, charsPerPage])

  // ── 책갈피 저장 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return
    if (pageIndex === 0) {
      localStorage.removeItem(`bookmark_${selected.id}`)
    } else {
      localStorage.setItem(`bookmark_${selected.id}`, String(pageIndex))
    }
  }, [selected?.id, pageIndex])

  // ── 서재 BGM ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio('/bgm/library-bgm.mp3')
    audio.loop = true
    audio.volume = 0
    audioRef.current = audio

    const startFadeIn = () => {
      let vol = 0
      fadeTimerRef.current = setInterval(() => {
        vol = Math.min(vol + 0.008, 0.3)
        audio.volume = vol
        if (vol >= 0.3) {
          clearInterval(fadeTimerRef.current!)
          fadeTimerRef.current = null
        }
      }, 60)
    }

    audio.play().then(startFadeIn).catch(() => {
      // 자동재생 차단 → 첫 인터랙션 시 재생
      const onInteraction = () => {
        audio.play().then(startFadeIn).catch(() => {})
        document.removeEventListener('click', onInteraction)
        document.removeEventListener('keydown', onInteraction)
        document.removeEventListener('touchstart', onInteraction)
      }
      document.addEventListener('click', onInteraction)
      document.addEventListener('keydown', onInteraction)
      document.addEventListener('touchstart', onInteraction)
    })

    return () => {
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current)
      let v = audio.volume
      const fadeOut = setInterval(() => {
        v = Math.max(v - 0.025, 0)
        audio.volume = v
        if (v <= 0) {
          clearInterval(fadeOut)
          audio.pause()
          audio.src = ''
        }
      }, 40)
    }
  }, [])

  // muted 상태 동기화
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  const fetchStories = async () => {
    setLoading(true)
    const [myRes, purchasedRes] = await Promise.all([
      supabase
        .from('library')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('purchases')
        .select('story_id, library(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
    ])
    if (!myRes.error && myRes.data) setStories(myRes.data as Story[])
    if (!purchasedRes.error && purchasedRes.data) {
      const purchased = (purchasedRes.data as { story_id: string; library: unknown }[])
        .map((row) => {
          const lib = row.library
          if (Array.isArray(lib)) return lib[0] as Story | undefined
          return lib as Story | null
        })
        .filter((s): s is Story => !!s)
      setPurchasedStories(purchased)
    }
    setLoading(false)
  }

  const closeModal = () => {
    setSelected(null)
    setSelectedIsPurchased(false)
    setDeleteConfirm(false)
    setGeneratingChapterId(null)
    setBookmarkRestored(false)
    if (bookmarkToastRef.current) clearTimeout(bookmarkToastRef.current)
  }

  // ESC 키로 모달 닫기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [selected])

  // ── 챕터 집필 (장편, 서재에서) ───────────────────────────────────────────
  const handleGenerateChapterInLibrary = async (chapterId: number) => {
    if (!selected || !selected.outline) return
    const ch = selected.outline.find(c => c.id === chapterId)
    if (!ch) return
    setGeneratingChapterId(chapterId)
    try {
      const direction = selected.keywords.split(' / ')[0]?.trim() ?? ''
      const tension   = selected.keywords.split(' / ')[1]?.trim() ?? ''
      const res = await fetch('/api/long-story/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atmosphere: selected.genre,
          wound: selected.era,
          direction,
          tension,
          resonance: selected.mood,
          chapterId: ch.id,
          chapterTitle: ch.title,
          chapterSummary: ch.summary,
          allChapters: selected.outline.map(c => ({ id: c.id, title: c.title, summary: c.summary, content: c.content ?? null })),
          characters: selected.characters ?? null,
        }),
      })
      const data = await res.json()
      if (data.content) {
        const updatedOutline = selected.outline.map(c =>
          c.id === chapterId ? { ...c, content: data.content, status: 'completed' } : c
        )
        const updatedStory = { ...selected, outline: updatedOutline }
        await supabase.from('library').update({ outline: updatedOutline }).eq('id', selected.id)
        setSelected(updatedStory)
        setStories(prev => prev.map(s => s.id === selected.id ? updatedStory : s))
      }
    } catch (e) {
      console.error('[library] chapter generate error:', e)
      setChapterError('챕터 생성에 실패했습니다. 다시 시도해주세요.')
      setTimeout(() => setChapterError(null), 4000)
    } finally { setGeneratingChapterId(null) }
  }

  const deleteStory = async (id: string) => {
    setDeleting(true)
    const { error } = await supabase.from('library').delete().eq('id', id)
    if (!error) {
      setStories(prev => prev.filter(s => s.id !== id))
      closeModal()
    }
    setDeleting(false)
  }

  const handleTogglePublic = async () => {
    if (!selected) return
    const next = !selected.is_public
    await supabase.from('library').update({ is_public: next }).eq('id', selected.id)
    const updated = { ...selected, is_public: next }
    setSelected(updated)
    setStories(prev => prev.map(s => s.id === selected.id ? updated : s))
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  // ── 플립 핸들러 ──────────────────────────────────────────────────────────
  const totalSpreads = bookPages.length > 0 ? Math.ceil(bookPages.length / 2) : 1
  const canGoPrev = pageIndex > 0
  const canGoNext = pageIndex < bookPages.length - 2

  const handleFlipNext = () => bookReaderRef.current?.flipNext()
  const handleFlipPrev = () => bookReaderRef.current?.flipPrev()

  // ── 서가 데이터 (정렬 + 필터) ────────────────────────────────────────────
  const sortedStories = useMemo(() => {
    const arr = [...stories]
    arr.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return sortOrder === 'newest' ? diff : -diff
    })
    return arr
  }, [stories, sortOrder])

  const shortStories = typeFilter !== 'long'  ? sortedStories.filter(s => s.type === 'short') : []
  const longStories  = typeFilter !== 'short' ? sortedStories.filter(s => s.type === 'long')  : []

  const renderShelf = (shelfStories: Story[], label: string, isPurchased = false) => (
    <div className="space-y-2">
      <div className={`flex items-center gap-3 mb-5 ${isPurchased ? 'opacity-80' : 'opacity-65'}`}>
        <div className={`flex-1 h-px ${isPurchased ? 'bg-[#b8860b]' : 'bg-[#d4b483]'}`} />
        <span className={`text-xs tracking-[0.4em] ${isPurchased ? 'text-[#b8860b]' : 'text-[#d4b483]'}`}>
          {isPurchased ? '📚 ' : '✦ '}{label}{isPurchased ? ' 📚' : ' ✦'}
        </span>
        <div className={`flex-1 h-px ${isPurchased ? 'bg-[#b8860b]' : 'bg-[#d4b483]'}`} />
      </div>
      <div>
        <div className={`flex flex-wrap gap-x-3 gap-y-10 items-end px-6 pt-10 pb-0 min-h-[170px]
                        border border-b-0 rounded-t ${
                          isPurchased
                            ? 'bg-[#1a1000]/50 border-[#6d5000]/30'
                            : 'bg-[#1e0f05]/30 border-[#5d4037]/25'
                        }`}>
          {shelfStories.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-[#5d4037]/35 text-xs tracking-widest italic">
                아직 이 서가에 꽂힌 이야기가 없습니다...
              </p>
            </div>
          ) : (
            shelfStories.map((story) => (
              <div
                key={story.id}
                className="relative group cursor-pointer"
                onClick={() => { setSelected(story); setSelectedIsPurchased(isPurchased) }}
              >
                {/* 미리보기 카드 */}
                <div className="
                  absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2
                  w-44 z-30 pointer-events-none
                  opacity-0 scale-95 origin-bottom
                  group-hover:opacity-100 group-hover:scale-100
                  transition-all duration-200
                ">
                  <div className="relative bg-[#f4e4bc] border border-[#d4b483]/60 rounded
                                  shadow-[0_8px_28px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5
                                    bg-gradient-to-b from-[#5d4037] to-[#3e2723]" />
                    <div className="absolute inset-0 opacity-15 pointer-events-none"
                         style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }} />
                    <div className="relative pl-4 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border tracking-wider ${
                          story.type === 'short'
                            ? 'text-[#5d4037] border-[#8d6e63]/50 bg-[#e0cfa0]'
                            : 'text-[#a1887f] border-[#a1887f]/40 bg-[#e8dcc4]'
                        }`}>
                          {story.type === 'short' ? '단편' : '장편'}
                        </span>
                        <span className="text-[9px] text-[#a1887f]">{formatDate(story.created_at)}</span>
                      </div>
                      <p className="text-[#5d4037] text-[10px] font-bold leading-snug">
                        {story.title ?? `${story.genre} · ${story.era}`}
                      </p>
                      <p className="text-[#8d6e63] text-[9px] italic">{story.mood}</p>
                      {story.type === 'short' && story.content && (
                        <p className="text-[#6d4c41] text-[9px] leading-relaxed line-clamp-2 pt-1 border-t border-[#d4b483]/30">
                          {story.content}
                        </p>
                      )}
                      {story.type === 'long' && story.outline && (
                        <p className="text-[#8d6e63] text-[9px] pt-1 border-t border-[#d4b483]/30">
                          총 {story.outline.length}챕터
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 책 본체 */}
                <motion.div
                  initial={{ filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.5))' }}
                  whileHover={{ y: -22, rotate: -1, filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.85))' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                >
                  <BookCover
                    genre={story.genre}
                    era={story.era}
                    mood={story.mood}
                    title={story.title ?? undefined}
                    size="sm"
                    imageUrl={story.cover_url ?? undefined}
                  />
                </motion.div>
              </div>
            ))
          )}
        </div>
        <div className={`h-4 rounded-b shadow-[0_5px_16px_rgba(0,0,0,0.75),_inset_0_1px_0_rgba(255,200,100,0.1)] ${
          isPurchased
            ? 'bg-gradient-to-b from-[#8b6914] to-[#4a3800]'
            : 'bg-gradient-to-b from-[#6d4c41] to-[#3e2723]'
        }`} />
      </div>
    </div>
  )

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#1a1412] font-serif relative overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_38%,_rgba(180,118,36,0.13),_transparent)] pointer-events-none" />
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* 상단 바: 뒤로가기 */}
        <div>
          <motion.button
            onClick={() => router.push('/')}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[#d4b483]/60 hover:text-[#d4b483] transition-colors text-sm tracking-widest flex items-center gap-2"
          >
            ← 별빛 도서관으로
          </motion.button>
        </div>

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

        {/* 필터 / 정렬 바 */}
        {!loading && (stories.length > 0 || purchasedStories.length > 0) && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* 유형 필터 */}
            <div className="flex items-center gap-1.5">
              {(['all', 'short', 'long'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setTypeFilter(v)}
                  className={`px-3 py-1 text-[10px] rounded border tracking-widest transition-colors ${
                    typeFilter === v
                      ? 'bg-[#8d6e63] text-[#f4e4bc] border-[#5d4037]'
                      : 'text-[#a1887f] border-[#5d4037]/30 hover:border-[#8d6e63]/60 hover:text-[#d4b483]'
                  }`}
                >
                  {v === 'all' ? '전체' : v === 'short' ? '단편' : '장편'}
                </button>
              ))}
            </div>
            {/* 정렬 */}
            <div className="flex items-center gap-1.5">
              {(['newest', 'oldest'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSortOrder(v)}
                  className={`px-3 py-1 text-[10px] rounded border tracking-widest transition-colors ${
                    sortOrder === v
                      ? 'bg-[#5d4037]/60 text-[#d4b483] border-[#8d6e63]/50'
                      : 'text-[#a1887f] border-[#5d4037]/30 hover:border-[#8d6e63]/60 hover:text-[#d4b483]'
                  }`}
                >
                  {v === 'newest' ? '최신순' : '오래된순'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-8 h-8 border-2 border-[#d4b483]/30 border-t-[#d4b483] rounded-full animate-spin" />
            <p className="text-[#d4b483]/60 text-sm tracking-widest animate-pulse">서재를 열고 있습니다...</p>
          </div>
        )}

        {/* 빈 서재 */}
        {!loading && stories.length === 0 && purchasedStories.length === 0 && (
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

        {/* 책장 UI */}
        {!loading && (stories.length > 0 || purchasedStories.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-14"
          >
            {typeFilter !== 'long'  && renderShelf(shortStories, '단편 서가')}
            {typeFilter !== 'short' && renderShelf(longStories,  '장편 서가')}
            {purchasedStories.length > 0 && renderShelf(purchasedStories, '소장 목록', true)}
          </motion.div>
        )}

      </div>

      {/* ── 3D 북 리더 모달 ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <>
            {/* 딤 배경 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/85 z-40 backdrop-blur-sm"
            />

            {/* 삭제 확인 모달 */}
            <AnimatePresence>
              {deleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[55] flex items-center justify-center px-6"
                  onClick={() => setDeleteConfirm(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-sm bg-[#1a1412] border border-[#c0392b]/40 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-2 mb-5">
                      <span className="text-2xl">🗑</span>
                      <h3 className="text-[#f4e4bc] text-base font-bold tracking-widest">이야기를 삭제할까요?</h3>
                      <p className="text-[#a1887f] text-xs tracking-wide text-center leading-relaxed">
                        삭제된 이야기는 복구할 수 없습니다
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="flex-1 py-2.5 rounded-lg border border-[#a1887f]/40 text-[#a1887f] text-xs tracking-widest hover:border-[#8d6e63] hover:text-[#d4b483] transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => deleteStory(selected.id)}
                        disabled={deleting}
                        className="flex-1 py-2.5 rounded-lg bg-[#c0392b] hover:bg-[#a93226] text-white text-xs font-bold tracking-widest transition-colors disabled:opacity-50"
                      >
                        {deleting ? '삭제 중...' : '삭제하기'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 북 리더 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="fixed z-50 inset-2 md:inset-6 flex flex-col items-center gap-2 md:gap-3 py-2 md:py-4"
              style={{ pointerEvents: 'none' }}
            >
              {/* 상단 컨트롤 바 */}
              <div
                className="w-full max-w-5xl flex items-center justify-between px-1 shrink-0"
                style={{ pointerEvents: 'auto' }}
              >
                <h2 className="text-[#f4e4bc] text-sm font-bold tracking-wide leading-tight flex items-center gap-2">
                  {selected.title ?? `${selected.genre} · ${selected.era}`}
                  {selectedIsPurchased && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#d4b483]/40 text-[#d4b483]/70 tracking-widest">
                      소장
                    </span>
                  )}
                </h2>
                <motion.div layout className="flex items-center gap-2">
                  {selected.is_public && (
                    <ShareFAB storyId={selected.id} title={selected.title ?? ''} inline />
                  )}
                  {!selectedIsPurchased && (
                    <motion.button
                      layout
                      onClick={() => setDeleteConfirm(true)}
                      className="w-8 h-8 rounded-full border border-[#c0392b]/70 text-[#c0392b]/80 bg-[#c0392b]/10 hover:bg-[#c0392b]/20 hover:text-[#c0392b] hover:border-[#c0392b] transition-colors flex items-center justify-center text-sm"
                      title="이야기 삭제"
                    >
                      🗑
                    </motion.button>
                  )}
                  <button
                    onClick={closeModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#a1887f]/50 text-[#d4b483] hover:text-[#f4e4bc] hover:border-[#d4b483] hover:bg-[#3e2723]/60 transition-colors text-xs tracking-widest"
                  >
                    ✕ 닫기
                  </button>
                </motion.div>
              </div>

              {/* 공유 컨트롤 (내 이야기만) */}
              {!selectedIsPurchased && (() => {
                const allDone = selected.type === 'long'
                  ? (selected.outline?.length === 5 && selected.outline.every(c => c.status === 'completed'))
                  : true
                const canShare = selected.type === 'short' || allDone
                return (
                  <div
                    className="w-full max-w-5xl flex items-center gap-3 px-1 shrink-0"
                    style={{ pointerEvents: 'auto' }}
                  >
                    {!canShare ? (
                      <p className="text-[#a1887f] text-xs tracking-widest italic">
                        🔒 챕터 5개가 모두 완성되어야 공유할 수 있습니다
                      </p>
                    ) : (
                      <>
                        <button
                          onClick={handleTogglePublic}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs tracking-widest transition-colors ${
                            selected.is_public
                              ? 'bg-[#8d6e63] border-[#5d4037] text-[#f4e4bc]'
                              : 'bg-transparent border-[#8d6e63]/40 text-[#a1887f] hover:border-[#8d6e63]'
                          }`}
                        >
                          {selected.is_public ? '✦ 이야기 광장 공개 중' : '나만 보기'}
                        </button>
                        {selected.is_public && (
                          <button
                            onClick={() => window.open(`/story/${selected.id}`, '_blank')}
                            className="px-3 py-1.5 bg-[#5d4037]/60 hover:bg-[#5d4037] text-[#d4b483] text-xs rounded border border-[#8d6e63]/50 tracking-widest transition-colors"
                          >
                            ✦ 공유링크 페이지에서 보기
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )
              })()}

              {/* 책 본체 */}
              <div
                ref={bookContainerRef}
                className="w-full max-w-5xl relative flex-1 min-h-0 flex items-center justify-center"
                style={{ pointerEvents: 'auto' }}
              >
                {/* 가죽 외장 */}
                <div className="absolute inset-[-6px] md:inset-[-10px] rounded-xl bg-[#3e2723]
                                shadow-[0_24px_80px_rgba(0,0,0,0.95)]
                                border border-[#261714]" />
                {/* 금장 테두리 */}
                <div className="absolute inset-[-4px] md:inset-[-7px] rounded-xl
                                border border-[#8d6e63]/30 pointer-events-none" />

                {/* StPageFlip 책 뷰어 */}
                {bookSize.w > 0 && bookSize.h > 0 && (
                  <div className="relative z-10 overflow-hidden rounded-lg">
                    <DynamicBookReader
                      ref={bookReaderRef}
                      pages={bookPages}
                      story={selected}
                      generatingChapterId={generatingChapterId}
                      onGenerate={selectedIsPurchased ? undefined : handleGenerateChapterInLibrary}
                      onPageChange={(pi) => setPageIndex(pi)}
                      startPage={pageIndex}
                      width={Math.max(120, isMobile ? bookSize.w : Math.floor(bookSize.w / 2))}
                      height={bookSize.h}
                      isMobile={isMobile}
                    />
                  </div>
                )}
              </div>

              {/* 하단 내비게이션 */}
              <div
                className="flex items-center gap-4 md:gap-6 shrink-0"
                style={{ pointerEvents: 'auto' }}
              >
                <motion.button
                  onClick={handleFlipPrev}
                  disabled={!canGoPrev}
                  whileHover={{ scale: canGoPrev ? 1.04 : 1 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 md:px-6 py-2 min-h-[44px] bg-[#5d4037]/80 hover:bg-[#5d4037] text-[#d4b483] text-xs md:text-sm rounded border border-[#8d6e63]/50 tracking-widest transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  ← 이전 장
                </motion.button>

                <div className="flex flex-col items-center gap-0.5 min-w-[70px]">
                  <span className="text-[#a1887f] text-[11px] tracking-[0.25em] text-center">
                    {Math.floor(pageIndex / 2) + 1} / {totalSpreads}
                  </span>
                  <AnimatePresence>
                    {bookmarkRestored && (
                      <motion.span
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[#d4b483]/70 text-[9px] tracking-wider whitespace-nowrap"
                      >
                        📖 이어읽기
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={handleFlipNext}
                  disabled={!canGoNext}
                  whileHover={{ scale: canGoNext ? 1.04 : 1 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 md:px-6 py-2 min-h-[44px] bg-[#5d4037]/80 hover:bg-[#5d4037] text-[#d4b483] text-xs md:text-sm rounded border border-[#8d6e63]/50 tracking-widest transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  다음 장 →
                </motion.button>
              </div>

              {/* 챕터 생성 에러 */}
              <AnimatePresence>
                {chapterError && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400/80 text-xs text-center tracking-wide shrink-0"
                  >
                    {chapterError}
                  </motion.p>
                )}
              </AnimatePresence>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
