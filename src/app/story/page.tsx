// src/app/story/page.tsx
'use client'

import { motion } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useStoryStore, StoryContext } from '@/store/storyStore'
import GridLoader from '../../GridLoader'
import { useIsClient } from '@/hooks/useIsClient'
import { useAuthGuard } from '@/hooks/useAuthGuard'

const HERO_IMAGE_FILENAME = '마리북-음유시인bard-hero.png.png'

interface ChatMessage {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

// JSON 블록을 제거한 순수 대화 텍스트 반환
function stripJson(text: string): string {
  return text.replace(/```json[\s\S]*?```/g, '').trim()
}

export default function StoryPage() {
  const router = useRouter()
  const isClient = useIsClient()
  const { loading: authLoading } = useAuthGuard()

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [displayMessages, setDisplayMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [collectedContext, setCollectedContext] = useState<StoryContext | null>(null)

  const { setStoryContext } = useStoryStore()
  const bardScrollRef = useRef<HTMLDivElement>(null)
  const userScrollRef = useRef<HTMLDivElement>(null)

  // 루미스 첫 인사 요청 (마운트 시)
  const fetchBardReply = useCallback(async (history: ChatMessage[]) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/bard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      const bardText: string = data.reply ?? ''
      const storyContext: StoryContext | null = data.storyContext ?? null

      const newModelMsg: ChatMessage = { role: 'model', parts: [{ text: bardText }] }
      setChatHistory(prev => [...prev, newModelMsg])
      setDisplayMessages(prev => [...prev, { role: 'model', text: stripJson(bardText) }])

      if (storyContext) {
        setCollectedContext(storyContext)
        setStoryContext(storyContext)
        setTimeout(() => setIsFlipped(true), 1500)
      }
    } catch (e) {
      console.error(e)
      setDisplayMessages(prev => [...prev, { role: 'model', text: '...(루미스가 잠시 말을 잃었습니다)' }])
    } finally {
      setIsLoading(false)
    }
  }, [setStoryContext])

