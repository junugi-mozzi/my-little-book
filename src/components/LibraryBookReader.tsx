// src/components/LibraryBookReader.tsx
'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import BookCover from '@/components/BookCover'

// ── 타입 ─────────────────────────────────────────────────────────────────────

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
  is_public?: boolean
  view_count: number
}

type BookPage =
  | { kind: 'cover' }
  | { kind: 'synopsis' }
  | { kind: 'locked' }
  | { kind: 'chapter-title'; chapterId: number; chapterTitle: string; summary: string }
  | { kind: 'pending'; chapterId: number; chapterTitle: string }
  | { kind: 'text'; text: string; pageNum: number; totalPages: number; chapterLabel?: string }
  | { kind: 'blank' }

// ── PageContent ──────────────────────────────────────────────────────────────

interface PageContentProps {
  page: BookPage | null
  side: 'left' | 'right'
  story: Story
  generatingChapterId: number | null
  onGenerate?: (chapterId: number) => void
  onPurchase?: () => void
  purchasing?: boolean
}

function PageContent({ page, side, story, generatingChapterId, onGenerate, onPurchase, purchasing }: PageContentProps) {
  const textureOverlay = (
    <div
      className="absolute inset-0 opacity-[0.17] pointer-events-none"
      style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
    />
  )

  if (!page || page.kind === 'blank') {
    return (
      <div className="absolute inset-0 bg-[#f4e4bc]">
        {textureOverlay}
        <div className="flex-1 h-full flex items-center justify-center opacity-15">
          <span className="text-[#8d6e63] text-lg tracking-[0.3em]">✦</span>
        </div>
      </div>
    )
  }

  if (page.kind === 'cover') {
    return (
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #2d1a08, #100900)' }}>
        {textureOverlay}
        <div className="relative w-full h-full">
          <BookCover
            genre={story.genre}
            era={story.era}
            mood={story.mood}
            title={story.title ?? undefined}
            size="full"
            imageUrl={story.cover_url ?? undefined}
          />
        </div>
      </div>
    )
  }

  if (page.kind === 'synopsis') {
    const isLong = story.type === 'long'
    const synopsisText = story.type === 'short'
      ? (story.content ?? '').slice(0, 380) + ((story.content?.length ?? 0) > 380 ? '...' : '')
      : null
    return (
      <div className="absolute inset-0 bg-[#f4e4bc] flex flex-col">
        {textureOverlay}
        <div className="relative flex-1 flex flex-col px-8 py-8 gap-4 overflow-hidden">
          <div className="flex items-center gap-3 opacity-45 shrink-0">
            <div className="flex-1 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs">✦</span>
            <div className="flex-1 h-px bg-[#d4b483]" />
          </div>
          <p className="text-[10px] text-[#a1887f] tracking-[0.4em] uppercase text-center shrink-0">
            {isLong ? '차례' : '줄거리'}
          </p>
          {story.title && (
            <h2 className="text-base font-bold text-[#5d4037] tracking-wide text-center leading-snug shrink-0">
              {story.title}
            </h2>
          )}
          <div className="w-12 h-px bg-[#d4b483]/50 mx-auto shrink-0" />
          {isLong ? (
            <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto thin-scrollbar">
              {story.outline?.map((ch, ci) => (
                <div key={ci} className="flex flex-col gap-1">
                  <p className="text-[11px] font-bold text-[#8d6e63] tracking-wide">
                    제{ch.id}장 · {ch.title}
                  </p>
                  {ch.summary && (
                    <p className="text-[10px] text-[#a07050] italic leading-relaxed">
                      {ch.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#5d4037] leading-[2.0] italic overflow-hidden"
               style={{ fontFamily: 'Georgia, "Noto Serif KR", serif' }}>
              {synopsisText}
            </p>
          )}
          <div className="mt-auto flex items-center gap-3 opacity-45 shrink-0">
            <div className="flex-1 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs">✦</span>
            <div className="flex-1 h-px bg-[#d4b483]" />
          </div>
        </div>
      </div>
    )
  }

  if (page.kind === 'locked') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #1e0f05, #0e0600)' }}
      >
        {textureOverlay}
        <div className="relative flex flex-col items-center gap-5 px-8 text-center">
          <div className="flex items-center gap-3 w-full opacity-30">
            <div className="flex-1 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs">✦</span>
            <div className="flex-1 h-px bg-[#d4b483]" />
          </div>
          <span className="text-5xl opacity-40">🔒</span>
          <p className="text-[#d4b483] text-sm font-bold tracking-wide">이 이야기는 잠겨 있습니다</p>
          <p className="text-[#a1887f] text-xs leading-relaxed italic">
            소장하면 이 이야기 전체를<br />나의 서재에서 읽을 수 있습니다.
          </p>
          {onPurchase && (
            <button
              onClick={onPurchase}
              disabled={purchasing}
              className="mt-2 px-6 py-2.5 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-xs rounded border border-[#5d4037] tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {purchasing ? (
                <><span className="w-3 h-3 border border-[#f4e4bc]/40 border-t-[#f4e4bc] rounded-full animate-spin inline-block" />소장 중...</>
              ) : '✦ 소장하기'}
            </button>
          )}
          <div className="flex items-center gap-3 w-full opacity-30 mt-2">
            <div className="flex-1 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs">✦</span>
            <div className="flex-1 h-px bg-[#d4b483]" />
          </div>
        </div>
      </div>
    )
  }

  if (page.kind === 'chapter-title') {
    return (
      <div className="absolute inset-0 bg-[#f4e4bc] flex flex-col items-center justify-center">
        {textureOverlay}
        <div className="relative flex flex-col items-center gap-4 px-8 text-center">
          <div className="flex items-center gap-3 w-full opacity-45">
            <div className="flex-1 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs">✦</span>
            <div className="flex-1 h-px bg-[#d4b483]" />
          </div>
          <div className="flex flex-col items-center gap-0">
            <span className="text-[10px] text-[#a1887f] tracking-[0.4em] uppercase">제</span>
            <span className="text-5xl font-bold text-[#8d6e63] leading-none">{page.chapterId}</span>
            <span className="text-[10px] text-[#a1887f] tracking-[0.4em] uppercase">장</span>
          </div>
          <h3 className="text-lg font-bold text-[#5d4037] tracking-wide leading-snug">
            {page.chapterTitle}
          </h3>
          <div className="w-16 h-px bg-[#d4b483]/50" />
          <p className="text-[#8d6e63] text-xs italic leading-relaxed px-2">
            {page.summary}
          </p>
          <div className="flex items-center gap-3 w-full opacity-45 mt-2">
            <div className="flex-1 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs">✦</span>
            <div className="flex-1 h-px bg-[#d4b483]" />
          </div>
        </div>
      </div>
    )
  }

  if (page.kind === 'pending') {
    const isGenerating = generatingChapterId === page.chapterId
    const prevChapter = story.outline?.find(c => c.id === page.chapterId - 1)
    const isBlocked = page.chapterId > 1 && prevChapter?.status !== 'completed'
    return (
      <div className="absolute inset-0 bg-[#f4e4bc] flex flex-col items-center justify-center">
        {textureOverlay}
        <div className="relative flex flex-col items-center gap-5 px-8 text-center">
          <div className="flex items-center gap-3 w-full opacity-40">
            <div className="flex-1 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs">✦</span>
            <div className="flex-1 h-px bg-[#d4b483]" />
          </div>
          <span className="text-4xl opacity-25">{isBlocked ? '🔒' : '✒'}</span>
          <p className="text-[#8d6e63] text-sm italic leading-relaxed">
            {isBlocked ? (
              <>
                이전 챕터를 먼저 완성해 주세요.
                <br />
                <span className="text-[10px]">순서대로 이야기를 엮어야 합니다...</span>
              </>
            ) : (
              <>
                이 챕터는 아직 집필되지 않았습니다.
                <br />
                <span className="text-[10px]">양피지가 비어 있습니다...</span>
              </>
            )}
          </p>
          <p className="text-[#a1887f] text-[11px]">
            제{page.chapterId}장 · {page.chapterTitle}
          </p>
          {!isBlocked && onGenerate && (
            <button
              onClick={() => onGenerate(page.chapterId)}
              disabled={generatingChapterId !== null}
              className="px-5 py-2.5 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-xs rounded border border-[#5d4037] tracking-widest transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-3 h-3 border border-[#f4e4bc]/40 border-t-[#f4e4bc] rounded-full animate-spin inline-block" />
                  집필 중...
                </>
              ) : '✒ 이 챕터 집필하기'}
            </button>
          )}
          <div className="flex items-center gap-3 w-full opacity-40">
            <div className="flex-1 h-px bg-[#d4b483]" />
            <span className="text-[#d4b483] text-xs">✦</span>
            <div className="flex-1 h-px bg-[#d4b483]" />
          </div>
        </div>
      </div>
    )
  }

  // kind === 'text'
  return (
    <div className="absolute inset-0 bg-[#f4e4bc] flex flex-col">
      {textureOverlay}
      {page.chapterLabel && (
        <div className={`relative shrink-0 px-6 pt-3 pb-2 border-b border-[#d4b483]/30 ${side === 'left' ? 'text-left' : 'text-right'}`}>
          <span className="text-[10px] text-[#a1887f] tracking-[0.2em] italic">
            {page.chapterLabel}
          </span>
        </div>
      )}
      <div className="relative flex-1 px-7 py-5 overflow-hidden">
        <p
          className="text-[#3e2723] text-[13px] leading-[2.0] whitespace-pre-wrap"
          style={{ fontFamily: 'Georgia, "Noto Serif KR", serif' }}
        >
          {page.pageNum === 1 && !page.chapterLabel ? (
            <>
              <span
                className="float-left font-bold text-[#8d6e63] mr-2"
                style={{ fontSize: '3.5em', lineHeight: '0.82', marginTop: '2px' }}
              >
                {page.text.charAt(0)}
              </span>
              {page.text.slice(1)}
            </>
          ) : page.text}
        </p>
      </div>
      <div className={`relative shrink-0 px-6 pb-3 pt-2 border-t border-[#d4b483]/20 flex ${side === 'left' ? 'justify-start' : 'justify-end'}`}>
        <span className="text-[10px] text-[#a1887f] tracking-[0.2em]">
          — {page.pageNum} / {page.totalPages} —
        </span>
      </div>
    </div>
  )
}

