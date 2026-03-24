// src/app/story/[id]/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import GridLoader from '../../../GridLoader'
import type { LibraryBookReaderHandle } from '@/components/LibraryBookReader'

const DynamicBookReader = dynamic(() => import('@/components/LibraryBookReader'), { ssr: false })

// ── 타입 ────────────────────────────────────────────────────────────────────

interface Story {
  id: string
  created_at: string
  title: string | null
  type: 'short' | 'long'
  genre: string
  era: string
  mood: string
  keywords: string
  content: string | null
  outline: { id: number; title: string; summary: string; status: string; content?: string }[] | null
  cover_url: string | null
  is_public?: boolean
  view_count: number
}

type BookPage =
  | { kind: 'cover' }
  | { kind: 'synopsis' }
  | { kind: 'chapter-title'; chapterId: number; chapterTitle: string; summary: string }
  | { kind: 'pending'; chapterId: number; chapterTitle: string }
  | { kind: 'text'; text: string; pageNum: number; totalPages: number; chapterLabel?: string }
  | { kind: 'blank' }

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
          pages.push({ kind: 'text', text, pageNum: i + 1, totalPages: arr.length, chapterLabel: `제${ch.id}장 · ${ch.title}` })
        )
      }
    }
  }
  if (pages.length % 2 === 0) pages.push({ kind: 'blank' })
  return pages
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function PublicStoryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const bookReaderRef = useRef<LibraryBookReaderHandle>(null)
  const bookContainerRef = useRef<HTMLDivElement>(null)
  const [bookSize, setBookSize] = useState({ w: 0, h: 0 })
  const [bookPages, setBookPages] = useState<BookPage[]>([])

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      localStorage.setItem('auth_redirect', `/story/${id}`)
      router.push('/auth')
    }
  }, [user, authLoading, id, router])

  // 모바일 감지
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── 데이터 로드 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data, error } = await supabase
        .from('library')
        .select('id, created_at, title, type, genre, era, mood, keywords, content, outline, cover_url, is_public, view_count')
        .eq('id', id)
        .eq('is_public', true)
        .single()
      if (error || !data) { setNotFound(true); setLoading(false); return }
      setStory(data as Story)
      setLoading(false)
      await supabase.rpc('increment_view_count', { story_id: id })
    }
    load()
  }, [id])

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
  }, [story])

  // ── 페이지당 글자 수 동적 계산 ───────────────────────────────────────────
  const charsPerPage = useMemo(() => {
    if (bookSize.w === 0 || bookSize.h === 0) return 400
    const pageW = isMobile ? bookSize.w : bookSize.w / 2
    const textAreaW = pageW - 56
    const textAreaH = bookSize.h - 70
    const charsPerLine = Math.floor(textAreaW / 15)
    const linesPerPage = Math.floor((textAreaH - 30) / 26)
    return Math.max(120, Math.floor(charsPerLine * linesPerPage * 0.72))
  }, [bookSize, isMobile])

  // ── 페이지 빌드 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!story) return
    setBookPages(prepareBookPages(story, charsPerPage))
  }, [story, charsPerPage])

  // ── 내비게이션 ───────────────────────────────────────────────────────────
  const totalSpreads = bookPages.length > 0 ? Math.ceil(bookPages.length / 2) : 1
  const canGoPrev = pageIndex > 0
  const canGoNext = pageIndex < bookPages.length - 1

  const handleFlipNext = () => bookReaderRef.current?.flipNext()
  const handleFlipPrev = () => bookReaderRef.current?.flipPrev()

  // ── 공유 ─────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: story?.title ?? '루미스의 이야기', url: window.location.href }).catch(() => {})
    } else {
      handleCopy()
    }
  }