  useEffect(() => {
    // 첫 번째 루미스 메시지 요청 (빈 대화로 시작)
    fetchBardReply([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 스크롤 자동 하단
  useEffect(() => {
    bardScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    userScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading || isFlipped) return

    const userText = input.trim()
    setInput('')

    const userMsg: ChatMessage = { role: 'user', parts: [{ text: userText }] }
    const newHistory = [...chatHistory, userMsg]
    setChatHistory(newHistory)
    setDisplayMessages(prev => [...prev, { role: 'user', text: userText }])

    await fetchBardReply(newHistory)
  }

  const handleCreateStory = (storyType: 'short' | 'long') => {
    setNavigating(true)
    router.push(storyType === 'short' ? '/short-story' : '/long-story')
  }

  if (!isClient || authLoading || navigating) {
    return (
      <main className="min-h-screen bg-[#1a1412] flex flex-col items-center justify-center p-4">
        <GridLoader color="#d4b483" />
        <p className="mt-8 text-lg text-[#d4b483] font-serif tracking-widest animate-pulse">양피지에 별빛을 새기는 중...</p>
      </main>
    )
  }

  const bardMessages = displayMessages.filter(m => m.role === 'model')
  const userMessages = displayMessages.filter(m => m.role === 'user')

  return (
    <main className="min-h-screen bg-[#1a1412] flex items-center justify-center p-4 md:p-10 overflow-hidden font-serif relative">
      {/* 어두운 배경 조명 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(60,40,20,0.4),_transparent_80%)] pointer-events-none" />

      {/* 3D 책 컨테이너 */}
      <div
        className="relative w-full max-w-6xl aspect-[4/3] md:aspect-[2/1] perspective-[2500px]"
        style={{ perspective: '2500px' }}
      >
        {/* 책의 뒷배경 가죽 커버 */}
        <div className="absolute inset-[-10px] bg-[#3e2723] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#261714]" />

        {/* 책 내부 페이지 래퍼 */}
        <div className="relative w-full h-full flex rounded-lg overflow-visible shadow-inner">

          {/* ==================== 왼쪽 페이지 (루미스 대화 로그) ==================== */}
          <div className="relative w-1/2 h-full bg-[#f4e4bc] border-r border-[#d4b483] shadow-[inset_-20px_0_30px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-20 pointer-events-none" />

            {/* 캐릭터 영역 */}
            <div className="p-8 pb-4 flex flex-col items-center justify-center shrink-0 border-b border-[#d4b483]/50">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[#8d6e63] shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                <div className="absolute bottom-4 left-4 w-20 h-20 bg-yellow-400/30 blur-[20px] z-0 rounded-full" />
                <Image src={`/${HERO_IMAGE_FILENAME}`} alt="루미스" fill className="object-cover relative z-10" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#5d4037] tracking-wider">루미스</h2>
            </div>

            {/* 루미스 대화 로그 */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 hide-scrollbar">
              {bardMessages.map((msg, idx) => (
                <motion.div
                  key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="text-lg leading-relaxed text-[#3e2723]"
                >
                  <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-[#8d6e63] drop-shadow-sm">
                    &ldquo;{msg.text}&rdquo;
                  </p>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-lg text-[#8d6e63] italic"
                >
                  루미스가 류트를 고르고 있습니다
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >...</motion.span>
                </motion.div>
              )}
              <div ref={bardScrollRef} className="h-4" />
            </div>
          </div>

          {/* ==================== 드러난 오른쪽 페이지 (책장 넘어간 뒤) ==================== */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#f4e4bc] shadow-[inset_20px_0_30px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-12 z-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-20 pointer-events-none" />
            <h3 className="text-3xl font-bold text-[#5d4037] mb-10 text-center">이제, 조각을 엮을 시간입니다</h3>
            <div className="w-full space-y-6">
              <button
                onClick={() => handleCreateStory('short')}
                className="w-full py-5 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-xl rounded shadow-lg transition-all border border-[#5d4037] flex justify-center items-center gap-3"
              >
                📖 단편 소설 짓기
              </button>
              <button
                onClick={() => handleCreateStory('long')}
                className="w-full py-5 bg-[#d4b483] hover:bg-[#c6a165] text-[#3e2723] text-xl font-bold rounded shadow-lg transition-all border border-[#8d6e63] flex justify-center items-center gap-3"
              >
                ✨ 장편 소설로 엮기
              </button>
            </div>
          </div>

          {/* ==================== 넘기는 오른쪽 페이지 (동적/사용자) ==================== */}
          <motion.div
            className="absolute top-0 right-0 w-1/2 h-full origin-left z-10"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? -180 : 0 }}
            transition={{ duration: 1.5, ease: [0.645, 0.045, 0.355, 1.000] }}
          >
            {/* ---- 앞면 (사용자 입력창) ---- */}
            <div
              className="absolute inset-0 bg-[#f4e4bc] shadow-[inset_20px_0_30px_rgba(0,0,0,0.15)] flex flex-col"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-20 pointer-events-none" />

              <div className="p-8 border-b border-[#d4b483]/50 text-right">
                <h2 className="text-2xl font-bold text-[#5d4037] tracking-wider">나의 이야기</h2>
              </div>

              {/* 사용자 대화 로그 */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
                {userMessages.map((msg, idx) => (
                  <motion.div
                    key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-right"
                  >
                    <p className="inline-block text-lg leading-relaxed text-[#3e2723] border-b border-[#a1887f] pb-1">
                      {msg.text}
                    </p>
                  </motion.div>
                ))}
                <div ref={userScrollRef} className="h-4" />
              </div>

              {/* 입력창 */}
              <div className="p-8 bg-[#e8dcc4] border-t border-[#d4b483] shrink-0">
                <form onSubmit={handleSend} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading || isFlipped}
                    placeholder={isLoading ? '루미스가 이야기를 듣고 있습니다...' : '잉크를 찍어 답변을 적어주세요...'}
                    className="w-full bg-transparent border-b-2 border-[#8d6e63] px-4 py-3 text-xl text-[#3e2723] focus:outline-none focus:border-[#5d4037] transition-colors placeholder-[#a1887f] disabled:opacity-50"
                  />
                  {!isLoading && !isFlipped && (
                    <button type="submit" className="absolute right-0 bottom-3 text-[#5d4037] hover:text-[#3e2723] font-bold px-4">
                      기록하기
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* ---- 뒷면 (수집된 이야기 조각) ---- */}
            <div
              className="absolute inset-0 bg-[#f4e4bc] shadow-[inset_-20px_0_30px_rgba(0,0,0,0.15)] flex flex-col items-center p-10 overflow-y-auto hide-scrollbar"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-20 pointer-events-none" />

              <h2 className="text-2xl font-bold text-[#5d4037] mb-6 border-b-2 border-[#8d6e63] pb-3 w-full max-w-sm text-center shrink-0">수집된 이야기 조각</h2>

              {collectedContext && (
                <ul className="space-y-4 text-base text-[#3e2723] w-full max-w-sm shrink-0">
                  <li className="flex flex-col gap-1 border-b border-[#d4b483] pb-3">
                    <span className="font-bold text-[#8d6e63] text-sm tracking-wider">세계와 분위기</span>
                    <span>{collectedContext.genre}</span>
                  </li>
                  <li className="flex flex-col gap-1 border-b border-[#d4b483] pb-3">
                    <span className="font-bold text-[#8d6e63] text-sm tracking-wider">주인공의 흉터</span>
                    <span>{collectedContext.characterFlaw}</span>
                  </li>
                  <li className="flex flex-col gap-1 border-b border-[#d4b483] pb-3">
                    <span className="font-bold text-[#8d6e63] text-sm tracking-wider">주인공의 열망</span>
                    <span>{collectedContext.goal}</span>
                  </li>
                  <li className="flex flex-col gap-1 border-b border-[#d4b483] pb-3">
                    <span className="font-bold text-[#8d6e63] text-sm tracking-wider">가로막는 운명</span>
                    <span>{collectedContext.conflict}</span>
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="font-bold text-[#8d6e63] text-sm tracking-wider">이야기의 선율</span>
                    <span>{collectedContext.bgmMood}</span>
                  </li>
                </ul>
              )}
            </div>

          </motion.div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  )
}