// ── PageWrapper (react-pageflip 자식은 forwardRef 필수) ──────────────────────

const PageWrapper = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div
      ref={ref}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      {children}
    </div>
  )
)
PageWrapper.displayName = 'PageWrapper'

// ── LibraryBookReader ────────────────────────────────────────────────────────

export interface LibraryBookReaderHandle {
  flipNext: () => void
  flipPrev: () => void
}

interface LibraryBookReaderProps {
  pages: BookPage[]
  story: Story
  generatingChapterId: number | null
  onGenerate?: (chapterId: number) => void
  onPageChange: (pageIndex: number) => void
  onPurchase?: () => void
  purchasing?: boolean
  startPage?: number
  width: number
  height: number
  isMobile?: boolean
}

const LibraryBookReader = forwardRef<LibraryBookReaderHandle, LibraryBookReaderProps>(
  ({ pages, story, generatingChapterId, onGenerate, onPageChange, onPurchase, purchasing, startPage = 0, width, height, isMobile = false }, ref) => {
    const bookRef = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } } | null>(null)

    useImperativeHandle(ref, () => ({
      flipNext: () => bookRef.current?.pageFlip()?.flipNext(),
      flipPrev: () => bookRef.current?.pageFlip()?.flipPrev(),
    }))

    if (width <= 0 || height <= 0) return null

    return (
      <>
      <HTMLFlipBook
        ref={bookRef}
        width={width}
        height={height}
        minWidth={100}
        maxWidth={2000}
        minHeight={100}
        maxHeight={3000}
        size="fixed"
        startPage={startPage}
        startZIndex={0}
        autoSize={false}
        drawShadow={true}
        flippingTime={900}
        showCover={true}
        usePortrait={isMobile}
        mobileScrollSupport={true}
        maxShadowOpacity={0.6}
        showPageCorners={true}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={30}
        disableFlipByClick={false}
        onFlip={(e: { data: number }) => onPageChange(e.data)}
        style={{ margin: '0 auto' }}
        className=""
      >
        {pages.map((page, i) => (
          <PageWrapper key={i}>
            <PageContent
              page={page}
              side={i % 2 === 0 ? 'left' : 'right'}
              story={story}
              generatingChapterId={generatingChapterId}
              onGenerate={onGenerate}
              onPurchase={onPurchase}
              purchasing={purchasing}
            />
          </PageWrapper>
        ))}
      </HTMLFlipBook>
      <style dangerouslySetInnerHTML={{ __html: `
        .thin-scrollbar::-webkit-scrollbar { width: 3px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #8d6e63; border-radius: 9999px; }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4b483; }
        .thin-scrollbar { scrollbar-width: thin; scrollbar-color: #8d6e63 transparent; }
      `}} />
      </>
    )
  }
)
LibraryBookReader.displayName = 'LibraryBookReader'

export default LibraryBookReader