// ── 로딩 / 에러 ──────────────────────────────────────────────────────────
  if (loading) return (
    <main className="h-screen bg-[#1a1412] flex flex-col items-center justify-center font-serif">
      <GridLoader color="#d4b483" />
      <p className="mt-6 text-[#d4b483] tracking-widest animate-pulse">이야기를 불러오는 중...</p>
    </main>
  )

  if (notFound) return (
    <main className="h-screen bg-[#1a1412] flex flex-col items-center justify-center font-serif gap-6">
      <p className="text-[#d4b483] text-xl tracking-widest">이야기를 찾을 수 없습니다.</p>
      <button onClick={() => router.push('/explore')} className="text-[#a1887f] hover:text-[#d4b483] text-sm tracking-widest transition-colors">
        ← 이야기 광장으로
      </button>
    </main>
  )

  if (!story) return null

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <main className="h-screen bg-[#1a1412] font-serif flex flex-col overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_38%,_rgba(180,118,36,0.13),_transparent)] pointer-events-none" />
      <div className="fixed inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }} />

      {/* ── 상단 바 ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-4 pr-16 py-2 md:py-3 shrink-0">
        <button
          onClick={() => router.push('/explore')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#a1887f]/50 text-[#d4b483] hover:text-[#f4e4bc] hover:border-[#d4b483] hover:bg-[#3e2723]/60 transition-colors text-xs tracking-widest"
        >
          ← 이야기 광장
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[#a1887f] text-xs tracking-widest hidden sm:inline">
            👁 {(story.view_count + 1).toLocaleString()}
          </span>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-xs rounded border border-[#5d4037] tracking-widest transition-colors"
          >
            ✦ 공유
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-[#3e2723] hover:bg-[#4e342e] text-[#d4b483] text-xs rounded border border-[#5d4037] tracking-widest transition-colors"
          >
            {copied ? '✓ 복사됨' : '🔗 링크'}
          </button>
        </div>
      </div>

      {/* ── 북 리더 ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center flex-1 min-h-0 px-2 md:px-6 pb-2 md:pb-4 gap-2 md:gap-3">

        {/* 책 제목 */}
        <p className="text-[#f4e4bc] text-sm font-bold tracking-wide shrink-0 truncate max-w-full px-2">
          {story.title ?? `${story.genre} · ${story.era}`}
        </p>

        {/* 책 본체 */}
        <div
          ref={bookContainerRef}
          className="w-full max-w-5xl relative flex-1 min-h-0 flex items-center justify-center"
        >
          {/* 가죽 외장 */}
          <div className="absolute inset-[-6px] md:inset-[-10px] rounded-xl bg-[#3e2723] shadow-[0_24px_80px_rgba(0,0,0,0.95)] border border-[#261714]" />
          {/* 금장 테두리 */}
          <div className="absolute inset-[-4px] md:inset-[-7px] rounded-xl border border-[#8d6e63]/30 pointer-events-none" />

          {bookSize.w > 0 && bookSize.h > 0 && (
            <div className="relative z-10 overflow-hidden rounded-lg">
              <DynamicBookReader
                ref={bookReaderRef}
                pages={bookPages}
                story={story}
                generatingChapterId={null}
                onGenerate={undefined}
                onPageChange={(pi) => setPageIndex(pi)}
                startPage={0}
                width={Math.max(120, isMobile ? bookSize.w : Math.floor(bookSize.w / 2))}
                height={bookSize.h}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>

        {/* 하단 내비게이션 */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <motion.button
            onClick={handleFlipPrev}
            disabled={!canGoPrev}
            whileHover={{ scale: canGoPrev ? 1.04 : 1 }}
            whileTap={{ scale: 0.96 }}
            className="px-4 md:px-6 py-2 bg-[#5d4037]/80 hover:bg-[#5d4037] text-[#d4b483] text-xs md:text-sm rounded border border-[#8d6e63]/50 tracking-widest transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ← 이전 장
          </motion.button>

          <span className="text-[#a1887f] text-[11px] tracking-[0.25em] min-w-[70px] text-center">
            {Math.floor(pageIndex / 2) + 1} / {totalSpreads}
          </span>

          <motion.button
            onClick={handleFlipNext}
            disabled={!canGoNext}
            whileHover={{ scale: canGoNext ? 1.04 : 1 }}
            whileTap={{ scale: 0.96 }}
            className="px-4 md:px-6 py-2 bg-[#5d4037]/80 hover:bg-[#5d4037] text-[#d4b483] text-xs md:text-sm rounded border border-[#8d6e63]/50 tracking-widest transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            다음 장 →
          </motion.button>
        </div>

      </div>
    </main>
  )
}
